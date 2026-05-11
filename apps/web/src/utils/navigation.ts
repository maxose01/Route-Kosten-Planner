import type { RouteInstruction } from "@route-cost/shared";

export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const haversineDistanceMeters = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLat = lat2 - lat1;
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return EARTH_RADIUS_METERS * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const toLocalXY = (point: Coordinates, origin: Coordinates): { x: number; y: number } => {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(toRadians(origin.lat));

  return {
    x: (point.lng - origin.lng) * metersPerDegreeLng,
    y: (point.lat - origin.lat) * metersPerDegreeLat
  };
};

const pointToSegmentDistanceMeters = (
  point: Coordinates,
  segmentStart: Coordinates,
  segmentEnd: Coordinates
): number => {
  const p = toLocalXY(point, point);
  const a = toLocalXY(segmentStart, point);
  const b = toLocalXY(segmentEnd, point);

  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const abLengthSquared = abX * abX + abY * abY;

  if (abLengthSquared === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abX + (p.y - a.y) * abY) / abLengthSquared));
  const projectionX = a.x + t * abX;
  const projectionY = a.y + t * abY;

  return Math.hypot(p.x - projectionX, p.y - projectionY);
};

export const getDistanceToRouteMeters = (position: Coordinates, routePoints: Coordinates[]): number => {
  if (routePoints.length === 0) {
    return Infinity;
  }

  if (routePoints.length === 1) {
    return haversineDistanceMeters(position, routePoints[0]);
  }

  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const distance = pointToSegmentDistanceMeters(position, routePoints[index], routePoints[index + 1]);

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
};

export const getNearestRoutePointIndex = (position: Coordinates, routePoints: Coordinates[]): number => {
  if (routePoints.length === 0) {
    return 0;
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  routePoints.forEach((point, index) => {
    const distance = haversineDistanceMeters(position, point);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
};

export const getRemainingDistanceMeters = (position: Coordinates, routePoints: Coordinates[]): number => {
  if (routePoints.length === 0) {
    return 0;
  }

  const nearestIndex = getNearestRoutePointIndex(position, routePoints);
  let remaining = haversineDistanceMeters(position, routePoints[nearestIndex]);

  for (let index = nearestIndex; index < routePoints.length - 1; index += 1) {
    remaining += haversineDistanceMeters(routePoints[index], routePoints[index + 1]);
  }

  return remaining;
};

export const estimateRemainingDurationSeconds = (
  remainingDistanceMeters: number,
  totalDistanceKm: number,
  totalDurationMinutes: number
): number => {
  if (totalDistanceKm <= 0 || totalDurationMinutes <= 0) {
    return 0;
  }

  const totalDistanceMeters = totalDistanceKm * 1000;

  if (totalDistanceMeters <= 0) {
    return 0;
  }

  const ratio = Math.max(0, Math.min(1, remainingDistanceMeters / totalDistanceMeters));
  return Math.round(totalDurationMinutes * 60 * ratio);
};

export const findUpcomingInstructionIndex = (
  position: Coordinates,
  instructions: RouteInstruction[],
  startIndex: number
): number | null => {
  if (instructions.length === 0) {
    return null;
  }

  const clampedStart = Math.max(0, Math.min(startIndex, instructions.length - 1));
  const searchInstructions = instructions.slice(clampedStart);

  if (searchInstructions.length === 0) {
    return null;
  }

  let closestRelativeIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  searchInstructions.forEach((instruction, relativeIndex) => {
    const distance = haversineDistanceMeters(position, instruction.location);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestRelativeIndex = relativeIndex;
    }
  });

  const absoluteIndex = clampedStart + closestRelativeIndex;

  if (closestDistance < 35 && absoluteIndex < instructions.length - 1) {
    return absoluteIndex + 1;
  }

  return absoluteIndex;
};

export const toCoordinateInput = (coordinates: Coordinates): string => {
  return `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`;
};
