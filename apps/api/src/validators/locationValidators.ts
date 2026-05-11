import { z } from "zod";

const MIN_LOCATION_QUERY_LENGTH = 2;

export const suggestLocationsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(MIN_LOCATION_QUERY_LENGTH, `Voer minimaal ${MIN_LOCATION_QUERY_LENGTH} tekens in voor suggesties.`),
  limit: z.coerce.number().int().min(1).max(8).default(5)
});
