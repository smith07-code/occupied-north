import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCategoryMeta } from '../categories';

// Default Leaflet marker icons reference image paths that break under most
// bundlers; rebuild them explicitly from the installed package assets.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Build a small emoji-in-a-circle marker per category so pins are
// distinguishable at a glance without needing the popup.
function categoryIcon(category) {
  const meta = getCategoryMeta(category);
  return L.divIcon({
    className: 'category-marker',
    html: `<span class="category-marker-inner">${meta.icon}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;
// Bounding box covering the whole island (SW corner, NE corner), used to fit
// the map to all of Sri Lanka on load regardless of screen size.
const SRI_LANKA_BOUNDS = [
  [5.85, 79.65],
  [9.85, 81.9],
];

function FlyToLocation({ location }) {
  const map = useMap();
  React.useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], 13, { duration: 0.75 });
    }
  }, [location, map]);
  return null;
}

function FitToCountry() {
  const map = useMap();
  React.useEffect(() => {
    map.fitBounds(SRI_LANKA_BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
}

export default function MapView({ locations, focusedLocation, onMarkerClick }) {
  return (
    <MapContainer
      center={SRI_LANKA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-container"
      scrollWheelZoom
    >
      {/* OpenStreetMap tiles - free, no API key required */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!focusedLocation && <FitToCountry />}
      {focusedLocation && <FlyToLocation location={focusedLocation} />}
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={categoryIcon(loc.category)}
          eventHandlers={{ click: () => onMarkerClick?.(loc) }}
        >
          <Popup>
            <strong>{getCategoryMeta(loc.category).icon} {loc.name}</strong>
            <br />
            <span className="popup-category">{getCategoryMeta(loc.category).label}</span>
            {loc.description && <p>{loc.description}</p>}
            <p className="popup-address">{loc.address}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
