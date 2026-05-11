import type { TripType, VehicleProfile } from "@route-cost/shared";

interface RouteFormProps {
  origin: string;
  destination: string;
  tripType: TripType;
  profile: VehicleProfile;
  loading: boolean;
  locatingOrigin: boolean;
  onChange: (input: { origin?: string; destination?: string; tripType?: TripType }) => void;
  onOpenProfile: () => void;
  onUseCurrentLocation: () => void;
  onSubmit: () => void;
}

export const RouteForm = ({
  origin,
  destination,
  tripType,
  profile,
  loading,
  locatingOrigin,
  onChange,
  onOpenProfile,
  onUseCurrentLocation,
  onSubmit
}: RouteFormProps) => {
  return (
    <section className="card form-card">
      <h1>Routekosten + Live Navigatie</h1>
      <p className="muted">Plan je route, start rijmodus en volg live turn-by-turn navigatie.</p>

      <label>
        Van
        <input
          placeholder="Bijv. Den Haag"
          value={origin}
          onChange={(event) => onChange({ origin: event.target.value })}
        />
      </label>

      <div className="inline-actions">
        <button type="button" className="ghost" onClick={onUseCurrentLocation} disabled={locatingOrigin || loading}>
          {locatingOrigin ? "Locatie ophalen..." : "Gebruik huidige locatie"}
        </button>
      </div>

      <label>
        Naar
        <input
          placeholder="Bijv. Haarlem"
          value={destination}
          onChange={(event) => onChange({ destination: event.target.value })}
        />
      </label>

      <fieldset>
        <legend>Rit type</legend>
        <div className="segment">
          <button
            type="button"
            className={tripType === "one-way" ? "segment-active" : ""}
            onClick={() => onChange({ tripType: "one-way" })}
          >
            Enkele reis
          </button>
          <button
            type="button"
            className={tripType === "return" ? "segment-active" : ""}
            onClick={() => onChange({ tripType: "return" })}
          >
            Retour
          </button>
        </div>
      </fieldset>

      <div className="profile-summary">
        <div>
          <p>Auto/profiel</p>
          <strong>{profile.name}</strong>
          <small>
            {profile.consumptionPer100Km.toFixed(1)} {profile.fuelType === "electric" ? "kWh" : "l"}/100 km • EUR {profile.energyPrice.toFixed(2)}
          </small>
        </div>
        <button type="button" className="ghost" onClick={onOpenProfile}>
          Aanpassen
        </button>
      </div>

      <button type="button" onClick={onSubmit} disabled={loading}>
        {loading ? "Route berekenen..." : "Bereken route + ritkosten"}
      </button>
    </section>
  );
};
