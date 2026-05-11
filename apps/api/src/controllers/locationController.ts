import type { NextFunction, Request, Response } from "express";

import { getRoutingProvider } from "../services/routing/providerFactory.js";
import { AppError } from "../types/errors.js";
import { suggestLocationsQuerySchema } from "../validators/locationValidators.js";

export const suggestLocationsController = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = suggestLocationsQuerySchema.safeParse({
      q: request.query.q,
      limit: request.query.limit
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new AppError("VALIDATION_ERROR", firstIssue?.message ?? "Ongeldige invoer.", 400);
    }

    const { q, limit } = parsed.data;
    const routingProvider = getRoutingProvider();
    const suggestions = await routingProvider.suggestLocations(q, limit);

    response.status(200).json({ suggestions });
  } catch (error) {
    next(error);
  }
};
