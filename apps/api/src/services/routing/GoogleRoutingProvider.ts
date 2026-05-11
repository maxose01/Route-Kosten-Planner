import type { RouteResult } from "@route-cost/shared";

import { AppError } from "../../types/errors";
import type { RoutingProvider } from "./RoutingProvider";

export class GoogleRoutingProvider implements RoutingProvider {
  async calculateRoute(_origin: string, _destination: string): Promise<RouteResult> {
    throw new AppError(
      "ROUTING_PROVIDER_ERROR",
      "Google provider is nog niet geconfigureerd in deze MVP. Gebruik MAPS_PROVIDER=mapbox.",
      501
    );
  }
}
