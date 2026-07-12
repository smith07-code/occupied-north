import React from 'react';
import { getCategoryMeta } from '../categories';

export default function LocationList({ locations, onSelect, onEdit, onDelete }) {
  if (locations.length === 0) {
    return <p className="empty-state">No locations yet. Add your first one on the left.</p>;
  }

  return (
    <ul className="location-list">
      {locations.map((loc) => {
        const meta = getCategoryMeta(loc.category);
        return (
        <li key={loc.id} className="location-card" onClick={() => onSelect(loc)}>
          <div className="location-card-header">
            <span className="location-name">{meta.icon} {loc.name}</span>
            <span className={`badge badge-${loc.category}`}>{meta.label}</span>
          </div>
          {loc.description && <p className="location-description">{loc.description}</p>}
          <p className="location-address">{loc.address}</p>
          <p className="location-coords">
            {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
          </p>
          <div className="location-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEdit(loc)}>Edit</button>
            <button className="danger" onClick={() => onDelete(loc)}>Delete</button>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
