import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RouteMap } from "./RouteMap";
const formatDistance = (distanceMeters) => {
    if (distanceMeters === null) {
        return "-";
    }
    if (distanceMeters < 1000) {
        return `${Math.max(1, Math.round(distanceMeters))} m`;
    }
    return `${(distanceMeters / 1000).toFixed(1)} km`;
};
const getManeuverIcon = (instruction) => {
    if (!instruction) {
        return "⬆";
    }
    if (instruction.maneuverType === "arrive") {
        return "◎";
    }
    if (instruction.maneuverType === "roundabout") {
        return "⟳";
    }
    const modifier = instruction.maneuverModifier;
    switch (modifier) {
        case "slight right":
            return "↗";
        case "right":
            return "➡";
        case "sharp right":
            return "↘";
        case "slight left":
            return "↖";
        case "left":
            return "⬅";
        case "sharp left":
            return "↙";
        case "uturn":
        case "uturn left":
        case "uturn right":
            return "↩";
        default:
            return "⬆";
    }
};
export const DrivingModeOverlay = ({ active, result, currentPosition, navigationActive, followPosition, recenterToken, orientationMode, onToggleOrientation, onMapInteraction, onRecenter, offRoute, rerouting, currentInstruction, nextInstruction, distanceToInstructionMeters, remainingDistanceKm, remainingDurationMinutes, speedKmh, onStopNavigation }) => {
    if (!active) {
        return null;
    }
    const now = new Date();
    const arrivalTime = remainingDurationMinutes !== null
        ? new Date(now.getTime() + Math.max(0, remainingDurationMinutes) * 60 * 1000)
        : null;
    const arrivalLabel = arrivalTime
        ? new Intl.DateTimeFormat("nl-NL", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(arrivalTime)
        : "-";
    const speedLabel = speedKmh !== null ? `${Math.max(0, Math.round(speedKmh))} km/u` : "- km/u";
    const orientationLabel = orientationMode === "track-up" ? "Richting-up" : "Noord-up";
    return (_jsxs("div", { className: "driving-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Driving mode", children: [_jsx(RouteMap, { mode: "driving", result: result, currentPosition: currentPosition, navigationActive: navigationActive, followPosition: followPosition, recenterToken: recenterToken, onUserMapInteraction: onMapInteraction, trackUpEnabled: orientationMode === "track-up", mapHeadingDeg: currentPosition?.headingDeg ?? null, offRoute: offRoute }), _jsxs("header", { className: "driving-top-bar", children: [_jsx("div", { className: "driving-icon", "aria-hidden": "true", children: getManeuverIcon(currentInstruction) }), _jsxs("div", { className: "driving-instruction-copy", children: [_jsxs("p", { className: "driving-distance", children: ["Over ", formatDistance(distanceToInstructionMeters)] }), _jsx("h2", { children: currentInstruction?.instruction ?? "Volg de route" }), nextInstruction && _jsxs("p", { className: "driving-next", children: ["Daarna: ", nextInstruction.instruction] })] })] }), _jsxs("footer", { className: "driving-bottom-bar", children: [_jsx("button", { type: "button", className: "driving-close-button", onClick: onStopNavigation, "aria-label": "Stop navigatie", children: "\u2715" }), _jsxs("div", { className: "driving-summary", children: [_jsx("strong", { className: "driving-summary-primary", children: remainingDurationMinutes !== null ? `${Math.max(0, Math.round(remainingDurationMinutes))} min` : "-" }), _jsxs("p", { className: "driving-summary-secondary", children: [remainingDistanceKm !== null ? `${remainingDistanceKm.toFixed(1)} km` : "-", " \u2022 Aankomst ", arrivalLabel, " \u2022", " ", speedLabel] })] }), _jsxs("div", { className: "driving-right-actions", children: [_jsx("button", { type: "button", className: `driving-round-button ${orientationMode === "track-up" ? "driving-round-button-active" : ""}`, onClick: onToggleOrientation, "aria-label": `Kaartoriëntatie: ${orientationLabel}`, title: `Kaartoriëntatie: ${orientationLabel}`, children: orientationMode === "track-up" ? "↗" : "N" }), _jsx("button", { type: "button", className: `driving-round-button ${!followPosition ? "driving-round-button-attention" : ""}`, onClick: onRecenter, "aria-label": "Ga terug naar live locatie", title: "Ga terug naar live locatie", children: "\u25CE" })] }), rerouting && _jsx("span", { className: "driving-chip", children: "Nieuwe route berekenen..." }), offRoute && !rerouting && _jsx("span", { className: "driving-chip driving-chip-warning", children: "Van route afgeweken" })] })] }));
};
