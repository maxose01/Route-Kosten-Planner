import { env } from "../../config/env";
import { AppError } from "../../types/errors";
import { GoogleRoutingProvider } from "./GoogleRoutingProvider";
import { HereRoutingProvider } from "./HereRoutingProvider";
import { MapboxRoutingProvider } from "./MapboxRoutingProvider";
import { MockRoutingProvider } from "./MockRoutingProvider";
import type { RoutingProvider } from "./RoutingProvider";

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
