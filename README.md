# RouteKosten Planner MVP

RouteKosten Planner is een webapp waarmee je een autoroute plant en direct ziet wat de rit ongeveer kost op basis van je eigen auto-/verbruiksprofiel.

Kernbelofte: **Plan je route en zie direct wat de rit je kost.**

## Architectuur

Monorepo met gescheiden frontend en backend:

- `apps/web`: React + TypeScript frontend (mobile-first)
- `apps/api`: Node.js + Express + TypeScript backend API
- `packages/shared`: gedeelde types/constants/utils

De frontend bevat geen geheime API keys. Routing calls gaan via de backend.

## Functionaliteit in deze MVP

- Route plannen met `origin` en `destination`
- Enkele reis of retour
- Lokale auto-/verbruiksprofielen (localStorage)
- Afstand, reistijd en routepolyline ophalen via routing provider
- Turn-by-turn route-instructies uit de routing provider
- Kostenberekening in backend service-laag
- Kaartweergave in frontend met routepolyline + live positie
- Live rijmodus met GPS tracking
- Automatische herroutering bij route-afwijking
- Nederlandse gesproken instructies (browser speech synthesis)
- Validatie en foutafhandeling
- Rate limiting op route-endpoint
- Unit tests voor kostenberekening

## Vereisten

- Node.js 20+
- npm 10+
- Een geldige routing API key (standaard Mapbox)

## Installatie

```bash
npm install
```

Het project gebruikt `esbuild` (via `tsx`/`vite`) en heeft optional dependencies nodig.
Als je ooit een fout krijgt zoals `@esbuild/darwin-arm64 could not be found`, voer dan uit:

```bash
npm install --include=optional
```

## Configuratie

1. Kopieer `.env.example` naar `.env`
2. Vul minimaal de provider en API key in

Voorbeeld:

```env
PORT=4000
NODE_ENV=development
MAPS_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=...
CORS_ORIGIN=http://localhost:5173
```

Optionele providers zijn alvast voorbereid via interface, maar in deze MVP is **Mapbox** volledig geïmplementeerd.

## Development starten

Alles tegelijk:

```bash
npm run dev
```

Of los:

```bash
npm run dev:api
npm run dev:web
```

Let op voor live navigatie:
- Geolocatie werkt op `https://` of op `localhost`.
- Op mobiel moet je locatiepermissie toestaan.

## Testen

```bash
npm run test
```

Geteste cases:

- `48 km, 6.5 l/100 km, EUR 2.10/l = EUR 6.55`
- `100 km, 5.0 l/100 km, EUR 2.00/l = EUR 10.00`
- `200 km, 16 kWh/100 km, EUR 0.35/kWh = EUR 11.20`
- Retourkosten = 2x enkele reis
- Ongeldige waarden geven validatiefout

## Build

```bash
npm run build
```

## API endpoints

### `GET /api/health`

```json
{
  "status": "ok"
}
```

### `POST /api/costs/calculate`

Request:

```json
{
  "distanceKm": 48.2,
  "fuelType": "petrol",
  "consumptionPer100Km": 6.5,
  "energyPrice": 2.1,
  "tripType": "one-way"
}
```

Response:

```json
{
  "distanceKm": 48.2,
  "energyUsed": 3.13,
  "energyUnit": "liter",
  "costOneWay": 6.57,
  "costReturn": 13.14,
  "currency": "EUR"
}
```

### `POST /api/routes/calculate`

Request:

```json
{
  "origin": "Den Haag",
  "destination": "Haarlem",
  "vehicleProfile": {
    "name": "Seat Ibiza",
    "fuelType": "petrol",
    "consumptionPer100Km": 6.5,
    "energyPrice": 2.1
  },
  "tripType": "one-way"
}
```

Response:

```json
{
  "route": {
    "origin": "Den Haag",
    "destination": "Haarlem",
    "distanceKm": 48.2,
    "durationMinutes": 45,
    "polyline": "encoded_polyline_here",
    "instructions": [
      {
        "index": 0,
        "instruction": "Sla rechtsaf naar de A4",
        "distanceMeters": 450,
        "durationSeconds": 35,
        "maneuverType": "turn",
        "maneuverModifier": "right",
        "roadName": "A4",
        "location": {
          "lat": 52.07,
          "lng": 4.3
        }
      }
    ]
  },
  "vehicleProfile": {
    "name": "Seat Ibiza",
    "fuelType": "petrol",
    "consumptionPer100Km": 6.5,
    "energyPrice": 2.1
  },
  "cost": {
    "distanceKm": 48.2,
    "energyUsed": 3.13,
    "energyUnit": "liter",
    "costOneWay": 6.57,
    "costReturn": 13.14,
    "currency": "EUR"
  }
}
```

## Kostenberekening

Formule:

```text
energy_used = distance_km / 100 * consumption_per_100km
cost_one_way = energy_used * energy_price
cost_return = cost_one_way * 2
```

Afronding:

- afstand: 1 decimaal
- energieverbruik: 2 decimalen
- kosten: 2 decimalen

## Security

- API keys alleen in backend `.env`
- CORS beperkt via `CORS_ORIGIN`
- Backend inputvalidatie met Zod
- `helmet` voor basis security headers
- `express-rate-limit` op routeberekening
- Geen gevoelige key-logging

## Mobiele toekomstbestendigheid

- Frontend is mobile-first en responsive
- Backend volledig losgekoppeld via REST
- Business logic (kosten) in backend service
- Gedeelde types in `packages/shared`
- Webapp is voorbereid met web manifest voor PWA richting
