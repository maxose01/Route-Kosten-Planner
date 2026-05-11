import type {
  CalculateTransitRequest,
  CalculateTransitResponse,
  TransitLeg,
  TransitRouteOption
} from "@route-cost/shared";

import { env } from "../config/env.js";
import { AppError } from "../types/errors.js";
import { getRoutingProvider } from "./routing/providerFactory.js";

interface TransitousPlace {
  name?: string;
  stopId?: string;
}

interface TransitousLeg {
  mode?: string;
  from?: TransitousPlace;
  to?: TransitousPlace;
  startTime?: string;
  endTime?: string;
  duration?: number;
  distance?: number | null;
  routeShortName?: string;
  routeLongName?: string;
  displayName?: string;
  agencyName?: string;
}

interface TransitousFareProduct {
  amount?: number;
  currency?: string;
}

interface TransitousFareTransfer {
  effectiveFareLegProducts?: unknown[];
  transferProducts?: TransitousFareProduct[];
}

interface TransitousItinerary {
  duration?: number;
  startTime?: string;
  endTime?: string;
  transfers?: number;
  legs?: TransitousLeg[];
  fareTransfers?: TransitousFareTransfer[];
}

interface TransitousPlanResponse {
  itineraries?: TransitousItinerary[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

const COORDINATE_INPUT = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;
const NL_BOUNDS = {
  minLat: 50.7,
  maxLat: 53.7,
  minLng: 3.2,
  maxLng: 7.3
};
const MAX_TRANSIT_OPTIONS = 5;

const TRAIN_MODES = new Set([
  "RAIL",
  "REGIONAL_RAIL",
  "LONG_DISTANCE",
  "HIGHSPEED_RAIL",
  "NIGHT_RAIL",
  "SLEEPER_RAIL",
  "URBAN_RAIL"
]);

const BTM_MODES = new Set(["BUS", "TRAM", "SUBWAY", "METRO", "TROLLEYBUS"]);
const WALK_MODES = new Set(["WALK"]);

const MODE_LABELS: Record<string, string> = {
  WALK: "Lopen",
  BUS: "Bus",
  TRAM: "Tram",
  SUBWAY: "Metro",
  METRO: "Metro",
  TROLLEYBUS: "Trolleybus",
  RAIL: "Trein",
  REGIONAL_RAIL: "Trein",
  LONG_DISTANCE: "Trein",
  HIGHSPEED_RAIL: "Trein",
  NIGHT_RAIL: "Nachttrein",
  SLEEPER_RAIL: "Nachttrein",
  URBAN_RAIL: "Trein",
  FERRY: "Veerboot"
};

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toIsoDateTime = (value: string): string => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("VALIDATION_ERROR", "Datum/tijd is ongeldig.", 400);
  }

  return parsed.toISOString();
};

const parseCoordinateInput = (value: string): Coordinates | null => {
  const match = COORDINATE_INPUT.exec(value);

  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
};

const isWithinNetherlands = ({ lat, lng }: Coordinates): boolean => {
  return lat >= NL_BOUNDS.minLat && lat <= NL_BOUNDS.maxLat && lng >= NL_BOUNDS.minLng && lng <= NL_BOUNDS.maxLng;
};

const getModeLabel = (mode: string): string => {
  return MODE_LABELS[mode] ?? mode;
};

const getApproximateSpeedKmhByMode = (mode: string): number => {
  if (TRAIN_MODES.has(mode)) {
    return 86;
  }

  if (mode === "SUBWAY" || mode === "METRO") {
    return 34;
  }

  if (mode === "TRAM") {
    return 22;
  }

  if (mode === "BUS" || mode === "TROLLEYBUS") {
    return 27;
  }

  if (mode === "FERRY") {
    return 20;
  }

  return 30;
};

const estimateDistanceKmForTransitLeg = (leg: TransitousLeg): number => {
  if (typeof leg.distance === "number" && Number.isFinite(leg.distance) && leg.distance > 0) {
    return leg.distance / 1000;
  }

  const durationSeconds = typeof leg.duration === "number" && Number.isFinite(leg.duration) ? leg.duration : 0;
  const durationHours = durationSeconds / 3600;
  const speedKmh = getApproximateSpeedKmhByMode(leg.mode ?? "");

  return durationHours * speedKmh;
};

const parseFareProductAmount = (value: unknown): number | null => {
  if (typeof value !== "object" || !value || !("amount" in value)) {
    return null;
  }

  const amount = (value as TransitousFareProduct).amount;
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return null;
  }

  return amount >= 0 ? amount : null;
};

