# Sri Lanka Locations Map

> This build presents the "Occupied North" / "Eelam Tamil Territories"
> framing as advocacy content (labeled "Advocacy project" in the header),
> reflecting the Tamil Eelam position on the Northern Province. For
> transparency: the Sri Lankan government's position is that this region is
> sovereign Sri Lankan territory (Northern Province) under normal civil
> administration since the civil war ended in 2009, not occupied territory.
> If you want a neutral or dual-perspective version alongside this one, ask
> and it can be added as a separate build or toggle.

A full-stack app for pinning and managing points of interest in Sri Lanka on an
interactive map. Enter a postcode or address — the backend geocodes it
automatically via Nominatim (OpenStreetMap), so you never type coordinates by
hand.

**Stack:** React + Leaflet (frontend) · Node.js + Express (API) · PostgreSQL + PostGIS (storage) · Nominatim (geocoding)

```
srilanka-locations-map/
├── backend/
│   ├── src/
│   │   ├── server.js            # Express app entrypoint
│   │   ├── db.js                # PostgreSQL connection pool
│   │   ├── routes/locations.js  # CRUD REST endpoints
│   │   ├── services/geocoding.js# Nominatim client
│   │   └── db/
│   │       ├── schema.sql       # PostGIS-enabled schema
│   │       └── seed.sql         # Sample Sri Lanka locations
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.jsx
    │   ├── index.js / index.css
    │   ├── api/locations.js     # fetch wrapper for the REST API
    │   └── components/
    │       ├── MapView.jsx      # Leaflet map + markers
    │       ├── LocationForm.jsx # single address field, no lat/lon inputs
    │       └── LocationList.jsx
    └── package.json
```

## How the pieces talk to each other

```
 ┌────────────┐   1. POST /api/locations        ┌────────────┐
 │   React     │   { name, address, ... }        │  Express    │
 │  frontend   │ ───────────────────────────────▶│  API        │
 │  (Leaflet)  │                                  │            │
 │             │   4. JSON location incl.         │            │
 │             │◀──── lat/lon ────────────────────│            │
 └────────────┘                                  └─────┬──────┘
                                                         │ 2. GET /search?q=address
                                                         ▼
                                                  ┌────────────┐
                                                  │  Nominatim  │
                                                  │ (OSM geocoder)│
                                                  └─────┬──────┘
                                                         │ 3. { lat, lon }
                                                         ▼
                                                  ┌────────────┐
                                                  │ PostgreSQL  │
                                                  │  + PostGIS  │
                                                  │ (geography  │
                                                  │  point)     │
                                                  └────────────┘
```

1. The frontend never sends latitude/longitude — only the form fields
   (name, description, category, address).
2. On `POST`/`PUT`, the Express route calls `services/geocoding.js`, which
   queries Nominatim's `/search` endpoint with the address text (biased to
   `countrycodes=lk`).
3. Nominatim returns the best-match coordinate. If nothing is found, the API
   responds `422` and nothing is written to the database.
4. The coordinate is stored as a PostGIS `GEOGRAPHY(Point, 4326)` alongside the
   original address text, and the full record (including derived lat/lon) is
   returned to the frontend.
5. The frontend calls `GET /api/locations` to list all points and renders them
   as Leaflet markers on an OpenStreetMap tile layer, centered on Sri Lanka.

Storing geometry as PostGIS `geography` (not two plain float columns) means
you get accurate spatial indexing and can later add real distance/bounding-box
queries (e.g. "locations within 5km") almost for free with `ST_DWithin`.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ with the PostGIS extension available (`postgis` package on
  most distros / Postgres.app on macOS / included in the `postgis/postgis`
  Docker image)

## 1. Database setup

```bash
createdb srilanka_locations
psql -U postgres -d srilanka_locations -f backend/src/db/schema.sql
psql -U postgres -d srilanka_locations -f backend/src/db/seed.sql   # optional sample data
```

Or with Docker:

```bash
docker run --name srilanka-postgis -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgis/postgis:16-3.4
docker exec -i srilanka-postgis psql -U postgres -c "CREATE DATABASE srilanka_locations;"
docker exec -i srilanka-postgis psql -U postgres -d srilanka_locations < backend/src/db/schema.sql
docker exec -i srilanka-postgis psql -U postgres -d srilanka_locations < backend/src/db/seed.sql
```

## 2. Backend

```bash
cd backend
cp .env.example .env    # edit PG* vars and NOMINATIM_USER_AGENT
npm install
npm run dev              # nodemon, http://localhost:4000
```

`NOMINATIM_USER_AGENT` matters: Nominatim's usage policy requires a real,
identifying User-Agent on every request; requests without one may be blocked.
For production traffic, self-host a Nominatim instance or use a commercial
geocoder that mirrors the OSM data (e.g. a paid Nominatim host) rather than
hammering the public `nominatim.openstreetmap.org` endpoint, which is rate
limited to ~1 request/second and intended for light use.

## 3. Frontend

```bash
cd frontend
npm install
npm start                # http://localhost:3000
```

By default the frontend calls the API at `http://localhost:4000/api`. Override
with a `.env` file containing `REACT_APP_API_URL=https://your-api-host/api` if
deploying separately.

## REST API reference

Base URL: `/api/locations`

| Method | Path              | Body                                                              | Description |
|--------|-------------------|--------------------------------------------------------------------|-------------|
| GET    | `/`               | –                                                                   | List all locations. Optional `?category=beach` filter. |
| GET    | `/:id`            | –                                                                   | Fetch one location. |
| POST   | `/`               | `{ name, description?, category?, address }`                       | Geocodes `address` via Nominatim, then creates the row. |
| PUT    | `/:id`            | `{ name?, description?, category?, address? }`                     | Updates fields; re-geocodes only if `address` changed. |
| DELETE | `/:id`            | –                                                                   | Deletes the location. |

Example response:

```json
{
  "id": 1,
  "name": "Sigiriya Rock Fortress",
  "description": "Ancient rock fortress and UNESCO World Heritage Site",
  "category": "landmark",
  "address": "Sigiriya, Central Province, Sri Lanka",
  "latitude": 7.9570,
  "longitude": 80.7603,
  "createdAt": "2026-07-12T09:00:00.000Z",
  "updatedAt": "2026-07-12T09:00:00.000Z"
}
```

Error responses use `{ "error": "..." }` (or `{ "errors": [...] }` for
validation) with an appropriate 4xx/5xx status — e.g. `422` when Nominatim
can't resolve the address, or `400` for missing required fields.

## Deleting locations

Deleting a saved location requires a password, enforced on the backend (not
just hidden in the UI). Set it via `DELETE_PASSWORD` in `backend/.env`. The
frontend prompts for it and sends it as the `X-Delete-Password` header; the
API rejects the delete with `403` if it doesn't match. Leaving
`DELETE_PASSWORD` unset in `.env` disables the check.

## Notes & next steps

- `category` is constrained by a `CHECK` on the database and validated in the
  API (`landmark, restaurant, hotel, beach, temple, nature, shopping, other`).
- Editing a location only re-geocodes when the address text actually changes,
  avoiding unnecessary calls to Nominatim.
- For heavier traffic, add a geocode cache table keyed by normalized address
  text, and/or self-host Nominatim (Docker image `mediagis/nominatim`).
