import type { RouteInstruction, RouteResult } from "@route-cost/shared";

import { env } from "../../config/env";
import { AppError } from "../../types/errors";
import type { RoutingProvider } from "./RoutingProvider";

interface GeocodeFeature {
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

export class MapboxRoutingProvider implements RoutingProvider {
  private readonly token: string;

  constructor() {
    if (!env.MAPBOX_ACCESS_TOKEN) {
      throw new AppError("ROUTING_PROVIDER_ERROR", "Mapbox access token ontbreekt in backend configuratie.", 500);
    }

    this.token = env.MAPBOX_ACCESS_TOKEN;
  }

  async calculateRoute(origin: string, destination: string): Promise<RouteResult> {
    const originCoordinates = await this.resolveCoordinates(origin);
    const destinationCoordinates = await this.resolveCoordinates(destination);

    const routeUrl = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates.join(",")};${destinationCoordinates.join(",")}`
    );

    routeUrl.searchParams.set("overview", "full");
    routeUrl.searchParams.set("geometries", "polyline");
    routeUrl.searchParams.set("alternatives", "false");
    routeUrl.searchParams.set("steps", "true");
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

    const directionsData = (await directionsResponse.json()) as DirectionsResponse;
    if (directionsData.code === "NoRoute") {
      throw new AppError("ROUTE_NOT_FOUND", "Geen route gevonden tussen deze locaties.", 404);
    }

    const firstRoute = directionsData.routes?.[0];

    if (!firstRoute) {
      throw new AppError("ROUTE_NOT_FOUND", "Geen route gevonden tussen deze locaties.", 404);
    }

    const instructions = this.mapInstructions(firstRoute.legs);

    return {
      origin,
      destination,
      distanceKm: Math.round((firstRoute.distance / 1000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(firstRoute.duration / 60)),
      polyline: firstRoute.geometry,
      instructions
    };
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

  private async geocode(location: string): Promise<[number, number]> {
    const geocodeUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`
    );

    geocodeUrl.searchParams.set("limit", "1");
    geocodeUrl.searchParams.set("access_token", this.token);

    const geocodeResponse = await this.safeFetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      const errorMessage = await this.mapMapboxHttpError(
        geocodeResponse,
        "Kaartdienst kon locatie niet omzetten naar coördinaten."
      );
      throw new AppError("ROUTING_PROVIDER_ERROR", errorMessage, 502);
    }

    const geocodeData = (await geocodeResponse.json()) as GeocodeResponse;
    const firstFeature = geocodeData.features?.[0];

    if (!firstFeature) {
      throw new AppError("ROUTE_NOT_FOUND", `Locatie niet gevonden: ${location}.`, 404);
    }

    return firstFeature.center;
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
}
