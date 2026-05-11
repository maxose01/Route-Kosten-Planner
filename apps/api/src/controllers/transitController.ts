import type { NextFunction, Request, Response } from "express";
import type { CalculateTransitRequest } from "@route-cost/shared";

import { calculateTransitOptions } from "../services/transitService.js";
import { AppError } from "../types/errors.js";
import { calculateTransitSchema } from "../validators/transitValidators.js";

export const calculateTransitController = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = calculateTransitSchema.safeParse(request.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new AppError("VALIDATION_ERROR", firstIssue?.message ?? "Ongeldige invoer.", 400);
    }

    const payload: CalculateTransitRequest = parsed.data;
    const transitResult = await calculateTransitOptions(payload);

    response.status(200).json(transitResult);
  } catch (error) {
    next(error);
  }
};
