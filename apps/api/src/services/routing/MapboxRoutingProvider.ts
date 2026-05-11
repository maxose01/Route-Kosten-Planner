import type {
  LocationSuggestion,
  RouteEfficiencyProfile,
  RouteInstruction,
  RouteResult
} from "@route-cost/shared";

import { env } from "../../config/env.js";
import { AppError } from "../../types/errors.js";
import type { RoutingProvider } from "./RoutingProvider.js";

interface GeocodeFeature {
  place_name?: string;
  text?: string;
  center: [number, number];
}

interface GeocodeResponse {
  features: GeocodeFeature[];
}

interface DirectionsStep {
  distance: number;
  duration: number;
  name?: string;
  maneuver: {
    type: string;
    modifier?: string;
    instruction: string;
    location: [number, number];
  };
}

interface DirectionsLeg {
  steps: DirectionsStep[];
  annotation?: {
    speed?: number[];
    distance?: number[];
    duration?: number[];
  };
}

interface DirectionsRoute {
  distance: number;
  duration: number;
  geometry: string;
  legs: DirectionsLeg[];
}

interface DirectionsResponse {
  code?: string;
  message?: string;
  routes: DirectionsRoute[];
}

interface MapboxErrorResponse {
  code?: string;
  message?: string;
}

const COORDINATE_INPUT = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;
const MAX_SUGGESTION_LIMIT = 8;

export class MapboxRoutingProvider implements RoutingProvider {
  private readonly token: string;

  constructor() {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      throw new AppError("ROUTING_PROVIDER_ERROR", "Mapbox access token ontbreekt in backend configuratie.", 500);
    }

