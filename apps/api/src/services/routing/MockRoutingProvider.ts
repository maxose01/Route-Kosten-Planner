import type { LocationSuggestion, RouteResult } from "@route-cost/shared";

import type { RoutingProvider } from "./RoutingProvider.js";

export class MockRoutingProvider implements RoutingProvider {
  async suggestLocations(query: string, limit: number): Promise<LocationSuggestion[]> {
    const mockLocations: LocationSuggestion[] = [
      { label: "Haarlem, Noord-Holland, Nederland", value: "Haarlem", location: { lat: 52.3874, lng: 4.6462 } },
      { label: "Den Haag, Zuid-Holland, Nederland", value: "Den Haag", location: { lat: 52.0705, lng: 4.3007 } },
      { label: "Amsterdam, Noord-Holland, Nederland", value: "Amsterdam", location: { lat: 52.3676, lng: 4.9041 } },
      { label: "Rotterdam, Zuid-Holland, Nederland", value: "Rotterdam", location: { lat: 51.9244, lng: 4.4777 } },
      { label: "Utrecht, Utrecht, Nederland", value: "Utrecht", location: { lat: 52.0907, lng: 5.1214 } }
    ];

    const normalizedQuery = query.trim().toLowerCase();

    return mockLocations.filter((item) => item.label.toLowerCase().includes(normalizedQuery)).slice(0, limit);
  }

  async calculateRoute(origin: string, destination: string): Promise<RouteResult> {
    return {
      origin,
      destination,
      distanceKm: 48.2,
      durationMinutes: 45,
      polyline: "w~qiHteyx@_seAoqxB",
      instructions: [
        {
          index: 0,
          instruction: "Vertrek richting noordoost.",
          distanceMeters: 2200,
          durationSeconds: 240,
          maneuverType: "depart",
          roadName: "Centrumring",
          location: { lat: 52.0705, lng: 4.3007 }
        },
        {
          index: 1,
          instruction: "Sla rechtsaf richting de A4.",
          distanceMeters: 15200,
          durationSeconds: 780,
          maneuverType: "turn",
          maneuverModifier: "right",
          roadName: "A4",
          location: { lat: 52.1097, lng: 4.3292 }
        },
        {
          index: 2,
          instruction: "Volg de weg richting Haarlem.",
          distanceMeters: 26400,
          durationSeconds: 1380,
          maneuverType: "continue",
          maneuverModifier: "straight",
          roadName: "A9",
          location: { lat: 52.2964, lng: 4.6698 }
        },
        {
          index: 3,
          instruction: "Je bent gearriveerd op je bestemming.",
          distanceMeters: 0,
          durationSeconds: 0,
          maneuverType: "arrive",
          roadName: "Haarlem",
          location: { lat: 52.3874, lng: 4.6462 }
        }
      ]
    };
  }
}
