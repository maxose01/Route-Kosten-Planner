import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const envPathCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), "apps/api/.env")
];

const resolvedEnvPath = envPathCandidates.find((path) => existsSync(path));

if (resolvedEnvPath) {
  dotenv.config({ path: resolvedEnvPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MAPS_PROVIDER: z.enum(["mapbox", "google", "here", "mock"]).default("mapbox"),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  HERE_API_KEY: z.string().optional(),
  TRANSIT_API_BASE_URL: z.string().url().default("https://api.transitous.org")
});

export const env = envSchema.parse(process.env);
