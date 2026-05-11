import { z } from "zod";

import { tripTypeSchema } from "./common";

export const calculateCostSchema = z.object({
  distanceKm: z.number({ invalid_type_error: "Distance must be a number." }).positive("Distance must be greater than 0."),
  fuelType: z.enum(["petrol", "diesel", "lpg", "electric", "hybrid"], {
    required_error: "Fuel type is required."
  }),
  consumptionPer100Km: z.number().positive("Consumption must be greater than 0."),
  energyPrice: z.number().positive("Energy price must be greater than 0."),
  tripType: tripTypeSchema
});
