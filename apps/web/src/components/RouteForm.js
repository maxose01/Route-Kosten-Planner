import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { fetchLocationSuggestions } from "../services/apiClient";
const MIN_AUTOCOMPLETE_QUERY_LENGTH = 2;
const AUTOCOMPLETE_DEBOUNCE_MS = 220;
export const RouteForm = ({ origin, destination, tripType, transitDateTimeLocal, transitTimeType, comparisonMode, profile, loading, locatingOrigin, onChange, onOpenProfile, onUseCurrentLocation, onSwapLocations, onSubmit }) => {
    const [advancedOpen, setAdvancedOpen] = useState(comparisonMode);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [loadingDestinationSuggestions, setLoadingDestinationSuggestions] = useState(false);
    const [destinationSuggestionLookupDone, setDestinationSuggestionLookupDone] = useState(false);
    const [destinationSuggestionsOpen, setDestinationSuggestionsOpen] = useState(false);
    const [activeDestinationSuggestionIndex, setActiveDestinationSuggestionIndex] = useState(-1);
    const trimmedDestination = destination.trim();
    const canShowDestinationSuggestions = useMemo(() => destinationSuggestionsOpen &&
        trimmedDestination.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
        (loadingDestinationSuggestions || destinationSuggestionLookupDone), [destinationSuggestionsOpen, trimmedDestination.length, loadingDestinationSuggestions, destinationSuggestionLookupDone]);
    useEffect(() => {
        if (comparisonMode) {
            setAdvancedOpen(true);
        }
    }, [comparisonMode]);
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
    const selectDestinationSuggestion = (suggestion) => {
        onChange({ destination: suggestion.value });
        setDestinationSuggestionsOpen(false);
        setActiveDestinationSuggestionIndex(-1);
    };
    const handleDestinationKeyDown = (event) => {
        if (!canShowDestinationSuggestions || destinationSuggestions.length === 0) {
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveDestinationSuggestionIndex((currentIndex) => currentIndex < destinationSuggestions.length - 1 ? currentIndex + 1 : 0);
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveDestinationSuggestionIndex((currentIndex) => currentIndex > 0 ? currentIndex - 1 : destinationSuggestions.length - 1);
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
    return (_jsxs("section", { className: "card form-card", children: [_jsx("h1", { children: "Plan Je Rit" }), _jsx("p", { className: "muted", children: "Snel van A naar B, met direct inzicht in kosten." }), _jsxs("div", { className: "route-input-grid", children: [_jsxs("label", { children: ["Van", _jsx("input", { placeholder: "Bijv. Den Haag", value: origin, onChange: (event) => onChange({ origin: event.target.value }) })] }), _jsxs("label", { children: ["Naar", _jsxs("div", { className: "autocomplete", children: [_jsx("input", { placeholder: "Wat is je bestemming?", value: destination, autoComplete: "off", onFocus: () => setDestinationSuggestionsOpen(true), onBlur: () => {
                                            window.setTimeout(() => setDestinationSuggestionsOpen(false), 120);
                                        }, onKeyDown: handleDestinationKeyDown, onChange: (event) => {
                                            onChange({ destination: event.target.value });
                                            setDestinationSuggestionsOpen(true);
                                        } }), canShowDestinationSuggestions && (_jsxs("ul", { className: "autocomplete-list", role: "listbox", "aria-label": "Locatiesuggesties", children: [loadingDestinationSuggestions && (_jsx("li", { className: "autocomplete-item autocomplete-item-muted", children: "Suggesties laden..." })), !loadingDestinationSuggestions &&
                                                destinationSuggestions.map((suggestion, index) => (_jsx("li", { role: "option", "aria-selected": activeDestinationSuggestionIndex === index, className: `autocomplete-item ${activeDestinationSuggestionIndex === index ? "autocomplete-item-active" : ""}`, onMouseDown: (event) => event.preventDefault(), onClick: () => selectDestinationSuggestion(suggestion), children: suggestion.label }, `${suggestion.value}-${index}`))), !loadingDestinationSuggestions && destinationSuggestions.length === 0 && (_jsx("li", { className: "autocomplete-item autocomplete-item-muted", children: "Geen suggesties gevonden." }))] }))] })] })] }), _jsxs("div", { className: "inline-actions route-inline-actions", children: [_jsx("button", { type: "button", className: "ghost", onClick: onUseCurrentLocation, disabled: locatingOrigin || loading, children: locatingOrigin ? "Locatie ophalen..." : "Gebruik huidige locatie" }), _jsx("button", { type: "button", className: "ghost", onClick: onSwapLocations, disabled: loading, children: "Wissel van/naar" })] }), _jsx("button", { type: "button", className: "primary-cta", onClick: onSubmit, disabled: loading, children: loading ? "Route berekenen..." : "Bereken route" }), _jsxs("details", { className: "advanced-settings", open: advancedOpen, onToggle: (event) => setAdvancedOpen(event.currentTarget.open), children: [_jsx("summary", { children: "Meer instellingen" }), _jsxs("div", { className: "advanced-settings-body", children: [_jsxs("fieldset", { children: [_jsx("legend", { children: "Rit type" }), _jsxs("div", { className: "segment", children: [_jsx("button", { type: "button", className: tripType === "one-way" ? "segment-active" : "", onClick: () => onChange({ tripType: "one-way" }), children: "Enkele reis" }), _jsx("button", { type: "button", className: tripType === "return" ? "segment-active" : "", onClick: () => onChange({ tripType: "return" }), children: "Retour" })] })] }), _jsxs("fieldset", { children: [_jsx("legend", { children: "OV planning" }), _jsxs("div", { className: "segment", children: [_jsx("button", { type: "button", className: transitTimeType === "departure" ? "segment-active" : "", onClick: () => onChange({ transitTimeType: "departure" }), children: "Vertrek om" }), _jsx("button", { type: "button", className: transitTimeType === "arrival" ? "segment-active" : "", onClick: () => onChange({ transitTimeType: "arrival" }), children: "Aankomst om" })] })] }), _jsxs("label", { children: ["Datum en tijd", _jsx("input", { type: "datetime-local", value: transitDateTimeLocal, onChange: (event) => onChange({ transitDateTimeLocal: event.target.value }) })] }), _jsx("p", { className: "muted form-helper", children: "Nodig om OV-routes en prijzen te vergelijken." }), _jsxs("div", { className: "profile-summary", children: [_jsxs("div", { children: [_jsx("p", { children: "Auto/profiel" }), _jsx("strong", { children: profile.name }), _jsxs("small", { children: [profile.consumptionPer100Km.toFixed(1), " ", profile.fuelType === "electric" ? "kWh" : "l", "/100 km \u2022 EUR", " ", profile.energyPrice.toFixed(2)] })] }), _jsx("button", { type: "button", className: "ghost", onClick: onOpenProfile, children: "Aanpassen" })] })] })] })] }));
};
