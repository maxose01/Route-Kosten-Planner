import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const formatCurrency = (value) => new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
}).format(value);
export const ResultCard = ({ result, tripType, selectedRouteId, onSelectRoute }) => {
    const selectedRouteOption = result.routeOptions.find((routeOption) => routeOption.id === selectedRouteId) ??
        result.routeOptions.find((routeOption) => routeOption.id === result.selectedRouteId) ??
        result.routeOptions[0];
    const activeRoute = selectedRouteOption?.route ?? result.route;
    const activeCost = selectedRouteOption?.cost ?? result.cost;
    const activeConsumptionPer100Km = selectedRouteOption?.consumptionPer100KmAdjusted ?? result.vehicleProfile.consumptionPer100Km;
    const unitLabel = activeCost.energyUnit === "kWh" ? "kWh" : "liter";
    const showRouteOptions = result.routeOptions.length > 1;
    return (_jsxs("section", { className: "card result-card", "aria-live": "polite", children: [showRouteOptions && (_jsxs("div", { className: "route-options", children: [_jsx("p", { className: "result-label", children: "Route suggesties" }), _jsx("div", { className: "route-options-grid", children: result.routeOptions.map((routeOption) => {
                            const isSelected = routeOption.id === selectedRouteOption?.id;
                            return (_jsxs("button", { type: "button", className: `route-option-card ${isSelected ? "route-option-card-active" : ""}`, onClick: () => onSelectRoute(routeOption.id), "aria-pressed": isSelected, children: [_jsx("span", { className: "route-option-chip", children: routeOption.title }), _jsxs("div", { className: "route-option-main", children: [_jsx("strong", { children: formatCurrency(routeOption.cost.costOneWay) }), _jsxs("small", { children: [routeOption.route.distanceKm.toFixed(1), " km \u2022 ", routeOption.route.durationMinutes, " min"] })] }), _jsx("p", { children: routeOption.description })] }, routeOption.id));
                        }) })] })), _jsx("p", { className: "result-label", children: "Geschatte ritkosten" }), _jsx("h2", { children: formatCurrency(activeCost.costOneWay) }), _jsx("p", { className: "muted", children: "Enkele reis" }), tripType === "return" && (_jsxs("div", { className: "return-row", children: [_jsx("span", { children: "Retour" }), _jsx("strong", { children: formatCurrency(activeCost.costReturn) })] })), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { children: [_jsx("p", { children: "Afstand" }), _jsxs("strong", { children: [activeRoute.distanceKm.toFixed(1), " km"] })] }), _jsxs("div", { children: [_jsx("p", { children: "Reistijd" }), _jsxs("strong", { children: [activeRoute.durationMinutes, " min"] })] }), _jsxs("div", { children: [_jsx("p", { children: "Verbruik" }), _jsxs("strong", { children: [activeCost.energyUsed.toFixed(2), " ", unitLabel] })] })] }), _jsxs("p", { className: "explanation", children: ["Gebaseerd op ", activeRoute.distanceKm.toFixed(1), " km, ", activeConsumptionPer100Km.toFixed(1), unitLabel === "kWh" ? " kWh" : " l", "/100 km en ", formatCurrency(result.vehicleProfile.energyPrice), " per", " ", unitLabel, ". Verbruik is route-afhankelijk geschat op basis van snelweg/stad-verhouding."] })] }));
};
