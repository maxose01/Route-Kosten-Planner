import { describe, expect, it } from "vitest";

import { calculateCostSchema } from "../validators/costValidators";

describe("calculateCost validation", () => {
  it("geeft validatiefout voor ongeldige waarden", () => {
    const parsed = calculateCostSchema.safeParse({
      distanceKm: 0,
      fuelType: "petrol",
      consumptionPer100Km: -1,
      energyPrice: 0,
      tripType: "one-way"
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.issues.length).toBeGreaterThan(0);
    }
  });
});
