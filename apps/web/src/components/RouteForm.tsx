import { useEffect, useMemo, useState } from "react";
import type { KeyboardEventHandler } from "react";
import type { LocationSuggestion, TripType, VehicleProfile } from "@route-cost/shared";

import { fetchLocationSuggestions } from "../services/apiClient";

const MIN_AUTOCOMPLETE_QUERY_LENGTH = 2;
const AUTOCOMPLETE_DEBOUNCE_MS = 220;

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
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingDestinationSuggestions, setLoadingDestinationSuggestions] = useState(false);
  const [destinationSuggestionLookupDone, setDestinationSuggestionLookupDone] = useState(false);
  const [destinationSuggestionsOpen, setDestinationSuggestionsOpen] = useState(false);
  const [activeDestinationSuggestionIndex, setActiveDestinationSuggestionIndex] = useState(-1);

  const trimmedDestination = destination.trim();
  const canShowDestinationSuggestions = useMemo(
    () =>
      destinationSuggestionsOpen &&
      trimmedDestination.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
      (loadingDestinationSuggestions || destinationSuggestionLookupDone),
    [destinationSuggestionsOpen, trimmedDestination.length, loadingDestinationSuggestions, destinationSuggestionLookupDone]
  );

  useEffect(() => {
    if (trimmedDestination.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) {
      setDestinationSuggestions([]);
      setLoadingDestinationSuggestions(false);
      setDestinationSuggestionLookupDone(false);
      setActiveDestinationSuggestionIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoadingDestinationSuggestions(true);
      setDestinationSuggestionLookupDone(false);

      fetchLocationSuggestions(trimmedDestination, {
        limit: 5,
        signal: controller.signal
      })
        .then((suggestions) => {
          setDestinationSuggestions(suggestions);
          setDestinationSuggestionLookupDone(true);
          setActiveDestinationSuggestionIndex(-1);
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          console.error(error);
          setDestinationSuggestions([]);
          setDestinationSuggestionLookupDone(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoadingDestinationSuggestions(false);
          }
        });
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [trimmedDestination]);

  const selectDestinationSuggestion = (suggestion: LocationSuggestion) => {
    onChange({ destination: suggestion.value });
    setDestinationSuggestionsOpen(false);
    setActiveDestinationSuggestionIndex(-1);
  };

  const handleDestinationKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!canShowDestinationSuggestions || destinationSuggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveDestinationSuggestionIndex((currentIndex) =>
        currentIndex < destinationSuggestions.length - 1 ? currentIndex + 1 : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveDestinationSuggestionIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : destinationSuggestions.length - 1
      );
      return;
    }

    if (event.key === "Enter") {
      if (activeDestinationSuggestionIndex >= 0 && activeDestinationSuggestionIndex < destinationSuggestions.length) {
        event.preventDefault();
        selectDestinationSuggestion(destinationSuggestions[activeDestinationSuggestionIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setDestinationSuggestionsOpen(false);
      setActiveDestinationSuggestionIndex(-1);
    }
  };

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
        <div className="autocomplete">
          <input
            placeholder="Bijv. Haarlem"
            value={destination}
            autoComplete="off"
            onFocus={() => setDestinationSuggestionsOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setDestinationSuggestionsOpen(false), 120);
            }}
            onKeyDown={handleDestinationKeyDown}
            onChange={(event) => {
              onChange({ destination: event.target.value });
              setDestinationSuggestionsOpen(true);
            }}
          />

          {canShowDestinationSuggestions && (
            <ul className="autocomplete-list" role="listbox" aria-label="Locatiesuggesties">
              {loadingDestinationSuggestions && (
                <li className="autocomplete-item autocomplete-item-muted">Suggesties laden...</li>
              )}

              {!loadingDestinationSuggestions &&
                destinationSuggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion.value}-${index}`}
                    role="option"
                    aria-selected={activeDestinationSuggestionIndex === index}
                    className={`autocomplete-item ${activeDestinationSuggestionIndex === index ? "autocomplete-item-active" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectDestinationSuggestion(suggestion)}
                  >
                    {suggestion.label}
                  </li>
                ))}

              {!loadingDestinationSuggestions && destinationSuggestions.length === 0 && (
                <li className="autocomplete-item autocomplete-item-muted">Geen suggesties gevonden.</li>
              )}
            </ul>
          )}
        </div>
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
