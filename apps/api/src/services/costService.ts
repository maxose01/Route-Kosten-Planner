import { getEnergyUnit, type CalculateCostRequest, type CostResult } from "@route-cost/shared";

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const calculateCost = (input: CalculateCostRequest): CostResult => {
  const distanceKm = round(input.distanceKm, 1);
  const energyUsed = round((distanceKm / 100) * input.consumptionPer100Km, 2);
  const costOneWay = round(energyUsed * input.energyPrice, 2);
  const costReturn = round(costOneWay * 2, 2);

  return {
    distanceKm,
    energyUsed,
    energyUnit: getEnergyUnit(input.fuelType),
    costOneWay,
    costReturn,
    currency: "EUR"
  };
};
