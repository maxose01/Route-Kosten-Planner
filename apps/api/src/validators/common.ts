import { z } from "zod";

export const tripTypeSchema = z.enum(["one-way", "return"]);
export const transitTimeTypeSchema = z.enum(["departure", "arrival"]);
