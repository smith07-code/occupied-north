import React, { useEffect, useState } from 'react';
import MapView from './components/MapView';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import { listLocations, createLocation, updateLocation, deleteLocation } from './api/locations';

export default function App() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await listLocations();
      setLocations(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, form);
        setEditingLocation(null);
      } else {
        await createLocation(form);
      }
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (loc) => {
    const password = window.prompt(`Enter the delete password to remove "${loc.name}":`);
    if (password === null) return; // user cancelled
    try {
      await deleteLocation(loc.id, password);
    } catch (err) {
      window.alert(err.message);
      return;
    }
    if (editingLocation?.id === loc.id) setEditingLocation(null);
    await refresh();
  };

  return (
    <div className="app-shell">
      <section className="map-section-top">
        <MapView
          locations={locations}
          focusedLocation={focusedLocation}
          onMarkerClick={setFocusedLocation}
        />
      </section>

      <header className="app-header">
        <span className="eyebrow">Occupied North</span>
        <span className="advocacy-tag">Advocacy project</span>
        <h1>Eelam Tamil Territories</h1>
        <p>Occupied by the Sri Lankan armed forces.</p>
      </header>

      <main className="app-main">
        <div className="panel">
          {loading && <p>Loading locations…</p>}
          {loadError && <p className="form-error">{loadError}</p>}
          {!loading && !loadError && (
            <LocationList
              locations={locations}
              onSelect={setFocusedLocation}
              onEdit={setEditingLocation}
              onDelete={handleDelete}
            />
          )}

          <hr />

          <LocationForm
            editingLocation={editingLocation}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingLocation(null)}
            submitting={submitting}
          />
        </div>
      </main>
    </div>
  );
}
