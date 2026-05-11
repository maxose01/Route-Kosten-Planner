import { describe, expect, it } from "vitest";
import type { RouteResult } from "@route-cost/shared";

import { buildRouteOptions } from "../services/routeOptionService.js";

const baseRoute = (input: Partial<RouteResult> & Pick<RouteResult, "origin" | "destination">): RouteResult => {
  return {
    origin: input.origin,
    destination: input.destination,
    distanceKm: input.distanceKm ?? 10,
    durationMinutes: input.durationMinutes ?? 10,
    polyline: input.polyline,
    instructions: input.instructions ?? [],
    efficiencyProfile: input.efficiencyProfile
  };
};

describe("buildRouteOptions", () => {
  it("labelt snelste en kortste route en selecteert standaard de snelste", () => {
    const routes = [
      baseRoute({
        origin: "Den Haag",
        destination: "Haarlem",
        distanceKm: 50,
        durationMinutes: 40,
        efficiencyProfile: { averageSpeedKmh: 82, highwayShare: 0.8, urbanShare: 0.1 }
      }),
      baseRoute({
        origin: "Den Haag",
        destination: "Haarlem",
        distanceKm: 45,
        durationMinutes: 48,
        efficiencyProfile: { averageSpeedKmh: 49, highwayShare: 0.12, urbanShare: 0.6 }
      })
    ];

    const result = buildRouteOptions({
      routes,
      vehicleProfile: {
        name: "Seat Ibiza",
        fuelType: "petrol",
        consumptionPer100Km: 6.5,
        energyPrice: 2.1
      },
      tripType: "one-way"
    });

    expect(result.routeOptions).toHaveLength(2);
    expect(result.selectedRouteId).toBe(result.routeOptions[0].id);
    expect(result.routeOptions[0].type).toBe("fastest");
    expect(result.routeOptions[1].type).toBe("shortest");
    expect(result.routeOptions[0].cost.costOneWay).toBeLessThan(result.routeOptions[1].cost.costOneWay);
  });

  it("geeft een geldige selectie terug met een enkele route", () => {
    const result = buildRouteOptions({
      routes: [
        baseRoute({
          origin: "Den Haag",
          destination: "Haarlem",
          distanceKm: 48.2,
          durationMinutes: 45
        })
      ],
      vehicleProfile: {
        name: "Tesla Model 3",
        fuelType: "electric",
        consumptionPer100Km: 16.5,
        energyPrice: 0.35
      },
      tripType: "return"
    });

    expect(result.routeOptions).toHaveLength(1);
    expect(result.selectedRouteId).toBe(result.routeOptions[0].id);
    expect(result.routeOptions[0].type).toBe("fastest");
    expect(result.routeOptions[0].cost.costReturn).toBe(result.routeOptions[0].cost.costOneWay * 2);
  });
});
