import { z } from "zod";

import { transitTimeTypeSchema } from "./common.js";

export const calculateTransitSchema = z.object({
  origin: z.string().trim().min(1, "Origin is required."),
  destination: z.string().trim().min(1, "Destination is required."),
  dateTime: z
    .string()
    .trim()
    .min(1, "Date and time are required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Date and time must be a valid ISO datetime."
    }),
  timeType: transitTimeTypeSchema
});
