import type { NextFunction, Request, Response } from "express";
import type { CalculateCostRequest, CalculateRouteRequest, CalculateRouteResponse } from "@route-cost/shared";

import { calculateCost } from "../services/costService";
import { getRoutingProvider } from "../services/routing/providerFactory";
import { AppError } from "../types/errors";
import { calculateRouteSchema } from "../validators/routeValidators";

export const calculateRouteController = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = calculateRouteSchema.safeParse(request.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new AppError("VALIDATION_ERROR", firstIssue?.message ?? "Ongeldige invoer.", 400);
    }

    const payload: CalculateRouteRequest = parsed.data;
    const routingProvider = getRoutingProvider();
    const route = await routingProvider.calculateRoute(payload.origin, payload.destination);

    const costInput: CalculateCostRequest = {
      distanceKm: route.distanceKm,
      fuelType: payload.vehicleProfile.fuelType,
      consumptionPer100Km: payload.vehicleProfile.consumptionPer100Km,
      energyPrice: payload.vehicleProfile.energyPrice,
      tripType: payload.tripType
    };

    const cost = calculateCost(costInput);

    const responseBody: CalculateRouteResponse = {
      route,
      vehicleProfile: payload.vehicleProfile,
      cost
    };

    response.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};
