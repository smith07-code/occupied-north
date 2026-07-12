import React, { useEffect, useState } from 'react';
import { CATEGORIES } from '../categories';

const EMPTY_FORM = { name: '', description: '', category: 'landmark', address: '' };

export default function LocationForm({ editingLocation, onSubmit, onCancelEdit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingLocation) {
      setForm({
        name: editingLocation.name,
        description: editingLocation.description || '',
        category: editingLocation.category,
        address: editingLocation.address,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingLocation]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(form);
      if (!editingLocation) setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="location-form" onSubmit={handleSubmit}>
      <h2>{editingLocation ? 'Edit location' : 'Add a location'}</h2>

      <label>
        Name
        <input value={form.name} onChange={handleChange('name')} required placeholder="e.g. Nine Arch Bridge" />
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={handleChange('description')}
          rows={3}
          placeholder="What makes this place worth visiting?"
        />
      </label>

      <label>
        Category
        <select value={form.category} onChange={handleChange('category')}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
      </label>

      <label>
        Postcode or address
        <input
          value={form.address}
          onChange={handleChange('address')}
          required
          placeholder="e.g. Ella, Uva Province or 20000"
        />
        <span className="field-hint">
          We geocode this automatically via Nominatim (OpenStreetMap) — no need to enter coordinates.
        </span>
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Locating…' : editingLocation ? 'Save changes' : 'Add location'}
        </button>
        {editingLocation && (
          <button type="button" className="secondary" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
