// src/utils/updateEventStatuses.js
import Event from "../../models/Event.js";
import { computeEventStatus } from "./computeEventStatus.js";

/**
 * Auto-update the status of all events based on current time.
 * This ensures consistent statuses even if events are not manually refreshed.
 */
export const updateEventStatuses = async () => {
  const now = new Date();

  // Find events that need a status update
  const events = await Event.find({
    $or: [
      { "attendees.status": { $in: ["pending", "accepted", "on-going"] } },
      { end: { $lte: now } },
      { start: { $lte: now, $gte: new Date(now - 1000 * 60 * 60 * 24 * 30) } }, // within 30 days for efficiency
    ],
  });

  for (const ev of events) {
    const status = computeEventStatus(ev.start, ev.end);

    // Update attendee statuses for visibility
    ev.attendees = ev.attendees.map((a) => {
      if (status === "Ongoing" && a.status === "accepted") a.status = "on-going";
      if (status === "Expired") a.status = "expired";
      return a;
    });

    await ev.save();
  }

  console.log(`✅ Event statuses auto-updated at ${now.toISOString()}`);
};
