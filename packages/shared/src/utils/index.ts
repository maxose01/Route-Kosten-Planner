import type { FuelType } from "../types";

export const getEnergyUnit = (fuelType: FuelType): "liter" | "kWh" => {
  return fuelType === "electric" ? "kWh" : "liter";
};
