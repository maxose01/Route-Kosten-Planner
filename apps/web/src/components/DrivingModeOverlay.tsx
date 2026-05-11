import type { CalculateRouteResponse, RouteInstruction } from "@route-cost/shared";

import { RouteMap } from "./RouteMap";
import type { Coordinates } from "../utils/navigation";

interface DrivingModeOverlayProps {
  active: boolean;
  result: CalculateRouteResponse | null;
  currentPosition: (Coordinates & { accuracy: number; speedKmh: number | null; headingDeg: number | null }) | null;
  navigationActive: boolean;
  followPosition: boolean;
  recenterToken: number;
  orientationMode: "north-up" | "track-up";
  onToggleOrientation: () => void;
  onMapInteraction: () => void;
  onRecenter: () => void;
  offRoute: boolean;
  rerouting: boolean;
  currentInstruction: RouteInstruction | null;
  nextInstruction: RouteInstruction | null;
  distanceToInstructionMeters: number | null;
  remainingDistanceKm: number | null;
  remainingDurationMinutes: number | null;
  speedKmh: number | null;
  onStopNavigation: () => void;
}

const formatDistance = (distanceMeters: number | null): string => {
  if (distanceMeters === null) {
    return "-";
  }

  if (distanceMeters < 1000) {
    return `${Math.max(1, Math.round(distanceMeters))} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const getManeuverIcon = (instruction: RouteInstruction | null): string => {
  if (!instruction) {
    return "⬆";
  }

  if (instruction.maneuverType === "arrive") {
    return "◎";
  }

  if (instruction.maneuverType === "roundabout") {
    return "⟳";
  }

  const modifier = instruction.maneuverModifier;

  switch (modifier) {
    case "slight right":
      return "↗";
    case "right":
      return "➡";
    case "sharp right":
      return "↘";
    case "slight left":
      return "↖";
    case "left":
      return "⬅";
    case "sharp left":
      return "↙";
    case "uturn":
    case "uturn left":
    case "uturn right":
      return "↩";
    default:
      return "⬆";
  }
};

export const DrivingModeOverlay = ({
  active,
  result,
  currentPosition,
  navigationActive,
  followPosition,
  recenterToken,
  orientationMode,
  onToggleOrientation,
  onMapInteraction,
  onRecenter,
  offRoute,
  rerouting,
  currentInstruction,
  nextInstruction,
  distanceToInstructionMeters,
  remainingDistanceKm,
  remainingDurationMinutes,
  speedKmh,
  onStopNavigation
}: DrivingModeOverlayProps) => {
  if (!active) {
    return null;
  }

  const now = new Date();
  const arrivalTime =
    remainingDurationMinutes !== null
      ? new Date(now.getTime() + Math.max(0, remainingDurationMinutes) * 60 * 1000)
      : null;

  const arrivalLabel = arrivalTime
    ? new Intl.DateTimeFormat("nl-NL", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(arrivalTime)
    : "-";
  const speedLabel = speedKmh !== null ? `${Math.max(0, Math.round(speedKmh))} km/u` : "- km/u";
  const orientationLabel = orientationMode === "track-up" ? "Richting-up" : "Noord-up";

  return (
    <div className="driving-overlay" role="dialog" aria-modal="true" aria-label="Driving mode">
      <RouteMap
        mode="driving"
        result={result}
        currentPosition={currentPosition}
        navigationActive={navigationActive}
        followPosition={followPosition}
        recenterToken={recenterToken}
        onUserMapInteraction={onMapInteraction}
        trackUpEnabled={orientationMode === "track-up"}
        mapHeadingDeg={currentPosition?.headingDeg ?? null}
        offRoute={offRoute}
      />

      <header className="driving-top-bar">
        <div className="driving-icon" aria-hidden="true">
          {getManeuverIcon(currentInstruction)}
        </div>
        <div className="driving-instruction-copy">
          <p className="driving-distance">Over {formatDistance(distanceToInstructionMeters)}</p>
          <h2>{currentInstruction?.instruction ?? "Volg de route"}</h2>
          {nextInstruction && <p className="driving-next">Daarna: {nextInstruction.instruction}</p>}
        </div>
      </header>

      <footer className="driving-bottom-bar">
        <button type="button" className="driving-close-button" onClick={onStopNavigation} aria-label="Stop navigatie">
          ✕
        </button>

        <div className="driving-summary">
          <strong className="driving-summary-primary">
            {remainingDurationMinutes !== null ? `${Math.max(0, Math.round(remainingDurationMinutes))} min` : "-"}
          </strong>
          <p className="driving-summary-secondary">
            {remainingDistanceKm !== null ? `${remainingDistanceKm.toFixed(1)} km` : "-"} • Aankomst {arrivalLabel} •{" "}
            {speedLabel}
          </p>
        </div>

        <div className="driving-right-actions">
          <button
            type="button"
            className={`driving-round-button ${orientationMode === "track-up" ? "driving-round-button-active" : ""}`}
            onClick={onToggleOrientation}
            aria-label={`Kaartoriëntatie: ${orientationLabel}`}
            title={`Kaartoriëntatie: ${orientationLabel}`}
          >
            {orientationMode === "track-up" ? "↗" : "N"}
          </button>
          <button
            type="button"
            className={`driving-round-button ${!followPosition ? "driving-round-button-attention" : ""}`}
            onClick={onRecenter}
            aria-label="Ga terug naar live locatie"
            title="Ga terug naar live locatie"
          >
            ◎
          </button>
        </div>

        {rerouting && <span className="driving-chip">Nieuwe route berekenen...</span>}
        {offRoute && !rerouting && <span className="driving-chip driving-chip-warning">Van route afgeweken</span>}
      </footer>
    </div>
  );
};