    this.token = env.MAPBOX_ACCESS_TOKEN;
  }

  async calculateRoute(origin: string, destination: string): Promise<RouteResult> {
    const routes = await this.calculateRouteOptions(origin, destination);
    return routes[0];
  }

  async calculateRouteOptions(origin: string, destination: string): Promise<RouteResult[]> {
    const originCoordinates = await this.resolveCoordinates(origin);
    const destinationCoordinates = await this.resolveCoordinates(destination);

    const routeUrl = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates.join(",")};${destinationCoordinates.join(",")}`
    );

    routeUrl.searchParams.set("overview", "full");
    routeUrl.searchParams.set("geometries", "polyline");
    routeUrl.searchParams.set("alternatives", "true");
    routeUrl.searchParams.set("steps", "true");
    routeUrl.searchParams.set("annotations", "speed,distance,duration");
    routeUrl.searchParams.set("language", "nl");
    routeUrl.searchParams.set("roundabout_exits", "true");
    routeUrl.searchParams.set("access_token", this.token);

    const directionsResponse = await this.safeFetch(routeUrl);

    if (!directionsResponse.ok) {
      const errorMessage = await this.mapMapboxHttpError(
        directionsResponse,
        "Kaartdienst kon de route niet berekenen."
      );
      throw new AppError("ROUTING_PROVIDER_ERROR", errorMessage, 502);
    }

    const directionsData = await this.parseMapboxJson<DirectionsResponse>(
      directionsResponse,
      "Kaartdienst gaf een onleesbare route-response terug."
    );
    if (directionsData.code === "NoRoute") {
      throw new AppError("ROUTE_NOT_FOUND", "Geen route gevonden tussen deze locaties.", 404);
    }

    const routes = directionsData.routes ?? [];

    if (routes.length === 0) {
      throw new AppError("ROUTE_NOT_FOUND", "Geen route gevonden tussen deze locaties.", 404);
    }

    return routes.map((route) => this.mapRouteResult(route, origin, destination));
  }

  async suggestLocations(query: string, limit: number): Promise<LocationSuggestion[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    const normalizedLimit = Math.min(Math.max(Math.round(limit), 1), MAX_SUGGESTION_LIMIT);
    const features = await this.fetchGeocodeFeatures(trimmedQuery, normalizedLimit);

    return features
      .filter((feature) => Array.isArray(feature.center) && feature.center.length === 2)
      .map((feature) => {
        const [lng, lat] = feature.center;
        const label = feature.place_name ?? feature.text ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        return {
          label,
          value: label,
          location: {
            lat,
            lng
          }
        };
      });
  }

  private async resolveCoordinates(location: string): Promise<[number, number]> {
    const parsedCoordinates = this.parseCoordinateInput(location);

    if (parsedCoordinates) {
      return parsedCoordinates;
    }

    return this.geocode(location);
  }

  private parseCoordinateInput(location: string): [number, number] | null {
    const match = COORDINATE_INPUT.exec(location);

    if (!match) {
      return null;
    }

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    const valid =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    if (!valid) {
      return null;
    }

    return [longitude, latitude];
  }

  private mapInstructions(legs: DirectionsLeg[]): RouteInstruction[] {
    const instructions: RouteInstruction[] = [];
    let instructionIndex = 0;

    for (const leg of legs ?? []) {
      for (const step of leg.steps ?? []) {
        if (!step.maneuver?.instruction || !step.maneuver.location) {
          continue;
        }

        const [lng, lat] = step.maneuver.location;

        instructions.push({
          index: instructionIndex,
          instruction: step.maneuver.instruction,
          distanceMeters: Math.max(0, Math.round(step.distance)),
          durationSeconds: Math.max(0, Math.round(step.duration)),
          maneuverType: step.maneuver.type,
          maneuverModifier: step.maneuver.modifier,
          roadName: step.name,
          location: {
            lat,
            lng
          }
        });

        instructionIndex += 1;
      }
    }

    return instructions;
  }

  private mapRouteResult(route: DirectionsRoute, origin: string, destination: string): RouteResult {
    const instructions = this.mapInstructions(route.legs);

    return {
      origin,
      destination,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      polyline: route.geometry,
      instructions,
      efficiencyProfile: this.mapEfficiencyProfile(route)
    };
  }

  private mapEfficiencyProfile(route: DirectionsRoute): RouteEfficiencyProfile {
    const totalDistanceMeters = Math.max(route.distance, 1);
    const averageSpeedKmh = Math.max(1, Math.round((route.distance / Math.max(route.duration, 1)) * 3.6));
    let weightedSpeedDistanceMeters = 0;
    let weightedSpeedSum = 0;
    let highwayDistanceMeters = 0;
    let urbanDistanceMeters = 0;

    for (const leg of route.legs ?? []) {
      const distances = leg.annotation?.distance ?? [];
      const speeds = leg.annotation?.speed ?? [];
      const segmentCount = Math.min(distances.length, speeds.length);

      for (let index = 0; index < segmentCount; index += 1) {
        const segmentDistance = distances[index];
        const segmentSpeedMs = speeds[index];

        if (!Number.isFinite(segmentDistance) || segmentDistance <= 0 || !Number.isFinite(segmentSpeedMs)) {
          continue;
        }

        const segmentSpeedKmh = segmentSpeedMs * 3.6;
        weightedSpeedDistanceMeters += segmentDistance;
        weightedSpeedSum += segmentSpeedKmh * segmentDistance;

        if (segmentSpeedKmh >= 78) {
          highwayDistanceMeters += segmentDistance;
        } else if (segmentSpeedKmh <= 45) {
          urbanDistanceMeters += segmentDistance;
        }
      }
    }

    if (weightedSpeedDistanceMeters > 0) {
      const weightedAverageSpeed = weightedSpeedSum / weightedSpeedDistanceMeters;
      const adjustedAverageSpeed = Math.max(1, Math.round(weightedAverageSpeed));

      return {
        averageSpeedKmh: adjustedAverageSpeed,
        highwayShare: Math.min(1, Math.max(0, highwayDistanceMeters / totalDistanceMeters)),
        urbanShare: Math.min(1, Math.max(0, urbanDistanceMeters / totalDistanceMeters))
      };
    }

    const fallbackHighwayShare = averageSpeedKmh >= 85 ? 0.72 : averageSpeedKmh >= 65 ? 0.5 : 0.3;
    const fallbackUrbanShare = averageSpeedKmh <= 35 ? 0.68 : averageSpeedKmh <= 55 ? 0.45 : 0.22;

    return {
      averageSpeedKmh,
      highwayShare: fallbackHighwayShare,
      urbanShare: Math.min(1, fallbackUrbanShare)
    };
  }

  private async geocode(location: string): Promise<[number, number]> {
    const features = await this.fetchGeocodeFeatures(location, 1);
    const firstFeature = features[0];

    if (!firstFeature) {
      throw new AppError("ROUTE_NOT_FOUND", `Locatie niet gevonden: ${location}.`, 404);
    }

    return firstFeature.center;
  }

  private async fetchGeocodeFeatures(location: string, limit: number): Promise<GeocodeFeature[]> {
    const geocodeUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`
    );

    geocodeUrl.searchParams.set("autocomplete", "true");
    geocodeUrl.searchParams.set("language", "nl");
    geocodeUrl.searchParams.set("limit", String(limit));
    geocodeUrl.searchParams.set("access_token", this.token);

    const geocodeResponse = await this.safeFetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      const errorMessage = await this.mapMapboxHttpError(
        geocodeResponse,
        "Kaartdienst kon locatie niet omzetten naar coördinaten."
      );
      throw new AppError("ROUTING_PROVIDER_ERROR", errorMessage, 502);
    }

    const geocodeData = await this.parseMapboxJson<GeocodeResponse>(
      geocodeResponse,
      "Kaartdienst gaf een onleesbare geocode-response terug."
    );

    return geocodeData.features ?? [];
  }

  private async safeFetch(url: URL): Promise<Response> {
    try {
      return await fetch(url);
    } catch {
      throw new AppError(
        "ROUTING_PROVIDER_ERROR",
        "Kan geen verbinding maken met de kaartdienst. Controleer je internetverbinding of Mapbox-toegang.",
        503
      );
    }
  }

  private async mapMapboxHttpError(response: Response, fallbackMessage: string): Promise<string> {
    const payload = (await response.json().catch(() => null)) as MapboxErrorResponse | null;
    const providerMessage = payload?.message?.trim();

    if (response.status === 401 || response.status === 403) {
      return "Mapbox API key is ongeldig of heeft onvoldoende rechten.";
    }

    if (response.status === 422 && providerMessage) {
      return `Route-aanvraag ongeldig: ${providerMessage}`;
    }

    return providerMessage ? `${fallbackMessage} (${providerMessage})` : fallbackMessage;
  }

  private async parseMapboxJson<T>(response: Response, fallbackMessage: string): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new AppError("ROUTING_PROVIDER_ERROR", fallbackMessage, 502);
    }
  }
}
