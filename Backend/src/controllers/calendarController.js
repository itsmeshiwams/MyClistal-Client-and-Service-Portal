// src/controllers/calendarController.js
import Event from "../models/Event.js";
import User from "../models/User.js";
import { setIO } from "../utils/socket.js";
import { generateICS } from "../utils/calendar/ics.js";
import { sendEmailNotification } from "../utils/calendar/notify.js";
import { scheduleReminder } from "../queues/reminderQueue.js";
import mongoose from "mongoose";

import {
  getGoogleAuthURL,
  getGoogleTokens,
  addEventToGoogleCalendar,
  refreshAccessToken,
} from "../utils/calendar/googleService.js";
import { sanitizeEventForClient } from "../utils/calendar/sanitizeEventForClient.js";
import { computeEventStatus } from '../utils/calendar/computeEventStatus.js'; 
import { updateEventStatuses } from "../utils/calendar/updateEventStatuses.js";


// import { refreshAccessToken } from "../utils/googleService.js"; // ⬅️ Ensure this helper exists

/**
 * Helper to sanitize event returned to client
 */

let userGoogleTokens = {}; // In production, store in DB

// Step 1: Get Google Auth URL
export const googleAuth = (req, res) => {
  const url = getGoogleAuthURL();
  res.json({ url });
};

// Step 2: Redirect URI handler
// --- inside calendarController.js ---

// ✅ Step 2: Redirect URI handler (persist tokens in DB)
export const googleRedirect = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing authorization code");

    const tokens = await getGoogleTokens(code);
    if (!tokens.access_token)
      return res.status(400).send("Token exchange failed");

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    // 🧠 Persist tokens securely in DB
    user.google = {
      id: user.google?.id || null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || user.google?.refreshToken,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      syncEnabled: true,
    };
    await user.save();

    res.send(
      "✅ Google Calendar connected successfully! You can close this tab."
    );
  } catch (err) {
    console.error("❌ Google Redirect Error:", err.message);
    res.status(500).send("Server error during Google OAuth");
  }
};

// ✅ Step 3: Sync all events to Google Calendar (auto-refresh token)
export const syncGoogleCalendar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.google?.accessToken)
      return res
        .status(401)
        .json({ message: "Please connect your Google account first." });

    let tokens = {
      access_token: user.google.accessToken,
      refresh_token: user.google.refreshToken,
      expiry_date: user.google.tokenExpiry,
    };

    // 🔄 Auto-refresh if expired
    if (tokens.expiry_date && new Date(tokens.expiry_date) < new Date()) {
      console.log("♻️ Access token expired, refreshing...");
      const refreshed = await refreshAccessToken(tokens.refresh_token);

      tokens.access_token = refreshed.access_token;
      tokens.expiry_date = refreshed.expiry_date;

      user.google.accessToken = refreshed.access_token;
      user.google.tokenExpiry = new Date(refreshed.expiry_date);
      await user.save();
    }

    const events = await Event.find({ createdBy: req.user.id });
    const synced = [];

    for (const event of events) {
      const syncedEvent = await addEventToGoogleCalendar(tokens, event);
      synced.push(syncedEvent);
    }

    res.json({ message: "✅ Synced with Google Calendar", synced });
  } catch (err) {
    console.error("❌ Calendar Sync Error:", err);
    res
      .status(500)
      .json({ message: "Server error during sync", error: err.message });
  }
};

/**
 * Create event (send request to attendees)
 */
export const createEvent = async (req, res) => {
  try {
    const creator = req.user;
    const {
      title,
      description,
      start,
      end,
      allDay = false,
      location = "",
      timezone = "UTC",
      inviteUsers = [],
      reminderMinutesBefore = 60,
    } = req.body;

    // Validate required fields
    if (!title || !start || !end) {
      return res
        .status(400)
        .json({ message: "title, start, and end are required" });
    }

    // 🧠 Build attendees array
    const attendees = [
      {
        user: creator._id,
        email: creator.email,
        status: "accepted",
        reminderMinutesBefore,
      },
    ];

    // 🧩 Add invited users with pending status
    const invitedUserDocs = await User.find({
      _id: { $in: inviteUsers },
    }).select("email");

    for (const user of invitedUserDocs) {
      attendees.push({
        user: user._id,
        email: user.email,
        status: "pending",
        reminderMinutesBefore,
      });
    }

    // 🗓️ Create the event (no transaction needed)
    const newEvent = await Event.create({
      title,
      description,
      createdBy: creator._id,
      attendees,
      start,
      end,
      allDay,
      location,
      timezone,
      reminderMinutesBefore,
      status: "pending", // default before computing
    });

    // 🔔 Notify pending attendees (socket + email)
    const io = setIO();
    for (const a of attendees.filter((a) => a.status === "pending")) {
      if (io)
        io.to(a.user.toString()).emit("calendar:event_request", {
          eventId: newEvent._id,
        });

      await sendEmailNotification({
        to: a.email,
        subject: `📅 Event Invitation: ${newEvent.title}`,
        text: `Hello, you’ve been invited by ${creator.email} to join "${newEvent.title}". Check your dashboard to accept or decline.`,
      }).catch(() => {});
    }

    // ⏰ Schedule reminder for creator
    const notifyAt = new Date(
      new Date(start).getTime() - reminderMinutesBefore * 60 * 1000
    );
    if (notifyAt > new Date()) {
      await scheduleReminder({
        eventId: newEvent._id.toString(),
        userId: creator._id.toString(),
        email: creator.email,
        notifyAtISO: notifyAt.toISOString(),
      });
    }

    // ✅ Compute final event status
    newEvent.status = computeEventStatus(newEvent.start, newEvent.end);

    // Return sanitized event
    return res.status(201).json({
      message: "Event created successfully",
      event: sanitizeEventForClient(newEvent, creator._id),
    });
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(500).json({
      message: "Server error creating event",
      error: err.message,
    });
  }
};


