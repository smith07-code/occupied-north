const fetch = require('node-fetch');
require('dotenv').config();

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'srilanka-locations-app/1.0';
const COUNTRY_CODES = process.env.NOMINATIM_COUNTRY_CODES || 'lk';

/**
 * Geocode a free-text postcode/address into { latitude, longitude, displayName }
 * using the Nominatim (OpenStreetMap) search API.
 *
 * Throws a GeocodeError if nothing is found or the service fails, so the
 * calling route can return a clean 4xx/5xx response instead of saving bad data.
 */
class GeocodeError extends Error {
  constructor(message, status = 422) {
    super(message);
    this.name = 'GeocodeError';
    this.status = status;
  }
}

async function geocodeAddress(query) {
  if (!query || !query.trim()) {
    throw new GeocodeError('Address/postcode is required for geocoding');
  }

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: COUNTRY_CODES,
    addressdetails: '0',
  });

  const url = `${NOMINATIM_URL}/search?${params.toString()}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires a real, identifying User-Agent
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en',
      },
    });
  } catch (err) {
    throw new GeocodeError(`Could not reach geocoding service: ${err.message}`, 502);
  }

  if (!response.ok) {
    throw new GeocodeError(`Geocoding service returned status ${response.status}`, 502);
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new GeocodeError(`No location found for "${query}". Try a more specific address or postcode.`);
  }

  const best = results[0];
  const latitude = parseFloat(best.lat);
  const longitude = parseFloat(best.lon);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new GeocodeError('Geocoding service returned an invalid coordinate');
  }

  return {
    latitude,
    longitude,
    displayName: best.display_name,
  };
}

module.exports = { geocodeAddress, GeocodeError };
