import { z } from "zod";

import { tripTypeSchema } from "./common";

const vehicleProfileSchema = z.object({
  name: z.string().trim().min(1, "Vehicle profile name is required."),
  fuelType: z.enum(["petrol", "diesel", "lpg", "electric", "hybrid"], {
    required_error: "Fuel type is required."
  }),
  consumptionPer100Km: z.number().positive("Consumption must be greater than 0."),
  energyPrice: z.number().positive("Energy price must be greater than 0.")
});

export const calculateRouteSchema = z.object({
  origin: z.string().trim().min(1, "Origin is required."),
  destination: z.string().trim().min(1, "Destination is required."),
  vehicleProfile: vehicleProfileSchema,
  tripType: tripTypeSchema
});
