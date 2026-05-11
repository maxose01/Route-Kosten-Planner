import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../types/errors.js";

export const errorHandler = (error: unknown, _request: Request, response: Response, _next: NextFunction): void => {
  if (error instanceof AppError) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    } else {
      console.error(`[API] ${error.code} (${error.statusCode}): ${error.message}`);
    }

    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: firstIssue?.message ?? "Ongeldige invoer."
      }
    });
    return;
  }

  console.error("[API] Onverwachte fout:", error);

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Er ging iets mis op de server."
    }
  });
};
