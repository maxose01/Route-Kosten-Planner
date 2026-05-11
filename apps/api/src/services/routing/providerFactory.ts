import { env } from "../../config/env.js";
import { AppError } from "../../types/errors.js";
import { GoogleRoutingProvider } from "./GoogleRoutingProvider.js";
import { HereRoutingProvider } from "./HereRoutingProvider.js";
import { MapboxRoutingProvider } from "./MapboxRoutingProvider.js";
import { MockRoutingProvider } from "./MockRoutingProvider.js";
import type { RoutingProvider } from "./RoutingProvider.js";

let providerInstance: RoutingProvider | null = null;

export const getRoutingProvider = (): RoutingProvider => {
  if (providerInstance) {
    return providerInstance;
  }

  switch (env.MAPS_PROVIDER) {
    case "mapbox":
      providerInstance = new MapboxRoutingProvider();
      return providerInstance;
    case "google":
      providerInstance = new GoogleRoutingProvider();
      return providerInstance;
    case "here":
      providerInstance = new HereRoutingProvider();
      return providerInstance;
    case "mock":
      providerInstance = new MockRoutingProvider();
      return providerInstance;
    default:
      throw new AppError("ROUTING_PROVIDER_ERROR", "Ongeldige MAPS_PROVIDER configuratie.", 500);
  }
};
