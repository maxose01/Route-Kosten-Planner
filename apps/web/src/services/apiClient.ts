import type {
  CalculateRouteRequest,
  CalculateRouteResponse,
  CalculateTransitRequest,
  CalculateTransitResponse,
  LocationSuggestion,
  SuggestLocationsResponse
} from "@route-cost/shared";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const ROUTES_ENDPOINT = `${API_BASE_URL}/api/routes/calculate`;
const TRANSIT_ENDPOINT = `${API_BASE_URL}/api/transit/calculate`;
const LOCATION_SUGGESTIONS_ENDPOINT = `${API_BASE_URL}/api/locations/suggest`;

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

export const calculateRoute = async (
  payload: CalculateRouteRequest
): Promise<CalculateRouteResponse> => {
  let response: Response;

  try {
    response = await fetch(ROUTES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Kan geen verbinding maken met de API (${ROUTES_ENDPOINT}). Start de backend met 'npm run dev:api'.`
      );
    }

    throw error;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(errorData?.error?.message ?? "Routeberekening mislukt.");
  }

  return (await response.json()) as CalculateRouteResponse;
};

export const calculateTransit = async (
  payload: CalculateTransitRequest
): Promise<CalculateTransitResponse> => {
  let response: Response;

  try {
    response = await fetch(TRANSIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Kan geen verbinding maken met de API (${TRANSIT_ENDPOINT}). Start de backend met 'npm run dev:api'.`
      );
    }

    throw error;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(errorData?.error?.message ?? "OV-routeberekening mislukt.");
  }

  return (await response.json()) as CalculateTransitResponse;
};

interface FetchLocationSuggestionsOptions {
  limit?: number;
  signal?: AbortSignal;
}

export const fetchLocationSuggestions = async (
  query: string,
  options: FetchLocationSuggestionsOptions = {}
): Promise<LocationSuggestion[]> => {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmedQuery
  });

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  const endpoint = `${LOCATION_SUGGESTIONS_ENDPOINT}?${params.toString()}`;

  let response: Response;

  try {
    response = await fetch(endpoint, { signal: options.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error(`Kan geen locatiesuggesties ophalen via de API (${endpoint}).`);
    }

    throw error;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(errorData?.error?.message ?? "Locatiesuggesties ophalen mislukt.");
  }

  const payload = (await response.json()) as SuggestLocationsResponse;
  return payload.suggestions ?? [];
};