const extractFareAmountFromTransitous = (itinerary: TransitousItinerary): number | null => {
  const fareTransfers = itinerary.fareTransfers ?? [];
  let totalFare = 0;
  let foundFare = false;

  for (const transfer of fareTransfers) {
    for (const transferProduct of transfer.transferProducts ?? []) {
      if (typeof transferProduct.amount === "number" && Number.isFinite(transferProduct.amount) && transferProduct.amount >= 0) {
        totalFare += transferProduct.amount;
        foundFare = true;
      }
    }

    for (const effectiveFareLeg of transfer.effectiveFareLegProducts ?? []) {
      if (!Array.isArray(effectiveFareLeg)) {
        continue;
      }

      let cheapestFareForLeg: number | null = null;

      for (const candidateGroup of effectiveFareLeg) {
        if (!Array.isArray(candidateGroup)) {
          const singleAmount = parseFareProductAmount(candidateGroup);

          if (singleAmount === null) {
            continue;
          }

          cheapestFareForLeg =
            cheapestFareForLeg === null ? singleAmount : Math.min(cheapestFareForLeg, singleAmount);
          continue;
        }

        for (const candidateProduct of candidateGroup) {
          const amount = parseFareProductAmount(candidateProduct);

          if (amount === null) {
            continue;
          }

          cheapestFareForLeg = cheapestFareForLeg === null ? amount : Math.min(cheapestFareForLeg, amount);
        }
      }

      if (cheapestFareForLeg !== null) {
        totalFare += cheapestFareForLeg;
        foundFare = true;
      }
    }
  }

  return foundFare ? round(totalFare, 2) : null;
};

const estimateFallbackCost = (legs: TransitousLeg[]): number => {
  let railDistanceKm = 0;
  let btmDistanceKm = 0;
  let hasRail = false;
  let hasBtm = false;
  let ferryCount = 0;

  for (const leg of legs) {
    const mode = leg.mode ?? "";

    if (WALK_MODES.has(mode)) {
      continue;
    }

    const distanceKm = estimateDistanceKmForTransitLeg(leg);

    if (TRAIN_MODES.has(mode)) {
      railDistanceKm += distanceKm;
      hasRail = true;
      continue;
    }

    if (BTM_MODES.has(mode)) {
      btmDistanceKm += distanceKm;
      hasBtm = true;
      continue;
    }

    if (mode === "FERRY") {
      ferryCount += 1;
      continue;
    }
  }

  let cost = 0;

  if (hasRail) {
    cost += 2.25 + railDistanceKm * 0.2;
  }

  if (hasBtm) {
    cost += 1.16 + btmDistanceKm * 0.217;
  }

  if (ferryCount > 0) {
    cost += ferryCount * 1.5;
  }

  if (cost <= 0) {
    return 0;
  }

  return round(Math.max(1.2, cost), 2);
};

const buildLegSummary = (leg: TransitLeg): string => {
  if (!leg.isTransitLeg) {
    return `Lopen: ${leg.fromName} → ${leg.toName}`;
  }

  const linePart = leg.lineLabel ? ` (${leg.lineLabel})` : "";
  const agencyPart = leg.agencyName ? ` • ${leg.agencyName}` : "";
  return `${leg.modeLabel}${linePart}: ${leg.fromName} → ${leg.toName}${agencyPart}`;
};

const mapTransitLeg = (leg: TransitousLeg): TransitLeg => {
  const mode = leg.mode ?? "TRANSIT";
  const durationMinutes = Math.max(1, Math.round((leg.duration ?? 0) / 60));
  const lineLabel =
    leg.routeShortName?.trim() ||
    leg.displayName?.trim() ||
    leg.routeLongName?.trim() ||
    undefined;
  const distanceKm =
    typeof leg.distance === "number" && Number.isFinite(leg.distance) && leg.distance > 0
      ? round(leg.distance / 1000, 1)
      : undefined;

  return {
    mode,
    modeLabel: getModeLabel(mode),
    fromName: leg.from?.name?.trim() || "Onbekende locatie",
    toName: leg.to?.name?.trim() || "Onbekende locatie",
    departureTime: leg.startTime ?? "",
    arrivalTime: leg.endTime ?? "",
    durationMinutes,
    lineLabel,
    agencyName: leg.agencyName?.trim() || undefined,
    isTransitLeg: !WALK_MODES.has(mode),
    distanceKm
  };
};

