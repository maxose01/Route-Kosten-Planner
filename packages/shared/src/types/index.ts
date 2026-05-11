export type FuelType = "petrol" | "diesel" | "lpg" | "electric" | "hybrid";
export type TripType = "one-way" | "return";

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

export interface RouteResult {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
  instructions: RouteInstruction[];
}

export interface CostResult {
  distanceKm: number;
  energyUsed: number;
  energyUnit: "liter" | "kWh";
  costOneWay: number;
  costReturn: number;
  currency: "EUR";
}

export interface CalculateRouteRequest {
  origin: string;
  destination: string;
  vehicleProfile: VehicleProfile;
  tripType: TripType;
}

export interface CalculateRouteResponse {
  route: RouteResult;
  vehicleProfile: VehicleProfile;
  cost: CostResult;
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
      | "ROUTING_PROVIDER_ERROR"
      | "RATE_LIMITED"
      | "INTERNAL_SERVER_ERROR";
    message: string;
  };
}
