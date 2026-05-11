import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { apiRouter } from "./routes/apiRoutes";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