const mapTransitRouteOption = (itinerary: TransitousItinerary, index: number): TransitRouteOption => {
  const legs = (itinerary.legs ?? []).map(mapTransitLeg);
  const transitLegs = legs.filter((leg) => leg.isTransitLeg);
  const estimatedCostFromApi = extractFareAmountFromTransitous(itinerary);
  const estimatedCost = estimatedCostFromApi ?? estimateFallbackCost(itinerary.legs ?? []);
  const fareSource = estimatedCostFromApi !== null ? "api" : "estimated";
  const durationMinutes = Math.max(1, Math.round((itinerary.duration ?? 0) / 60));
  const transfers = Math.max(0, itinerary.transfers ?? Math.max(0, transitLegs.length - 1));
  const mainModes = [...new Set(transitLegs.map((leg) => leg.modeLabel))];
  const modeSummary = mainModes.length > 0 ? mainModes.join(" + ") : "OV";

  return {
    id: `ov-option-${index + 1}`,
    departureTime: itinerary.startTime ?? "",
    arrivalTime: itinerary.endTime ?? "",
    durationMinutes,
    transfers,
    estimatedCost,
    currency: "EUR",
    fareSource,
    summary: `${modeSummary} • ${transfers} overstap${transfers === 1 ? "" : "pen"}`,
    legs
  };
};

const resolveCoordinates = async (location: string): Promise<Coordinates> => {
  const directCoordinates = parseCoordinateInput(location);

  if (directCoordinates) {
    return directCoordinates;
  }

  const provider = getRoutingProvider();
  const suggestions = await provider.suggestLocations(location, 1);
  const firstSuggestion = suggestions[0];

  if (!firstSuggestion) {
    throw new AppError("ROUTE_NOT_FOUND", `Locatie niet gevonden: ${location}.`, 404);
  }

  return firstSuggestion.location;
};

const buildTransitPlanUrl = (from: Coordinates, to: Coordinates, request: CalculateTransitRequest): URL => {
  const baseUrl = env.TRANSIT_API_BASE_URL.replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/api/v5/plan`);

  url.searchParams.set("fromPlace", `${from.lat},${from.lng}`);
  url.searchParams.set("toPlace", `${to.lat},${to.lng}`);
  url.searchParams.set("time", toIsoDateTime(request.dateTime));
  url.searchParams.set("arriveBy", request.timeType === "arrival" ? "true" : "false");
  url.searchParams.set("transitModes", "TRANSIT");
  url.searchParams.set("directModes", "");
  url.searchParams.set("preTransitModes", "WALK");
  url.searchParams.set("postTransitModes", "WALK");
  url.searchParams.set("numItineraries", String(MAX_TRANSIT_OPTIONS));
  url.searchParams.set("withFares", "true");
  url.searchParams.set("language", "nl");
  url.searchParams.set("searchWindow", "7200");

  return url;
};

const safeFetchTransit = async (url: URL): Promise<Response> => {
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": "RouteKostenPlanner/0.1.0 (contact: app-support)"
      }
    });
  } catch {
    throw new AppError(
      "ROUTING_PROVIDER_ERROR",
      "Kan geen verbinding maken met de OV-routeringsdienst. Probeer het later opnieuw.",
      503
    );
  }
};

export const calculateTransitOptions = async (
  request: CalculateTransitRequest
): Promise<CalculateTransitResponse> => {
  const originCoordinates = await resolveCoordinates(request.origin);
  const destinationCoordinates = await resolveCoordinates(request.destination);

  if (!isWithinNetherlands(originCoordinates) || !isWithinNetherlands(destinationCoordinates)) {
    throw new AppError(
      "TRANSIT_NOT_SUPPORTED",
      "OV vergelijking ondersteunt nu alleen routes binnen Nederland.",
      400
    );
  }

  const requestUrl = buildTransitPlanUrl(originCoordinates, destinationCoordinates, request);
  const response = await safeFetchTransit(requestUrl);

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null;
    const providerMessage = errorPayload?.message?.trim();
    throw new AppError(
      "ROUTING_PROVIDER_ERROR",
      providerMessage ? `OV-routering mislukt: ${providerMessage}` : "OV-routering mislukt.",
      502
    );
  }

  const payload = (await response.json().catch(() => null)) as TransitousPlanResponse | null;
  const itineraries = payload?.itineraries ?? [];

  if (itineraries.length === 0) {
    throw new AppError("ROUTE_NOT_FOUND", "Geen OV-route gevonden tussen deze locaties.", 404);
  }

  const options = itineraries.slice(0, MAX_TRANSIT_OPTIONS).map((itinerary, index) => mapTransitRouteOption(itinerary, index));

  return {
    country: "NL",
    origin: request.origin,
    destination: request.destination,
    dateTime: toIsoDateTime(request.dateTime),
    timeType: request.timeType,
    options,
    disclaimer:
      "OV-kosten zijn geschat op basis van beschikbare tariefdata en landelijke kilometertarieven. Werkelijke prijzen kunnen per vervoerder of abonnement afwijken."
  };
};
