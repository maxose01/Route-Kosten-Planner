import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const formatCurrency = (value) => {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR"
    }).format(value);
};
const formatTime = (value) => {
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
const getCheapestOption = (options) => {
    if (options.length === 0) {
        return null;
    }
    return options.reduce((cheapest, option) => {
        if (!cheapest) {
            return option;
        }
        return option.estimatedCost < cheapest.estimatedCost ? option : cheapest;
    }, null);
};
export const TransitResultCard = ({ result, loading, error, carCostOneWay }) => {
    const cheapestOption = result ? getCheapestOption(result.options) : null;
    const costDelta = cheapestOption && carCostOneWay !== null ? cheapestOption.estimatedCost - carCostOneWay : null;
    const visibleOptions = result?.options.slice(0, 3) ?? [];
    return (_jsxs("section", { className: "card transit-card", "aria-live": "polite", children: [_jsx("p", { className: "result-label", children: "OV vergelijking (NL)" }), _jsx("h3", { children: "Openbaar vervoer" }), loading && _jsx("p", { className: "muted", children: "OV-routeopties laden..." }), !loading && error && _jsx("p", { className: "nav-alert", children: error }), !loading && !error && !result && _jsx("p", { className: "muted", children: "Bereken een route om OV-opties te tonen." }), !loading && !error && result && (_jsxs(_Fragment, { children: [cheapestOption && (_jsxs("div", { className: "transit-highlight", children: [_jsxs("strong", { children: ["Goedkoopste OV-optie: ", formatCurrency(cheapestOption.estimatedCost)] }), _jsxs("small", { children: [cheapestOption.durationMinutes, " min \u2022 ", cheapestOption.transfers, " overstap", cheapestOption.transfers === 1 ? "" : "pen"] })] })), costDelta !== null && (_jsx("p", { className: "transit-compare", children: costDelta <= 0
                            ? `OV is ongeveer ${formatCurrency(Math.abs(costDelta))} goedkoper dan auto (enkele reis).`
                            : `OV is ongeveer ${formatCurrency(costDelta)} duurder dan auto (enkele reis).` })), _jsx("div", { className: "transit-options", children: visibleOptions.map((option, index) => (_jsxs("article", { className: "transit-option", children: [_jsxs("div", { className: "transit-option-head", children: [_jsxs("strong", { children: ["Optie ", index + 1] }), _jsx("strong", { children: formatCurrency(option.estimatedCost) })] }), _jsxs("p", { className: "muted", children: [formatTime(option.departureTime), " \u2192 ", formatTime(option.arrivalTime), " \u2022 ", option.durationMinutes, " min \u2022", " ", option.transfers, " overstap", option.transfers === 1 ? "" : "pen"] }), _jsx("p", { children: option.summary }), _jsx("span", { className: "transit-source-chip", children: option.fareSource === "api" ? "Prijs uit OV-data" : "Geschatte prijs" }), _jsxs("details", { className: "transit-option-details", children: [_jsx("summary", { children: "Toon trajectstappen" }), _jsx("ul", { className: "transit-leg-list", children: option.legs.slice(0, 5).map((leg, legIndex) => (_jsxs("li", { children: [leg.modeLabel, leg.lineLabel ? ` ${leg.lineLabel}` : "", ": ", leg.fromName, " \u2192 ", leg.toName] }, `${option.id}-leg-${legIndex}`))) })] })] }, option.id))) }), _jsx("p", { className: "explanation", children: result.disclaimer })] }))] }));
};
