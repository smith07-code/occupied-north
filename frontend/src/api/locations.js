import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_BASE });

// Every call returns parsed JSON or throws an Error with a readable message,
// so components can just catch(err) and show err.message.
function unwrap(promise) {
  return promise.then((res) => res.data).catch((err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.errors?.join(', ') ||
      err.message;
    throw new Error(message);
  });
}

export const listLocations = (category) =>
  unwrap(client.get('/locations', { params: category ? { category } : {} }));

export const getLocation = (id) => unwrap(client.get(`/locations/${id}`));

export const createLocation = (payload) => unwrap(client.post('/locations', payload));

export const updateLocation = (id, payload) => unwrap(client.put(`/locations/${id}`, payload));

export const deleteLocation = (id, password) =>
  unwrap(client.delete(`/locations/${id}`, { headers: { 'X-Delete-Password': password } }));
