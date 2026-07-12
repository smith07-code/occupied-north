-- Run once against your target database, e.g.:
--   psql -U postgres -d srilanka_locations -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS locations (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    category     VARCHAR(50) NOT NULL DEFAULT 'other'
                 CHECK (category IN ('landmark','restaurant','hotel','beach','disputed_religious_installation','military_presence','other')),
    address      VARCHAR(500) NOT NULL, -- original postcode / address text entered by the user
    geom         GEOGRAPHY(Point, 4326) NOT NULL, -- lat/lon stored as a PostGIS point, generated via geocoding
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index speeds up proximity / bounding-box queries (e.g. "locations near me")
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations (category);
