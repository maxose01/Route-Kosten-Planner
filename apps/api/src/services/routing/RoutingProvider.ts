import type { LocationSuggestion, RouteResult } from "@route-cost/shared";

export interface RoutingProvider {
  calculateRoute(origin: string, destination: string): Promise<RouteResult>;
  suggestLocations(query: string, limit: number): Promise<LocationSuggestion[]>;
}
