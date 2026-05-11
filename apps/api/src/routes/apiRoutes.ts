import { Router } from "express";
import rateLimit from "express-rate-limit";

import { calculateCostController } from "../controllers/costController";
import { getHealth } from "../controllers/healthController";
import { calculateRouteController } from "../controllers/routeController";
import { AppError } from "../types/errors";

const routeCalculationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, _response, next) => {
    next(new AppError("RATE_LIMITED", "Te veel route-aanvragen. Probeer het over een paar minuten opnieuw.", 429));
  }
});

export const apiRouter = Router();

apiRouter.get("/health", getHealth);
apiRouter.post("/costs/calculate", calculateCostController);
apiRouter.post("/routes/calculate", routeCalculationLimiter, calculateRouteController);
