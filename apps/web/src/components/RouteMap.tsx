import { useEffect, useMemo } from "react";
import polyline from "@mapbox/polyline";
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { CalculateRouteResponse } from "@route-cost/shared";

import type { Coordinates } from "../utils/navigation";

const fallbackCenter: [number, number] = [52.1326, 5.2913];
const TRACK_UP_ROTATION_PATTERN = /\srotate\(-?\d+(?:\.\d+)?deg\)\s*$/;

interface RouteMapProps {
  result: CalculateRouteResponse | null;
  currentPosition: (Coordinates & { accuracy: number; headingDeg: number | null }) | null;
  navigationActive: boolean;
  offRoute: boolean;
  mode?: "default" | "driving";
  followPosition?: boolean;
  recenterToken?: number;
  onUserMapInteraction?: () => void;
  trackUpEnabled?: boolean;
  mapHeadingDeg?: number | null;
}

const stripTrackUpRotation = (transformValue: string): string => {
  return transformValue.replace(TRACK_UP_ROTATION_PATTERN, "").trim();
};

const FitRouteBounds = ({ points, navigationActive }: { points: [number, number][]; navigationActive: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (!navigationActive && points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points, navigationActive]);

  return null;
};

const RefreshMapSize = ({ mode }: { mode: "default" | "driving" }) => {
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

const MapInteractionObserver = ({
  active,
  onUserMapInteraction
}: {
  active: boolean;
  onUserMapInteraction?: () => void;
}) => {
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

const FollowCurrentPosition = ({
  currentPosition,
  followPosition,
  recenterToken
}: {
  currentPosition: Coordinates | null;
  followPosition: boolean;
  recenterToken: number;
}) => {
  const map = useMap();

  useEffect(() => {
    if (followPosition && currentPosition) {
      map.setView([currentPosition.lat, currentPosition.lng], 16, { animate: true });
    }
  }, [map, currentPosition, followPosition, recenterToken]);

  return null;
};

const TrackUpRotation = ({
  enabled,
  headingDeg
}: {
  enabled: boolean;
  headingDeg: number | null;
}) => {
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

export const RouteMap = ({
  result,
  currentPosition,
  navigationActive,
  offRoute,
  mode = "default",
  followPosition,
  recenterToken = 0,
  onUserMapInteraction,
  trackUpEnabled = false,
  mapHeadingDeg = null
}: RouteMapProps) => {
  const decodedPolyline = useMemo(() => {
    if (!result?.route.polyline) {
      return [] as [number, number][];
    }

    return polyline.decode(result.route.polyline) as [number, number][];
  }, [result]);

  const center = currentPosition
    ? ([currentPosition.lat, currentPosition.lng] as [number, number])
    : decodedPolyline[0] ?? fallbackCenter;

  const destination = decodedPolyline.length > 0 ? decodedPolyline[decodedPolyline.length - 1] : null;

  const shouldFollowPosition = followPosition ?? navigationActive;
  const shouldUseTrackUp = mode === "driving" && trackUpEnabled && shouldFollowPosition;

  const mapNode = (
    <MapContainer
      center={center}
      zoom={mode === "driving" ? 14 : 8}
      scrollWheelZoom
      className={mode === "driving" ? "driving-map-view" : "map-view"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {decodedPolyline.length > 1 && (
        <>
          <Polyline
            positions={decodedPolyline}
            pathOptions={{ color: offRoute ? "#dc2626" : "#0f766e", weight: mode === "driving" ? 8 : 6, opacity: 0.9 }}
          />
          <FitRouteBounds points={decodedPolyline} navigationActive={navigationActive} />
        </>
      )}

      {destination && (
        <CircleMarker
          center={destination}
          radius={mode === "driving" ? 9 : 7}
          pathOptions={{ color: "#1d4ed8", fillColor: "#1d4ed8", fillOpacity: 1 }}
        />
      )}

      {currentPosition && (
        <>
          <Circle
            center={[currentPosition.lat, currentPosition.lng]}
            radius={Math.max(15, currentPosition.accuracy)}
            pathOptions={{ color: "#0ea5e9", fillColor: "#7dd3fc", fillOpacity: 0.2 }}
          />
          <CircleMarker
            center={[currentPosition.lat, currentPosition.lng]}
            radius={mode === "driving" ? 11 : 8}
            pathOptions={{ color: "#0284c7", fillColor: "#22d3ee", fillOpacity: 1 }}
          />
        </>
      )}

      <MapInteractionObserver active={mode === "driving"} onUserMapInteraction={onUserMapInteraction} />
      <FollowCurrentPosition
        currentPosition={currentPosition}
        followPosition={shouldFollowPosition}
        recenterToken={recenterToken}
      />
      <TrackUpRotation enabled={shouldUseTrackUp} headingDeg={mapHeadingDeg} />
      <RefreshMapSize mode={mode} />
    </MapContainer>
  );

  if (mode === "driving") {
    return <div className="driving-map-shell">{mapNode}</div>;
  }

  return (
    <section className="card map-card">
      <h3>Routekaart</h3>
      <div className="map-shell">{mapNode}</div>
      {!result && <p className="muted">Bereken eerst een route om de kaart te vullen.</p>}
    </section>
  );
};
