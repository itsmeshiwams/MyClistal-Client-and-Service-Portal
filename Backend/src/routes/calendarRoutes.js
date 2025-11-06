import express from "express";
import {
  createEvent,
  getEventRequests,
  respondToRequest,
  listUserEvents,
  deleteEvent,
  exportEventIcs,
  adminListAllEvents,
  connectProvider,
  disconnectProvider,
  providerWebhook,
  googleAuth,
  googleRedirect,
  syncGoogleCalendar,
  getAllUsers,
} from "../controllers/calendarController.js";

import { protect, isStaff } from "../middleware/authMiddleware.js";
import {
  createEventValidator,
  respondToRequestValidator,
  listEventsValidator,
  connectProviderValidator,
} from "../validators/calendarValidators.js";

import { validationResult } from "express-validator";

const router = express.Router();

// ✅ All calendar routes require authentication
router.use(protect);

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

// ✅ Event creation with new invite logic
router.post("/events", createEventValidator, handleValidation, createEvent);

// ✅ Fetch pending event requests for user
router.get("/requests", getEventRequests);

// ✅ Accept or reject an event request
router.patch("/requests/:eventId", respondToRequestValidator, handleValidation, respondToRequest);

// ✅ List events for the logged-in user
router.get("/events", listEventsValidator, handleValidation, listUserEvents);

// ✅ Export event to ICS
router.get("/events/:id/ics", exportEventIcs);

// ✅ Delete event
router.delete("/events/:id", deleteEvent);

// ✅ List all events (admin/staff only)
router.get("/admin/events", isStaff, adminListAllEvents);

// ✅ Provider connect/disconnect
router.post("/connect", connectProviderValidator, handleValidation, connectProvider);
router.post("/disconnect/:provider", disconnectProvider);

// ✅ Provider webhook
router.post("/webhook/:provider", providerWebhook);

// ✅ Google OAuth endpoints
router.get("/google/auth", googleAuth);
router.get("/google/redirect", googleRedirect);
router.get("/google/sync", syncGoogleCalendar);

// ✅ 🆕 Fetch all users (for event creation dropdown/search)
router.get("/users", getAllUsers);

export default router;
