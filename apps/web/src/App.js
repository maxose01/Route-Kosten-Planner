import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import polyline from "@mapbox/polyline";
import { ErrorNotice } from "./components/ErrorNotice";
import { DrivingModeOverlay } from "./components/DrivingModeOverlay";
import { LiveNavigationCard } from "./components/LiveNavigationCard";
import { ResultCard } from "./components/ResultCard";
import { RouteForm } from "./components/RouteForm";
import { RouteMap } from "./components/RouteMap";
import { TransitResultCard } from "./components/TransitResultCard";
import { VehicleProfileModal } from "./components/VehicleProfileModal";
import { useVehicleProfile } from "./hooks/useVehicleProfile";
import { calculateRoute, calculateTransit } from "./services/apiClient";
import { estimateRemainingDurationSeconds, findUpcomingInstructionIndex, getDistanceToRouteMeters, getRemainingDistanceMeters, haversineDistanceMeters, toCoordinateInput } from "./utils/navigation";
const OFF_ROUTE_THRESHOLD_METERS = 120;
const REROUTE_COOLDOWN_MS = 20000;
const GEO_SECURE_CONTEXT_MESSAGE = "Locatie werkt alleen via HTTPS (of localhost). Open de app via een https:// URL om GPS te gebruiken.";
const toLocalDateTimeInput = (value) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    const hours = `${value.getHours()}`.padStart(2, "0");
    const minutes = `${value.getMinutes()}`.padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};
const getDefaultTransitDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15, 0, 0);
    return toLocalDateTimeInput(now);
};
const parseLocalDateTimeToIso = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString();
};
const isGeolocationAllowedByContext = () => {
    if (typeof window === "undefined") {
        return true;
    }
    return window.isSecureContext;
};
const getGeoErrorMessage = (error) => {
    if (!isGeolocationAllowedByContext()) {
        return GEO_SECURE_CONTEXT_MESSAGE;
    }
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return "Locatietoegang geweigerd. Geef GPS-toegang om live te navigeren.";
        case error.POSITION_UNAVAILABLE:
            return "Locatie niet beschikbaar. Controleer je GPS-signaal.";
        case error.TIMEOUT:
            return "Locatie ophalen duurde te lang. Probeer opnieuw.";
        default:
            return "Onbekende GPS-fout.";
    }
};
export const App = () => {
    const { profile, setProfile } = useVehicleProfile();
    const [origin, setOrigin] = useState("Den Haag");
    const [destination, setDestination] = useState("Haarlem");
    const [tripType, setTripType] = useState("one-way");
    const [transitTimeType, setTransitTimeType] = useState("departure");
    const [transitDateTimeLocal, setTransitDateTimeLocal] = useState(() => getDefaultTransitDateTimeLocal());
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locatingOrigin, setLocatingOrigin] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [transitResult, setTransitResult] = useState(null);
    const [transitError, setTransitError] = useState(null);
    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [navigationActive, setNavigationActive] = useState(false);
    const [permissionState, setPermissionState] = useState("idle");
    const [gpsError, setGpsError] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [upcomingInstructionIndex, setUpcomingInstructionIndex] = useState(0);
    const [rerouting, setRerouting] = useState(false);
    const [focusModeActive, setFocusModeActive] = useState(false);
    const [orientationMode, setOrientationMode] = useState("track-up");
    const [focusFollowPosition, setFocusFollowPosition] = useState(true);
    const [focusRecenterToken, setFocusRecenterToken] = useState(0);
    const watchIdRef = useRef(null);
    const rerouteInFlightRef = useRef(false);
    const lastRerouteAtRef = useRef(0);
    const announcedInstructionRef = useRef(null);
    const canSubmit = useMemo(() => origin.trim().length > 0 && destination.trim().length > 0, [origin, destination]);
    const activeRouteOption = useMemo(() => {
        if (!result) {
            return null;
        }
        return (result.routeOptions.find((routeOption) => routeOption.id === selectedRouteId) ??
            result.routeOptions.find((routeOption) => routeOption.id === result.selectedRouteId) ??
            result.routeOptions[0] ??
            null);
    }, [result, selectedRouteId]);
    const activeResult = useMemo(() => {
        if (!result) {
            return null;
        }
        if (!activeRouteOption) {
            return result;
        }
        return {
            ...result,
            route: activeRouteOption.route,
            cost: activeRouteOption.cost,
            selectedRouteId: activeRouteOption.id
        };
    }, [result, activeRouteOption]);
    const routePoints = useMemo(() => {
        if (!activeResult?.route.polyline) {
            return [];
        }
        const decoded = polyline.decode(activeResult.route.polyline);
        return decoded.map(([lat, lng]) => ({ lat, lng }));
    }, [activeResult?.route.polyline]);
    const liveMetrics = useMemo(() => {
        if (!currentPosition || routePoints.length < 2 || !activeResult) {
            return null;
        }
        const remainingDistanceMeters = getRemainingDistanceMeters(currentPosition, routePoints);
        const remainingDurationSeconds = estimateRemainingDurationSeconds(remainingDistanceMeters, activeResult.route.distanceKm, activeResult.route.durationMinutes);
        const distanceToRouteMeters = getDistanceToRouteMeters(currentPosition, routePoints);
        return {
            remainingDistanceMeters,
            remainingDurationSeconds,
            distanceToRouteMeters
        };
    }, [currentPosition, routePoints, activeResult]);
    const instructions = activeResult?.route.instructions ?? [];
    const currentInstruction = instructions[upcomingInstructionIndex] ?? null;
    const nextInstruction = instructions[upcomingInstructionIndex + 1] ?? null;
    const distanceToInstructionMeters = useMemo(() => {
        if (!currentPosition || !currentInstruction) {
            return null;
        }
        return haversineDistanceMeters(currentPosition, currentInstruction.location);
    }, [currentPosition, currentInstruction]);
    const offRoute = Boolean(liveMetrics && liveMetrics.distanceToRouteMeters > OFF_ROUTE_THRESHOLD_METERS);
    const stopNavigation = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (typeof window.speechSynthesis !== "undefined") {
            window.speechSynthesis.cancel();
        }
        setNavigationActive(false);
        setRerouting(false);
        setFocusModeActive(false);
        setFocusFollowPosition(true);
    };
    const startNavigation = () => {
        if (!activeResult) {
            setGpsError("Bereken eerst een route voordat je navigatie start.");
            return;
        }
        if (!("geolocation" in navigator)) {
            setPermissionState("unsupported");
            setGpsError("Deze browser ondersteunt geen geolocatie.");
            return;
        }
        if (!isGeolocationAllowedByContext()) {
            setGpsError(GEO_SECURE_CONTEXT_MESSAGE);
            return;
        }
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setNavigationActive(true);
        setFocusModeActive(true);
        setFocusFollowPosition(true);
        setFocusRecenterToken((token) => token + 1);
        setGpsError(null);
        watchIdRef.current = navigator.geolocation.watchPosition((position) => {
            setPermissionState("granted");
            setCurrentPosition({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speedKmh: position.coords.speed !== null ? position.coords.speed * 3.6 : null,
                headingDeg: position.coords.heading !== null && Number.isFinite(position.coords.heading)
                    ? position.coords.heading
                    : null
            });
        }, (geoError) => {
            setGpsError(getGeoErrorMessage(geoError));
            if (geoError.code === geoError.PERMISSION_DENIED) {
                setPermissionState("denied");
                stopNavigation();
            }
        }, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 15000
        });
    };
    const handleCalculate = async () => {
        if (!canSubmit) {
            setError("Vul zowel vertrek als bestemming in.");
            return;
        }
        const transitIsoDateTime = parseLocalDateTimeToIso(transitDateTimeLocal);
        if (!transitIsoDateTime) {
            setError("Kies een geldige datum en tijd voor de OV-vergelijking.");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setTransitError(null);
            setTransitResult(null);
            const [routeOutcome, transitOutcome] = await Promise.allSettled([
                calculateRoute({
                    origin: origin.trim(),
                    destination: destination.trim(),
                    vehicleProfile: profile,
                    tripType
                }),
                calculateTransit({
                    origin: origin.trim(),
                    destination: destination.trim(),
                    dateTime: transitIsoDateTime,
                    timeType: transitTimeType
                })
            ]);
            if (routeOutcome.status === "rejected") {
                throw routeOutcome.reason;
            }
            const routeResponse = routeOutcome.value;
            setResult(routeResponse);
            setSelectedRouteId(routeResponse.selectedRouteId);
            setUpcomingInstructionIndex(0);
            announcedInstructionRef.current = null;
            if (transitOutcome.status === "fulfilled") {
                setTransitResult(transitOutcome.value);
            }
            else {
                const transitErrorMessage = transitOutcome.reason instanceof Error
                    ? transitOutcome.reason.message
                    : "OV-routeopties ophalen mislukt.";
                setTransitResult(null);
                setTransitError(transitErrorMessage);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Routeberekening mislukt.");
        }
        finally {
            setLoading(false);
        }
    };
    const handleUseCurrentLocationAsOrigin = () => {
        if (!("geolocation" in navigator)) {
            setError("Deze browser ondersteunt geen geolocatie.");
            return;
        }
        if (!isGeolocationAllowedByContext()) {
            setError(GEO_SECURE_CONTEXT_MESSAGE);
            return;
        }
        setLocatingOrigin(true);
        setError(null);
        navigator.geolocation.getCurrentPosition((position) => {
            const coordinates = toCoordinateInput({ lat: position.coords.latitude, lng: position.coords.longitude });
            setOrigin(coordinates);
            setPermissionState("granted");
            setLocatingOrigin(false);
        }, (geoError) => {
            setError(getGeoErrorMessage(geoError));
            if (geoError.code === geoError.PERMISSION_DENIED) {
                setPermissionState("denied");
            }
            setLocatingOrigin(false);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        });
    };
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);
    useEffect(() => {
        document.body.classList.toggle("driving-mode-open", focusModeActive);
        return () => {
            document.body.classList.remove("driving-mode-open");
        };
    }, [focusModeActive]);
    useEffect(() => {
        if (!focusModeActive) {
            return;
        }
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setFocusModeActive(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [focusModeActive]);
    useEffect(() => {
        if (!navigationActive || !currentPosition || instructions.length === 0) {
            return;
        }
        setUpcomingInstructionIndex((previousIndex) => {
            const nextIndex = findUpcomingInstructionIndex(currentPosition, instructions, previousIndex);
            if (nextIndex === null) {
                return previousIndex;
            }
            return Math.max(previousIndex, nextIndex);
        });
    }, [navigationActive, currentPosition, instructions]);
    useEffect(() => {
        if (!navigationActive || !currentInstruction) {
            return;
        }
        if (announcedInstructionRef.current === upcomingInstructionIndex) {
            return;
        }
        if (typeof window.speechSynthesis === "undefined") {
            return;
        }
        const utterance = new SpeechSynthesisUtterance(currentInstruction.instruction);
        utterance.lang = "nl-NL";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        announcedInstructionRef.current = upcomingInstructionIndex;
    }, [navigationActive, currentInstruction, upcomingInstructionIndex]);
    useEffect(() => {
        if (!navigationActive || !currentPosition || !liveMetrics || !activeResult || !offRoute) {
            return;
        }
        if (destination.trim().length === 0) {
            return;
        }
        const now = Date.now();
        if (rerouteInFlightRef.current || now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS) {
            return;
        }
        rerouteInFlightRef.current = true;
        setRerouting(true);
        const rerouteOrigin = toCoordinateInput(currentPosition);
        calculateRoute({
            origin: rerouteOrigin,
            destination: destination.trim(),
            vehicleProfile: profile,
            tripType
        })
            .then((response) => {
            setResult(response);
            setSelectedRouteId(response.selectedRouteId);
            setOrigin(rerouteOrigin);
            setUpcomingInstructionIndex(0);
            announcedInstructionRef.current = null;
        })
            .catch((rerouteError) => {
            setError(rerouteError instanceof Error ? rerouteError.message : "Herroutering mislukt.");
        })
            .finally(() => {
            rerouteInFlightRef.current = false;
            lastRerouteAtRef.current = Date.now();
            setRerouting(false);
        });
    }, [navigationActive, currentPosition, liveMetrics, activeResult, offRoute, destination, profile, tripType]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "layout", children: [_jsxs("div", { className: "left-column", children: [_jsx(RouteForm, { origin: origin, destination: destination, tripType: tripType, transitDateTimeLocal: transitDateTimeLocal, transitTimeType: transitTimeType, profile: profile, loading: loading, locatingOrigin: locatingOrigin, onChange: (input) => {
                                    if (input.origin !== undefined)
                                        setOrigin(input.origin);
                                    if (input.destination !== undefined)
                                        setDestination(input.destination);
                                    if (input.tripType !== undefined)
                                        setTripType(input.tripType);
                                    if (input.transitDateTimeLocal !== undefined)
                                        setTransitDateTimeLocal(input.transitDateTimeLocal);
                                    if (input.transitTimeType !== undefined)
                                        setTransitTimeType(input.transitTimeType);
                                }, onOpenProfile: () => setModalOpen(true), onUseCurrentLocation: handleUseCurrentLocationAsOrigin, onSubmit: handleCalculate }), _jsx(LiveNavigationCard, { hasRoute: Boolean(activeResult), navigationActive: navigationActive, permissionState: permissionState, gpsError: gpsError, currentInstruction: currentInstruction, nextInstruction: nextInstruction, remainingDistanceKm: liveMetrics ? liveMetrics.remainingDistanceMeters / 1000 : null, remainingDurationMinutes: liveMetrics ? liveMetrics.remainingDurationSeconds / 60 : null, speedKmh: currentPosition?.speedKmh ?? null, distanceToInstructionMeters: distanceToInstructionMeters, offRoute: offRoute, rerouting: rerouting, focusModeActive: focusModeActive, onStart: startNavigation, onStop: stopNavigation, onToggleFocusMode: () => {
                                    setFocusModeActive((value) => {
                                        const nextValue = !value;
                                        if (nextValue) {
                                            setFocusFollowPosition(true);
                                            setFocusRecenterToken((token) => token + 1);
                                        }
                                        return nextValue;
                                    });
                                } }), error && _jsx(ErrorNotice, { message: error }), result && (_jsx(ResultCard, { result: result, tripType: tripType, selectedRouteId: activeRouteOption?.id ?? selectedRouteId, onSelectRoute: (routeId) => {
                                    setSelectedRouteId(routeId);
                                    setUpcomingInstructionIndex(0);
                                    announcedInstructionRef.current = null;
                                } })), _jsx(TransitResultCard, { result: transitResult, loading: loading, error: transitError, carCostOneWay: activeResult?.cost.costOneWay ?? null })] }), _jsx("div", { className: "right-column", children: _jsx(RouteMap, { result: activeResult, currentPosition: currentPosition, navigationActive: navigationActive, offRoute: offRoute }) })] }), _jsx(VehicleProfileModal, { open: modalOpen, initialValue: profile, onClose: () => setModalOpen(false), onSave: (newProfile) => setProfile(newProfile) }), _jsx(DrivingModeOverlay, { active: navigationActive && focusModeActive, result: activeResult, currentPosition: currentPosition, navigationActive: navigationActive, followPosition: focusFollowPosition, recenterToken: focusRecenterToken, orientationMode: orientationMode, onToggleOrientation: () => setOrientationMode((mode) => (mode === "track-up" ? "north-up" : "track-up")), onMapInteraction: () => setFocusFollowPosition(false), onRecenter: () => {
                    setFocusFollowPosition(true);
                    setFocusRecenterToken((token) => token + 1);
                }, offRoute: offRoute, rerouting: rerouting, currentInstruction: currentInstruction, nextInstruction: nextInstruction, distanceToInstructionMeters: distanceToInstructionMeters, remainingDistanceKm: liveMetrics ? liveMetrics.remainingDistanceMeters / 1000 : null, remainingDurationMinutes: liveMetrics ? liveMetrics.remainingDurationSeconds / 60 : null, speedKmh: currentPosition?.speedKmh ?? null, onStopNavigation: stopNavigation })] }));
};
