import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const formatCurrency = (value) => new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
}).format(value);
export const ResultCard = ({ result, tripType }) => {
    const unitLabel = result.cost.energyUnit === "kWh" ? "kWh" : "liter";
    return (_jsxs("section", { className: "card result-card", "aria-live": "polite", children: [_jsx("p", { className: "result-label", children: "Geschatte ritkosten" }), _jsx("h2", { children: formatCurrency(result.cost.costOneWay) }), _jsx("p", { className: "muted", children: "Enkele reis" }), tripType === "return" && (_jsxs("div", { className: "return-row", children: [_jsx("span", { children: "Retour" }), _jsx("strong", { children: formatCurrency(result.cost.costReturn) })] })), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { children: [_jsx("p", { children: "Afstand" }), _jsxs("strong", { children: [result.route.distanceKm.toFixed(1), " km"] })] }), _jsxs("div", { children: [_jsx("p", { children: "Reistijd" }), _jsxs("strong", { children: [result.route.durationMinutes, " min"] })] }), _jsxs("div", { children: [_jsx("p", { children: "Verbruik" }), _jsxs("strong", { children: [result.cost.energyUsed.toFixed(2), " ", unitLabel] })] })] }), _jsxs("p", { className: "explanation", children: ["Gebaseerd op ", result.route.distanceKm.toFixed(1), " km, ", result.vehicleProfile.consumptionPer100Km.toFixed(1), unitLabel === "kWh" ? " kWh" : " l", "/100 km en ", formatCurrency(result.vehicleProfile.energyPrice), " per ", unitLabel, "."] })] }));
};
