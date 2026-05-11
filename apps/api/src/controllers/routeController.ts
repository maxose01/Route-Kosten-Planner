import type { NextFunction, Request, Response } from "express";
import type { CalculateCostRequest, CalculateRouteRequest, CalculateRouteResponse } from "@route-cost/shared";

import { calculateCost } from "../services/costService.js";
import { buildRouteOptions } from "../services/routeOptionService.js";
import { getRoutingProvider } from "../services/routing/providerFactory.js";
import { AppError } from "../types/errors.js";
import { calculateRouteSchema } from "../validators/routeValidators.js";

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
    const routes = routingProvider.calculateRouteOptions
      ? await routingProvider.calculateRouteOptions(payload.origin, payload.destination)
      : [await routingProvider.calculateRoute(payload.origin, payload.destination)];

    const { routeOptions, selectedRouteId } = buildRouteOptions({
      routes,
      vehicleProfile: payload.vehicleProfile,
      tripType: payload.tripType
    });

    const selectedRouteOption =
      routeOptions.find((option) => option.id === selectedRouteId) ?? routeOptions[0] ?? null;

    if (!selectedRouteOption) {
      throw new AppError("ROUTE_NOT_FOUND", "Geen route gevonden tussen deze locaties.", 404);
    }

    const costInput: CalculateCostRequest = {
      distanceKm: selectedRouteOption.route.distanceKm,
      fuelType: payload.vehicleProfile.fuelType,
      consumptionPer100Km: selectedRouteOption.consumptionPer100KmAdjusted,
      energyPrice: payload.vehicleProfile.energyPrice,
      tripType: payload.tripType
    };

    const fallbackCost = calculateCost(costInput);

    const responseBody: CalculateRouteResponse = {
      route: selectedRouteOption.route,
      vehicleProfile: payload.vehicleProfile,
      cost: selectedRouteOption.cost ?? fallbackCost,
      routeOptions,
      selectedRouteId: selectedRouteOption.id
    };

    response.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};
