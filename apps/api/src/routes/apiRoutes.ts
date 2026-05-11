import { Router } from "express";
import rateLimit from "express-rate-limit";

import { calculateCostController } from "../controllers/costController.js";
import { getHealth } from "../controllers/healthController.js";
import { suggestLocationsController } from "../controllers/locationController.js";
import { calculateRouteController } from "../controllers/routeController.js";
import { calculateTransitController } from "../controllers/transitController.js";
import { AppError } from "../types/errors.js";

const routeCalculationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, _response, next) => {
    next(new AppError("RATE_LIMITED", "Te veel route-aanvragen. Probeer het over een paar minuten opnieuw.", 429));
  }
});

const locationSuggestionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, _response, next) => {
    next(new AppError("RATE_LIMITED", "Te veel locatie-aanvragen. Probeer het over een paar minuten opnieuw.", 429));
  }
});

const transitCalculationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, _response, next) => {
    next(new AppError("RATE_LIMITED", "Te veel OV-aanvragen. Probeer het over een paar minuten opnieuw.", 429));
  }
});

export const apiRouter = Router();

apiRouter.get("/health", getHealth);
apiRouter.get("/locations/suggest", locationSuggestionLimiter, suggestLocationsController);
apiRouter.post("/costs/calculate", calculateCostController);
apiRouter.post("/routes/calculate", routeCalculationLimiter, calculateRouteController);
apiRouter.post("/transit/calculate", transitCalculationLimiter, calculateTransitController);