/**
 * Get event requests (where current user is attendee with pending status)
 */
export const getEventRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔄 Auto-update event statuses before querying
    await updateEventStatuses();

    const requests = await Event.find({
      "attendees.user": userId,
      "attendees.status": "pending",
    })
      .populate("createdBy", "email role")
      .populate("attendees.user", "email role")
      .sort({ start: 1 });

    // Demo fallback for UI
    if (requests.length === 0) {
      const sampleCreator = await User.findOne({ _id: { $ne: userId } });
      if (sampleCreator) {
        const dummyEvent = await Event.create({
          title: "Team Sync Demo Event",
          description: "Auto-generated demo pending request",
          start: new Date(Date.now() + 3600 * 1000),
          end: new Date(Date.now() + 2 * 3600 * 1000),
          createdBy: sampleCreator._id,
          attendees: [{ user: userId, status: "pending" }],
        });
        requests.push(
          await dummyEvent
            .populate("createdBy", "email role")
            .populate("attendees.user", "email role")
        );
      }
    }

    // Sanitize and enhance
    const sanitizedRequests = requests.map((event) => {
      const e = sanitizeEventForClient(event, userId);
      e.eventStatus = computeEventStatus(event.start, event.end);
      return e;
    });

    return res.status(200).json({
      success: true,
      message: "Pending event requests fetched successfully",
      count: sanitizedRequests.length,
      requests: sanitizedRequests,
    });
  } catch (err) {
    console.error("❌ getEventRequests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



/**
 * Respond to event request (accept|reject)
 */
export const respondToRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    // Refresh statuses before response
    await updateEventStatuses();

    const ev = await Event.findById(eventId)
      .populate("createdBy", "email role")
      .populate("attendees.user", "email role");

    if (!ev) return res.status(404).json({ message: "Event not found" });

    // ❌ Block if event already expired
    const eventStatus = computeEventStatus(ev.start, ev.end);
    if (eventStatus === "Expired") {
      return res.status(403).json({
        message: "Event has expired. You cannot accept or reject this request.",
      });
    }

    const attIndex = ev.attendees.findIndex(
      (a) => a.user && a.user._id.toString() === userId.toString()
    );

    if (attIndex === -1)
      return res.status(403).json({ message: "You're not an attendee" });

    ev.attendees[attIndex].status =
      action === "accept" ? "accepted" : "rejected";
    await ev.save();

    // Notify creator via socket + email
    const io = setIO();
    if (io)
      io.to(ev.createdBy._id.toString()).emit("calendar:request_response", {
        eventId: ev._id,
        action,
        by: req.user._id,
      });

    sendEmailNotification({
      to: ev.createdBy.email || (await User.findById(ev.createdBy)).email,
      subject: `Response to event ${ev.title}`,
      text: `${req.user.email} has ${action}ed the event.`,
    }).catch(console.error);

    const sanitized = sanitizeEventForClient(ev, userId);
    sanitized.eventStatus = computeEventStatus(ev.start, ev.end);

    return res.json({
      success: true,
      message: `Event ${action}ed successfully`,
      event: sanitized,
    });
  } catch (err) {
    console.error("❌ respondToRequest error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * List events for the user with filters
 */


export const listUserEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { filter = "all", from, to } = req.query;
    const now = new Date();

    // 🧠 Auto-refresh statuses before returning events
    await updateEventStatuses();

    const baseQuery = {
      $or: [{ createdBy: userId }, { "attendees.user": userId }],
    };
    const query = { ...baseQuery };

    if (filter === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      query.start = { $lte: endOfDay };
      query.end = { $gte: startOfDay };
    } else if (filter === "upcoming") {
      query.start = { $gte: now };
    } else if (filter === "deadline") {
      const d = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      query.end = { $lte: d, $gte: now };
    } else if (filter === "range" && from && to) {
      query.start = { $gte: new Date(from) };
      query.end = { $lte: new Date(to) };
    }

    const events = await Event.find(query)
      .populate("createdBy", "email role")
      .populate("attendees.user", "email role")
      .sort({ start: 1 });

    const sanitizedEvents = events.map((event) => {
      const e = sanitizeEventForClient(event, userId);
      e.eventStatus = computeEventStatus(event.start, event.end);

      const userAtt = event.attendees.find(
        (a) => a.user && a.user._id.toString() === userId.toString()
      );
      e.userStatus = userAtt ? userAtt.status : "creator";
      e.isCreator = event.createdBy?._id?.toString() === userId.toString();

      e.attendees = event.attendees.map((a) => ({
        id: a.user?._id,
        email: a.user?.email,
        status: a.status,
        reminder: a.reminder,
      }));

      e.createdBy = {
        id: event.createdBy?._id,
        email: event.createdBy?.email,
        role: event.createdBy?.role,
      };

      e.highlight =
        e.userStatus === "pending"
          ? "yellow"
          : e.userStatus === "accepted"
          ? "green"
          : e.userStatus === "on-going"
          ? "blue"
          : e.userStatus === "expired"
          ? "gray"
          : "default";

      return e;
    });

    return res.json({
      success: true,
      count: sanitizedEvents.length,
      events: sanitizedEvents,
    });
  } catch (err) {
    console.error("❌ listUserEvents error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Delete event (only creator or staff)
 */
export const deleteEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    if (
      ev.createdBy.toString() !== userId.toString() &&
      req.user.role !== "Staff"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await ev.remove();
    const io = setIO();
    if (io) {
      ev.attendees.forEach((a) => {
        if (a.user)
          io.to(a.user.toString()).emit("calendar:event_deleted", {
            eventId: ev._id,
          });
      });
    }
    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Export event as ICS
 */
export const exportEventIcs = async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id).populate(
      "createdBy",
      "email"
    );
    if (!ev) return res.status(404).json({ message: "Event not found" });

    const ics = generateICS(ev);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=event-${ev._id}.ics`
    );
    res.setHeader("Content-Type", "text/calendar");
    return res.send(ics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Admin: list all events (staff only)
 */
export const adminListAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "email role")
      .sort({ start: -1 });
    return res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Connect provider OAuth tokens (Google / Outlook)
 * This expects tokens from your OAuth flow to be sent here (server-side saving).
 */
export const connectProvider = async (req, res) => {
  try {
    const user = req.user;
    const {
      provider,
      accessToken,
      refreshToken,
      remoteId,
      syncEnabled = true,
      tokenExpiry,
    } = req.body;
    if (!["google", "outlook"].includes(provider))
      return res.status(400).json({ message: "Invalid provider" });

    if (provider === "google") {
      user.google = user.google || {};
      user.google.id = remoteId || user.google.id;
      user.google.accessToken = accessToken;
      user.google.refreshToken = refreshToken;
      user.google.syncEnabled = !!syncEnabled;
    } else {
      user.outlook = user.outlook || {};
      user.outlook.accessToken = accessToken;
      user.outlook.refreshToken = refreshToken;
      user.outlook.syncEnabled = !!syncEnabled;
    }

    await user.save();
    return res.json({ message: `${provider} connected` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Disconnect provider
 */
export const disconnectProvider = async (req, res) => {
  try {
    const user = req.user;
    const { provider } = req.params;
    if (!["google", "outlook"].includes(provider))
      return res.status(400).json({ message: "Invalid provider" });

    if (provider === "google") {
      user.google = {
        id: null,
        accessToken: null,
        refreshToken: null,
        syncEnabled: false,
      };
    } else {
      user.outlook = {
        accessToken: null,
        refreshToken: null,
        syncEnabled: false,
      };
    }
    await user.save();
    return res.json({ message: `${provider} disconnected` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Webhook endpoint placeholder for remote calendar events (Google/Outlook)
 * You'll need to validate and map provider webhooks to Event model changes.
 */
export const providerWebhook = async (req, res) => {
  try {
    // NOTE: For production you must validate the webhook signature and event type.
    // This is a placeholder to accept notifications from external calendars.
    // Implement mapping logic: create/update/delete Event documents based on provider payload.
    console.log("Received provider webhook:", req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const search = req.query.search?.trim() || "";

    const query = {
      _id: { $ne: currentUserId }, // exclude self
    };

    if (search) {
      query.$or = [{ email: { $regex: search, $options: "i" } }];
    }

    const users = await User.find(query).select("_id email role").limit(50);

    res.json({
      users: users.map((u) => ({
        id: u._id,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};
