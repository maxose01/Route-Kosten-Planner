import type { CalculateTransitResponse, TransitRouteOption } from "@route-cost/shared";

interface TransitResultCardProps {
  result: CalculateTransitResponse | null;
  loading: boolean;
  error: string | null;
  carCostOneWay: number | null;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
  }).format(value);
};

const formatTime = (value: string): string => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam"
  }).format(parsed);
};

const getCheapestOption = (options: TransitRouteOption[]): TransitRouteOption | null => {
  if (options.length === 0) {
    return null;
  }

  return options.reduce((cheapest, option) => {
    if (!cheapest) {
      return option;
    }

    return option.estimatedCost < cheapest.estimatedCost ? option : cheapest;
  }, null as TransitRouteOption | null);
};

export const TransitResultCard = ({ result, loading, error, carCostOneWay }: TransitResultCardProps) => {
  const cheapestOption = result ? getCheapestOption(result.options) : null;
  const costDelta =
    cheapestOption && carCostOneWay !== null ? cheapestOption.estimatedCost - carCostOneWay : null;
  const visibleOptions = result?.options.slice(0, 3) ?? [];

  return (
    <section className="card transit-card" aria-live="polite">
      <p className="result-label">OV vergelijking (NL)</p>
      <h3>Openbaar vervoer</h3>

      {loading && <p className="muted">OV-routeopties laden...</p>}
      {!loading && error && <p className="nav-alert">{error}</p>}
      {!loading && !error && !result && <p className="muted">Bereken een route om OV-opties te tonen.</p>}

      {!loading && !error && result && (
        <>
          {cheapestOption && (
            <div className="transit-highlight">
              <strong>Goedkoopste OV-optie: {formatCurrency(cheapestOption.estimatedCost)}</strong>
              <small>
                {cheapestOption.durationMinutes} min • {cheapestOption.transfers} overstap
                {cheapestOption.transfers === 1 ? "" : "pen"}
              </small>
            </div>
          )}

          {costDelta !== null && (
            <p className="transit-compare">
              {costDelta <= 0
                ? `OV is ongeveer ${formatCurrency(Math.abs(costDelta))} goedkoper dan auto (enkele reis).`
                : `OV is ongeveer ${formatCurrency(costDelta)} duurder dan auto (enkele reis).`}
            </p>
          )}

          <div className="transit-options">
            {visibleOptions.map((option, index) => (
              <article key={option.id} className="transit-option">
                <div className="transit-option-head">
                  <strong>Optie {index + 1}</strong>
                  <strong>{formatCurrency(option.estimatedCost)}</strong>
                </div>
                <p className="muted">
                  {formatTime(option.departureTime)} → {formatTime(option.arrivalTime)} • {option.durationMinutes} min •{" "}
                  {option.transfers} overstap{option.transfers === 1 ? "" : "pen"}
                </p>
                <p>{option.summary}</p>
                <span className="transit-source-chip">
                  {option.fareSource === "api" ? "Prijs uit OV-data" : "Geschatte prijs"}
                </span>
                <details className="transit-option-details">
                  <summary>Toon trajectstappen</summary>
                  <ul className="transit-leg-list">
                    {option.legs.slice(0, 5).map((leg, legIndex) => (
                      <li key={`${option.id}-leg-${legIndex}`}>
                        {leg.modeLabel}
                        {leg.lineLabel ? ` ${leg.lineLabel}` : ""}: {leg.fromName} → {leg.toName}
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>

          <p className="explanation">{result.disclaimer}</p>
        </>
      )}
    </section>
  );
};
