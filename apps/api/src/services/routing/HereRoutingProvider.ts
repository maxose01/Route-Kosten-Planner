import type { LocationSuggestion, RouteResult } from "@route-cost/shared";

import { AppError } from "../../types/errors.js";
import type { RoutingProvider } from "./RoutingProvider.js";

export class HereRoutingProvider implements RoutingProvider {
  async suggestLocations(_query: string, _limit: number): Promise<LocationSuggestion[]> {
    throw new AppError(
      "ROUTING_PROVIDER_ERROR",
      "HERE provider is nog niet geconfigureerd in deze MVP. Gebruik MAPS_PROVIDER=mapbox.",
      501
    );
  }

  async calculateRoute(_origin: string, _destination: string): Promise<RouteResult> {
    throw new AppError(
      "ROUTING_PROVIDER_ERROR",
      "HERE provider is nog niet geconfigureerd in deze MVP. Gebruik MAPS_PROVIDER=mapbox.",
      501
    );
  }
}
