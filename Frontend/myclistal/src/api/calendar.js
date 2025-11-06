// src/api/calendar.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/calendar",
});

// ✅ Include token in requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ List events for current user
export const getEvents = () => API.get("/events");

// ✅ Create new event
export const createEvent = (data) => API.post("/events", data);

// ✅ Delete event
export const deleteEvent = (id) => API.delete(`/events/${id}`);

// ✅ Respond to event request (accept/reject)
export const respondToRequest = (eventId, action) =>
  API.patch(`/requests/${eventId}`, { action });

// ✅ Sync with Google Calendar
export const syncGoogleCalendar = () => API.get("/google/sync");

// Get pending event requests
export const getEventRequests = () => API.get("/requests");

export const getAllUsers = () => API.get("/users");

// Respond to a request (accept/reject)
export const respondToEventRequest = (eventId, action) =>
  API.patch(`/requests/${eventId}`, { action }); // matches backend
