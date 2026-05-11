import type {
  CostResult,
  FuelType,
  RouteOption,
  RouteOptionType,
  RouteResult,
  TripType,
  VehicleProfile
} from "@route-cost/shared";

import { calculateCost } from "./costService.js";

interface BuildRouteOptionsInput {
  routes: RouteResult[];
  vehicleProfile: VehicleProfile;
  tripType: TripType;
}

interface BuildRouteOptionsOutput {
  routeOptions: RouteOption[];
  selectedRouteId: string;
}

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const getConsumptionFactor = (route: RouteResult, fuelType: FuelType): number => {
  const profile = route.efficiencyProfile;

  if (!profile) {
    return 1;
  }

  const highwayShare = clamp(profile.highwayShare, 0, 1);
  const urbanShare = clamp(profile.urbanShare, 0, 1);
  const averageSpeedKmh = Math.max(1, profile.averageSpeedKmh);

  const fuelTypeTuning: Record<FuelType, { highwayBonus: number; urbanPenalty: number }> = {
    petrol: { highwayBonus: 0.09, urbanPenalty: 0.13 },
    diesel: { highwayBonus: 0.08, urbanPenalty: 0.12 },
    lpg: { highwayBonus: 0.09, urbanPenalty: 0.13 },
    electric: { highwayBonus: 0.05, urbanPenalty: 0.1 },
    hybrid: { highwayBonus: 0.06, urbanPenalty: 0.1 }
  };

  const tuning = fuelTypeTuning[fuelType];
  let factor = 1 + urbanShare * tuning.urbanPenalty - highwayShare * tuning.highwayBonus;

  if (averageSpeedKmh <= 35) {
    factor += 0.04;
  } else if (averageSpeedKmh >= 95) {
    factor -= 0.03;
  }

  return round(clamp(factor, 0.8, 1.25), 3);
};

const getRouteType = (
  routeIndex: number,
  fastestRouteIndex: number,
  shortestRouteIndex: number
): RouteOptionType => {
  if (routeIndex === fastestRouteIndex) {
    return "fastest";
  }

  if (routeIndex === shortestRouteIndex) {
    return "shortest";
  }

  return "alternative";
};

const getRouteTitle = (
  type: RouteOptionType,
  routeNumber: number,
  fastestRouteIndex: number,
  shortestRouteIndex: number
): string => {
  if (fastestRouteIndex === shortestRouteIndex && type === "fastest") {
    return "Snelste + kortste route";
  }

  switch (type) {
    case "fastest":
      return "Snelste route";
    case "shortest":
      return "Kortste route";
    default:
      return `Alternatieve route ${routeNumber}`;
  }
};

const getRouteDescription = (route: RouteResult): string => {
  const highwayPercentage = Math.round((route.efficiencyProfile?.highwayShare ?? 0) * 100);
  const urbanPercentage = Math.round((route.efficiencyProfile?.urbanShare ?? 0) * 100);

  if (highwayPercentage >= 55) {
    return `Meer snelweg (${highwayPercentage}%), meestal zuiniger rijden.`;
  }

  if (urbanPercentage >= 45) {
    return `Meer stad/binnenwegen (${urbanPercentage}%), meestal iets hoger verbruik.`;
  }

  return "Gebalanceerde mix van snelweg en lokale wegen.";
};

const buildRouteCost = (
  route: RouteResult,
  vehicleProfile: VehicleProfile,
  tripType: TripType,
  factor: number
): CostResult => {
  const adjustedConsumptionPer100Km = vehicleProfile.consumptionPer100Km * factor;

  return calculateCost({
    distanceKm: route.distanceKm,
    fuelType: vehicleProfile.fuelType,
    consumptionPer100Km: adjustedConsumptionPer100Km,
    energyPrice: vehicleProfile.energyPrice,
    tripType
  });
};

export const buildRouteOptions = ({
  routes,
  vehicleProfile,
  tripType
}: BuildRouteOptionsInput): BuildRouteOptionsOutput => {
  const normalizedRoutes = routes.filter((route) => route.distanceKm > 0 && route.durationMinutes > 0);

  if (normalizedRoutes.length === 0) {
    return {
      routeOptions: [],
      selectedRouteId: ""
    };
  }

  const fastestRouteIndex = normalizedRoutes.reduce((bestIndex, route, index, allRoutes) => {
    return route.durationMinutes < allRoutes[bestIndex].durationMinutes ? index : bestIndex;
  }, 0);

  const shortestRouteIndex = normalizedRoutes.reduce((bestIndex, route, index, allRoutes) => {
    return route.distanceKm < allRoutes[bestIndex].distanceKm ? index : bestIndex;
  }, 0);

  const routeOptions = normalizedRoutes.map((route, routeIndex) => {
    const consumptionFactor = getConsumptionFactor(route, vehicleProfile.fuelType);
    const adjustedConsumptionPer100Km = round(vehicleProfile.consumptionPer100Km * consumptionFactor, 2);
    const type = getRouteType(routeIndex, fastestRouteIndex, shortestRouteIndex);

    return {
      id: `route-option-${routeIndex + 1}`,
      type,
      title: getRouteTitle(type, routeIndex + 1, fastestRouteIndex, shortestRouteIndex),
      description: getRouteDescription(route),
      route,
      cost: buildRouteCost(route, vehicleProfile, tripType, consumptionFactor),
      consumptionPer100KmAdjusted: adjustedConsumptionPer100Km,
      consumptionFactor
    } satisfies RouteOption;
  });

  routeOptions.sort((left, right) => {
    if (left.type === "fastest" && right.type !== "fastest") {
      return -1;
    }

    if (right.type === "fastest" && left.type !== "fastest") {
      return 1;
    }

    if (left.type === "shortest" && right.type === "alternative") {
      return -1;
    }

    if (right.type === "shortest" && left.type === "alternative") {
      return 1;
    }

    return left.route.durationMinutes - right.route.durationMinutes;
  });

  const selectedRouteId = routeOptions.find((option) => option.type === "fastest")?.id ?? routeOptions[0].id;

  return {
    routeOptions,
    selectedRouteId
  };
};
