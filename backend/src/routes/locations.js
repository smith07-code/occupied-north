const express = require('express');
const pool = require('../db');
const { geocodeAddress, GeocodeError } = require('../services/geocoding');

const router = express.Router();

const ALLOWED_CATEGORIES = [
  'landmark',
  'restaurant',
  'hotel',
  'beach',
  'disputed_religious_installation',
  'military_presence',
  'other',
];

// Shape returned to the frontend for every row (keeps SQL/PostGIS details internal)
function toLocationDTO(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateBody(body, { requireAddress = true } = {}) {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push('name is required');
  if (requireAddress && (!body.address || !body.address.trim())) {
    errors.push('address (postcode or full address) is required');
  }
  if (body.category && !ALLOWED_CATEGORIES.includes(body.category)) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }
  return errors;
}

// GET /api/locations - list all locations (optionally filter by category)
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const params = [];
    let query = `
      SELECT id, name, description, category, address,
             ST_Y(geom::geometry) AS latitude,
             ST_X(geom::geometry) AS longitude,
             created_at, updated_at
      FROM locations
    `;
    if (category) {
      params.push(category);
      query += ' WHERE category = $1';
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows.map(toLocationDTO));
  } catch (err) {
    next(err);
  }
});

// GET /api/locations/:id - single location
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, category, address,
              ST_Y(geom::geometry) AS latitude,
              ST_X(geom::geometry) AS longitude,
              created_at, updated_at
       FROM locations WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Location not found' });
    res.json(toLocationDTO(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/locations - geocode address, then create location
router.post('/', async (req, res, next) => {
  try {
    const { name, description = '', category = 'other', address } = req.body;
    const errors = validateBody({ name, address, category });
    if (errors.length) return res.status(400).json({ errors });

    const geo = await geocodeAddress(address);

    const { rows } = await pool.query(
      `INSERT INTO locations (name, description, category, address, geom)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
       RETURNING id, name, description, category, address,
                 ST_Y(geom::geometry) AS latitude,
                 ST_X(geom::geometry) AS longitude,
                 created_at, updated_at`,
      [name.trim(), description, category, address.trim(), geo.longitude, geo.latitude]
    );

    res.status(201).json(toLocationDTO(rows[0]));
  } catch (err) {
    if (err instanceof GeocodeError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// PUT /api/locations/:id - update a location; re-geocodes only if address changed
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, category, address } = req.body;
    const errors = validateBody({ name, address, category }, { requireAddress: false });
    if (errors.length) return res.status(400).json({ errors });

    const existing = await pool.query('SELECT address FROM locations WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Location not found' });

    let longitude;
    let latitude;
    let finalAddress = existing.rows[0].address;

    if (address && address.trim() && address.trim() !== existing.rows[0].address) {
      const geo = await geocodeAddress(address);
      longitude = geo.longitude;
      latitude = geo.latitude;
      finalAddress = address.trim();
    }

    const { rows } = await pool.query(
      `UPDATE locations SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         address = $4,
         geom = CASE WHEN $5::double precision IS NOT NULL
                     THEN ST_SetSRID(ST_MakePoint($5, $6), 4326)
                     ELSE geom END,
         updated_at = now()
       WHERE id = $7
       RETURNING id, name, description, category, address,
                 ST_Y(geom::geometry) AS latitude,
                 ST_X(geom::geometry) AS longitude,
                 created_at, updated_at`,
      [name, description, category, finalAddress, longitude ?? null, latitude ?? null, req.params.id]
    );

    res.json(toLocationDTO(rows[0]));
  } catch (err) {
    if (err instanceof GeocodeError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// DELETE /api/locations/:id - requires the delete password in the X-Delete-Password header
router.delete('/:id', async (req, res, next) => {
  try {
    const suppliedPassword = req.get('X-Delete-Password');
    const requiredPassword = process.env.DELETE_PASSWORD;

    if (requiredPassword && suppliedPassword !== requiredPassword) {
      return res.status(403).json({ error: 'Incorrect or missing delete password' });
    }

    const { rowCount } = await pool.query('DELETE FROM locations WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Location not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
