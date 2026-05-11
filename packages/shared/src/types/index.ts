export type FuelType = "petrol" | "diesel" | "lpg" | "electric" | "hybrid";
export type TripType = "one-way" | "return";
export type TransitTimeType = "departure" | "arrival";

export interface VehicleProfile {
  name: string;
  fuelType: FuelType;
  consumptionPer100Km: number;
  energyPrice: number;
}

export interface RouteInstruction {
  index: number;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType: string;
  maneuverModifier?: string;
  roadName?: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface RouteEfficiencyProfile {
  averageSpeedKmh: number;
  highwayShare: number;
  urbanShare: number;
}

export interface LocationSuggestion {
  label: string;
  value: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface RouteResult {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
  instructions: RouteInstruction[];
  efficiencyProfile?: RouteEfficiencyProfile;
}

export interface CostResult {
  distanceKm: number;
  energyUsed: number;
  energyUnit: "liter" | "kWh";
  costOneWay: number;
  costReturn: number;
  currency: "EUR";
}

export type RouteOptionType = "fastest" | "shortest" | "alternative";

export interface RouteOption {
  id: string;
  type: RouteOptionType;
  title: string;
  description: string;
  route: RouteResult;
  cost: CostResult;
  consumptionPer100KmAdjusted: number;
  consumptionFactor: number;
}

export interface CalculateRouteRequest {
  origin: string;
  destination: string;
  vehicleProfile: VehicleProfile;
  tripType: TripType;
}

export interface TransitLeg {
  mode: string;
  modeLabel: string;
  fromName: string;
  toName: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  lineLabel?: string;
  agencyName?: string;
  isTransitLeg: boolean;
  distanceKm?: number;
}

export interface TransitRouteOption {
  id: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  transfers: number;
  estimatedCost: number;
  currency: "EUR";
  fareSource: "api" | "estimated";
  summary: string;
  legs: TransitLeg[];
}

export interface CalculateTransitRequest {
  origin: string;
  destination: string;
  dateTime: string;
  timeType: TransitTimeType;
}

export interface CalculateTransitResponse {
  country: "NL";
  origin: string;
  destination: string;
  dateTime: string;
  timeType: TransitTimeType;
  options: TransitRouteOption[];
  disclaimer: string;
}

export interface CalculateRouteResponse {
  route: RouteResult;
  vehicleProfile: VehicleProfile;
  cost: CostResult;
  routeOptions: RouteOption[];
  selectedRouteId: string;
}

export interface SuggestLocationsResponse {
  suggestions: LocationSuggestion[];
}

export interface CalculateCostRequest {
  distanceKm: number;
  fuelType: FuelType;
  consumptionPer100Km: number;
  energyPrice: number;
  tripType: TripType;
}

export interface ApiError {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "ROUTE_NOT_FOUND"
      | "TRANSIT_NOT_SUPPORTED"
      | "ROUTING_PROVIDER_ERROR"
      | "RATE_LIMITED"
      | "INTERNAL_SERVER_ERROR";
    message: string;
  };
}
