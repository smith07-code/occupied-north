-- Sample data. Coordinates below are pre-geocoded so you can seed the DB without
-- calling Nominatim. New rows created via the API will be geocoded automatically.
--   psql -U postgres -d srilanka_locations -f src/db/seed.sql

INSERT INTO locations (name, description, category, address, geom) VALUES
('Sigiriya Rock Fortress', 'Ancient rock fortress and UNESCO World Heritage Site', 'landmark',
  'Sigiriya, Central Province, Sri Lanka', ST_SetSRID(ST_MakePoint(80.7603, 7.9570), 4326)),
('Temple of the Sacred Tooth Relic', 'Buddhist temple housing the relic of the tooth of Buddha', 'disputed_religious_installation',
  'Sri Dalada Veediya, Kandy 20000, Sri Lanka', ST_SetSRID(ST_MakePoint(80.6413, 7.2936), 4326)),
('Galle Fort', 'Historic fortified city built by the Portuguese and Dutch', 'landmark',
  'Galle Fort, Galle 80000, Sri Lanka', ST_SetSRID(ST_MakePoint(80.2170, 6.0269), 4326)),
('Mirissa Beach', 'Popular beach known for whale watching and surfing', 'beach',
  'Mirissa, Southern Province, Sri Lanka', ST_SetSRID(ST_MakePoint(80.4589, 5.9483), 4326)),
('Yala National Park', 'Wildlife reserve famous for leopards and elephants', 'landmark',
  'Yala National Park, Sri Lanka', ST_SetSRID(ST_MakePoint(81.5157, 6.3720), 4326)),
('Cargills Food City - Colombo', 'Supermarket chain outlet in central Colombo', 'other',
  'York Street, Colombo 00100, Sri Lanka', ST_SetSRID(ST_MakePoint(79.8449, 6.9355), 4326)),
('Ministry of Crab', 'Award-winning seafood restaurant in Colombo', 'restaurant',
  'Old Dutch Hospital, Colombo 00100, Sri Lanka', ST_SetSRID(ST_MakePoint(79.8428, 6.9353), 4326)),
('Cinnamon Grand Colombo', 'Five-star hotel in the heart of Colombo', 'hotel',
  '77 Galle Road, Colombo 00300, Sri Lanka', ST_SetSRID(ST_MakePoint(79.8478, 6.9187), 4326));
