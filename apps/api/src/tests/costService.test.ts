import { describe, expect, it } from "vitest";

import { calculateCost } from "../services/costService";

describe("calculateCost", () => {
  it("berekent 48 km, 6.5 l/100 km, EUR 2.10/l naar EUR 6.55", () => {
    const result = calculateCost({
      distanceKm: 48,
      fuelType: "petrol",
      consumptionPer100Km: 6.5,
      energyPrice: 2.1,
      tripType: "one-way"
    });

    expect(result.costOneWay).toBe(6.55);
    expect(result.energyUsed).toBe(3.12);
  });

  it("berekent 100 km, 5.0 l/100 km, EUR 2.00/l naar EUR 10.00", () => {
    const result = calculateCost({
      distanceKm: 100,
      fuelType: "diesel",
      consumptionPer100Km: 5,
      energyPrice: 2,
      tripType: "one-way"
    });

    expect(result.costOneWay).toBe(10);
    expect(result.energyUsed).toBe(5);
  });

  it("berekent 200 km, 16 kWh/100 km, EUR 0.35/kWh naar EUR 11.20", () => {
    const result = calculateCost({
      distanceKm: 200,
      fuelType: "electric",
      consumptionPer100Km: 16,
      energyPrice: 0.35,
      tripType: "one-way"
    });

    expect(result.costOneWay).toBe(11.2);
    expect(result.energyUsed).toBe(32);
    expect(result.energyUnit).toBe("kWh");
  });

  it("retourkosten zijn exact 2x enkele reis", () => {
    const result = calculateCost({
      distanceKm: 48,
      fuelType: "petrol",
      consumptionPer100Km: 6.5,
      energyPrice: 2.1,
      tripType: "return"
    });

    expect(result.costReturn).toBe(result.costOneWay * 2);
  });
});
