import type { CalculateRouteResponse, TripType } from "@route-cost/shared";

interface ResultCardProps {
  result: CalculateRouteResponse;
  tripType: TripType;
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
  }).format(value);

export const ResultCard = ({ result, tripType, selectedRouteId, onSelectRoute }: ResultCardProps) => {
  const selectedRouteOption =
    result.routeOptions.find((routeOption) => routeOption.id === selectedRouteId) ??
    result.routeOptions.find((routeOption) => routeOption.id === result.selectedRouteId) ??
    result.routeOptions[0];

  const activeRoute = selectedRouteOption?.route ?? result.route;
  const activeCost = selectedRouteOption?.cost ?? result.cost;
  const activeConsumptionPer100Km =
    selectedRouteOption?.consumptionPer100KmAdjusted ?? result.vehicleProfile.consumptionPer100Km;
  const unitLabel = activeCost.energyUnit === "kWh" ? "kWh" : "liter";
  const showRouteOptions = result.routeOptions.length > 1;

  return (
    <section className="card result-card" aria-live="polite">
      {showRouteOptions && (
        <div className="route-options">
          <p className="result-label">Route suggesties</p>
          <div className="route-options-grid">
            {result.routeOptions.map((routeOption) => {
              const isSelected = routeOption.id === selectedRouteOption?.id;

              return (
                <button
                  key={routeOption.id}
                  type="button"
                  className={`route-option-card ${isSelected ? "route-option-card-active" : ""}`}
                  onClick={() => onSelectRoute(routeOption.id)}
                  aria-pressed={isSelected}
                >
                  <span className="route-option-chip">{routeOption.title}</span>
                  <div className="route-option-main">
                    <strong>{formatCurrency(routeOption.cost.costOneWay)}</strong>
                    <small>
                      {routeOption.route.distanceKm.toFixed(1)} km • {routeOption.route.durationMinutes} min
                    </small>
                  </div>
                  <p>{routeOption.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="result-label">Geschatte ritkosten</p>
      <h2>{formatCurrency(activeCost.costOneWay)}</h2>
      <p className="muted">Enkele reis</p>

      {tripType === "return" && (
        <div className="return-row">
          <span>Retour</span>
          <strong>{formatCurrency(activeCost.costReturn)}</strong>
        </div>
      )}

      <div className="stats-grid">
        <div>
          <p>Afstand</p>
          <strong>{activeRoute.distanceKm.toFixed(1)} km</strong>
        </div>
        <div>
          <p>Reistijd</p>
          <strong>{activeRoute.durationMinutes} min</strong>
        </div>
        <div>
          <p>Verbruik</p>
          <strong>
            {activeCost.energyUsed.toFixed(2)} {unitLabel}
          </strong>
        </div>
      </div>

      <p className="explanation">
        Gebaseerd op {activeRoute.distanceKm.toFixed(1)} km, {activeConsumptionPer100Km.toFixed(1)}
        {unitLabel === "kWh" ? " kWh" : " l"}/100 km en {formatCurrency(result.vehicleProfile.energyPrice)} per{" "}
        {unitLabel}. Verbruik is route-afhankelijk geschat op basis van snelweg/stad-verhouding.
      </p>
    </section>
  );
};
