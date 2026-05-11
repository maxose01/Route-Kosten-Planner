import type { CalculateRouteResponse, TripType, VehicleProfile } from "@route-cost/shared";

export interface RouteFormState {
  origin: string;
  destination: string;
  tripType: TripType;
}

export interface PlannerState {
  profile: VehicleProfile;
  routeResult: CalculateRouteResponse | null;
  loading: boolean;
  error: string | null;
}
