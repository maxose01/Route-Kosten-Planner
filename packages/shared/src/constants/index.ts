import type { FuelType } from "../types";

export const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "petrol", label: "Benzine" },
  { value: "diesel", label: "Diesel" },
  { value: "lpg", label: "LPG" },
  { value: "electric", label: "Elektrisch" },
  { value: "hybrid", label: "Hybride" }
];
