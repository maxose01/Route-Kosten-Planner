import type { RouteResult } from "@route-cost/shared";

export interface RoutingProvider {
  calculateRoute(origin: string, destination: string): Promise<RouteResult>;
}
