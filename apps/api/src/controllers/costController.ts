import type { Request, Response, NextFunction } from "express";
import type { CalculateCostRequest } from "@route-cost/shared";

import { calculateCostSchema } from "../validators/costValidators.js";
import { calculateCost } from "../services/costService.js";
import { AppError } from "../types/errors.js";

export const calculateCostController = (request: Request, response: Response, next: NextFunction): void => {
  try {
    const parsed = calculateCostSchema.safeParse(request.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new AppError("VALIDATION_ERROR", firstIssue?.message ?? "Ongeldige invoer.", 400);
    }

    const input: CalculateCostRequest = parsed.data;
    const cost = calculateCost(input);
    response.status(200).json(cost);
  } catch (error) {
    next(error);
  }
};
