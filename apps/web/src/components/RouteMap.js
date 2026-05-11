import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from "react";
import polyline from "@mapbox/polyline";
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
const fallbackCenter = [52.1326, 5.2913];
const TRACK_UP_ROTATION_PATTERN = /\srotate\(-?\d+(?:\.\d+)?deg\)\s*$/;
const stripTrackUpRotation = (transformValue) => {
    return transformValue.replace(TRACK_UP_ROTATION_PATTERN, "").trim();
};
const FitRouteBounds = ({ points, navigationActive }) => {
    const map = useMap();
    useEffect(() => {
        if (!navigationActive && points.length > 1) {
            map.fitBounds(points, { padding: [40, 40] });
        }
    }, [map, points, navigationActive]);
    return null;
};
const RefreshMapSize = ({ mode }) => {
    const map = useMap();
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            map.invalidateSize({ pan: false });
        }, 60);
        return () => {
            window.clearTimeout(timeout);
        };
    }, [map, mode]);
    return null;
};
const MapInteractionObserver = ({ active, onUserMapInteraction }) => {
    useMapEvents({
        dragstart: () => {
            if (active) {
                onUserMapInteraction?.();
            }
        },
        zoomstart: () => {
            if (active) {
                onUserMapInteraction?.();
            }
        }
    });
    return null;
};
const FollowCurrentPosition = ({ currentPosition, followPosition, recenterToken }) => {
    const map = useMap();
    useEffect(() => {
        if (followPosition && currentPosition) {
            map.setView([currentPosition.lat, currentPosition.lng], 16, { animate: true });
        }
    }, [map, currentPosition, followPosition, recenterToken]);
    return null;
};
const TrackUpRotation = ({ enabled, headingDeg }) => {
    const map = useMap();
    useEffect(() => {
        const mapPane = map.getPane("mapPane");
        if (!mapPane) {
            return;
        }
        const applyRotation = () => {
            const baseTransform = stripTrackUpRotation(mapPane.style.transform || "");
            if (enabled && headingDeg !== null && Number.isFinite(headingDeg)) {
                mapPane.style.transformOrigin = "50% 50%";
                mapPane.style.transform = `${baseTransform} rotate(${-headingDeg}deg)`.trim();
                return;
            }
            mapPane.style.transform = baseTransform;
        };
        applyRotation();
        map.on("move", applyRotation);
        map.on("zoom", applyRotation);
        return () => {
            map.off("move", applyRotation);
            map.off("zoom", applyRotation);
            mapPane.style.transform = stripTrackUpRotation(mapPane.style.transform || "");
        };
    }, [map, enabled, headingDeg]);
    return null;
};
export const RouteMap = ({ result, currentPosition, navigationActive, offRoute, mode = "default", followPosition, recenterToken = 0, onUserMapInteraction, trackUpEnabled = false, mapHeadingDeg = null }) => {
    const decodedPolyline = useMemo(() => {
        if (!result?.route.polyline) {
            return [];
        }
        return polyline.decode(result.route.polyline);
    }, [result]);
    const center = currentPosition
        ? [currentPosition.lat, currentPosition.lng]
        : decodedPolyline[0] ?? fallbackCenter;
    const destination = decodedPolyline.length > 0 ? decodedPolyline[decodedPolyline.length - 1] : null;
    const shouldFollowPosition = followPosition ?? navigationActive;
    const shouldUseTrackUp = mode === "driving" && trackUpEnabled && shouldFollowPosition;
    const mapNode = (_jsxs(MapContainer, { center: center, zoom: mode === "driving" ? 14 : 8, scrollWheelZoom: true, className: mode === "driving" ? "driving-map-view" : "map-view", children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), decodedPolyline.length > 1 && (_jsxs(_Fragment, { children: [_jsx(Polyline, { positions: decodedPolyline, pathOptions: { color: offRoute ? "#dc2626" : "#0f766e", weight: mode === "driving" ? 8 : 6, opacity: 0.9 } }), _jsx(FitRouteBounds, { points: decodedPolyline, navigationActive: navigationActive })] })), destination && (_jsx(CircleMarker, { center: destination, radius: mode === "driving" ? 9 : 7, pathOptions: { color: "#1d4ed8", fillColor: "#1d4ed8", fillOpacity: 1 } })), currentPosition && (_jsxs(_Fragment, { children: [_jsx(Circle, { center: [currentPosition.lat, currentPosition.lng], radius: Math.max(15, currentPosition.accuracy), pathOptions: { color: "#0ea5e9", fillColor: "#7dd3fc", fillOpacity: 0.2 } }), _jsx(CircleMarker, { center: [currentPosition.lat, currentPosition.lng], radius: mode === "driving" ? 11 : 8, pathOptions: { color: "#0284c7", fillColor: "#22d3ee", fillOpacity: 1 } })] })), _jsx(MapInteractionObserver, { active: mode === "driving", onUserMapInteraction: onUserMapInteraction }), _jsx(FollowCurrentPosition, { currentPosition: currentPosition, followPosition: shouldFollowPosition, recenterToken: recenterToken }), _jsx(TrackUpRotation, { enabled: shouldUseTrackUp, headingDeg: mapHeadingDeg }), _jsx(RefreshMapSize, { mode: mode })] }));
    if (mode === "driving") {
        return _jsx("div", { className: "driving-map-shell", children: mapNode });
    }
    return (_jsxs("section", { className: "card map-card", children: [_jsx("h3", { children: "Routekaart" }), _jsx("div", { className: "map-shell", children: mapNode }), !result && _jsx("p", { className: "muted", children: "Bereken eerst een route om de kaart te vullen." })] }));
};
