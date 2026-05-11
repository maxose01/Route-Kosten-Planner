import type { RouteInstruction } from "@route-cost/shared";

interface LiveNavigationCardProps {
  hasRoute: boolean;
  navigationActive: boolean;
  permissionState: "idle" | "granted" | "denied" | "unsupported";
  gpsError: string | null;
  currentInstruction: RouteInstruction | null;
  nextInstruction: RouteInstruction | null;
  remainingDistanceKm: number | null;
  remainingDurationMinutes: number | null;
  speedKmh: number | null;
  distanceToInstructionMeters: number | null;
  offRoute: boolean;
  rerouting: boolean;
  focusModeActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleFocusMode: () => void;
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

export const LiveNavigationCard = ({
  hasRoute,
  navigationActive,
  permissionState,
  gpsError,
  currentInstruction,
  nextInstruction,
  remainingDistanceKm,
  remainingDurationMinutes,
  speedKmh,
  distanceToInstructionMeters,
  offRoute,
  rerouting,
  focusModeActive,
  onStart,
  onStop,
  onToggleFocusMode
}: LiveNavigationCardProps) => {
  return (
    <section className="card nav-card" aria-live="polite">
      <div className="nav-card-header">
        <div>
          <p className="result-label">Rijmodus</p>
          <h3>{navigationActive ? "Live navigatie actief" : "Klaar om te navigeren"}</h3>
        </div>
        {navigationActive ? (
          <div className="nav-card-actions">
            <button type="button" className="ghost" onClick={onToggleFocusMode}>
              {focusModeActive ? "Verlaat focus" : "Open focusmodus"}
            </button>
            <button type="button" className="ghost" onClick={onStop}>
              Stop navigatie
            </button>
          </div>
        ) : (
          <button type="button" onClick={onStart} disabled={!hasRoute}>
            Start navigatie
          </button>
        )}
      </div>

      {!hasRoute && <p className="muted">Bereken eerst een route voordat je live navigatie start.</p>}
      {permissionState === "unsupported" && <p className="nav-alert">Deze browser ondersteunt geen geolocatie.</p>}
      {permissionState === "denied" && <p className="nav-alert">Locatietoegang geweigerd. Sta GPS-toegang toe om te navigeren.</p>}
      {gpsError && <p className="nav-alert">{gpsError}</p>}
      {rerouting && <p className="nav-chip">Je wijkt van route af. Nieuwe route wordt berekend...</p>}
      {offRoute && !rerouting && navigationActive && <p className="nav-chip nav-chip-warning">Je bent van de route afgeweken.</p>}

      {navigationActive && currentInstruction && (
        <div className="nav-instruction">
          <p className="result-label">Volgende instructie</p>
          <h2>{currentInstruction.instruction}</h2>
          <p className="muted">Over {formatDistance(distanceToInstructionMeters)}</p>
        </div>
      )}

      {navigationActive && (
        <div className="nav-stats-grid">
          <div>
            <p>Resterende afstand</p>
            <strong>{remainingDistanceKm !== null ? `${remainingDistanceKm.toFixed(1)} km` : "-"}</strong>
          </div>
          <div>
            <p>Resterende tijd</p>
            <strong>{remainingDurationMinutes !== null ? `${Math.max(0, Math.round(remainingDurationMinutes))} min` : "-"}</strong>
          </div>
          <div>
            <p>Snelheid</p>
            <strong>{speedKmh !== null ? `${Math.max(0, Math.round(speedKmh))} km/u` : "-"}</strong>
          </div>
        </div>
      )}

      {navigationActive && nextInstruction && (
        <p className="muted nav-next">Daarna: {nextInstruction.instruction}</p>
      )}
    </section>
  );
};
