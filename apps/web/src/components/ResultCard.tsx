import type { CalculateRouteResponse, TripType } from "@route-cost/shared";

interface ResultCardProps {
  result: CalculateRouteResponse;
  tripType: TripType;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
  }).format(value);

export const ResultCard = ({ result, tripType }: ResultCardProps) => {
  const unitLabel = result.cost.energyUnit === "kWh" ? "kWh" : "liter";

  return (
    <section className="card result-card" aria-live="polite">
      <p className="result-label">Geschatte ritkosten</p>
      <h2>{formatCurrency(result.cost.costOneWay)}</h2>
      <p className="muted">Enkele reis</p>

      {tripType === "return" && (
        <div className="return-row">
          <span>Retour</span>
          <strong>{formatCurrency(result.cost.costReturn)}</strong>
        </div>
      )}

      <div className="stats-grid">
        <div>
          <p>Afstand</p>
          <strong>{result.route.distanceKm.toFixed(1)} km</strong>
        </div>
        <div>
          <p>Reistijd</p>
          <strong>{result.route.durationMinutes} min</strong>
        </div>
        <div>
          <p>Verbruik</p>
          <strong>
            {result.cost.energyUsed.toFixed(2)} {unitLabel}
          </strong>
        </div>
      </div>

      <p className="explanation">
        Gebaseerd op {result.route.distanceKm.toFixed(1)} km, {result.vehicleProfile.consumptionPer100Km.toFixed(1)}
        {unitLabel === "kWh" ? " kWh" : " l"}/100 km en {formatCurrency(result.vehicleProfile.energyPrice)} per {unitLabel}.
      </p>
    </section>
  );
};
