import { computeEventStatus } from './computeEventStatus.js'; // Ensure correct path and file extension

export const sanitizeEventForClient = (event, userId) => {
  // Normalize to Mongoose document or plain object
  const creatorId = event.createdBy?._id?.toString?.() || event.createdBy?.toString?.();
  const isCreator = creatorId === userId.toString();

  // Find this user's attendee record, if they are not the creator
  const attendee = event.attendees?.find(
    (a) => a.user?._id?.toString?.() === userId.toString()
  );

  // Determine this user's event status
  const userStatus = isCreator
    ? "creator"
    : attendee?.status || "pending";

  // Determine highlight color for UI
  const highlight =
    userStatus === "creator"
      ? "blue"
      : userStatus === "accepted"
      ? "green"
      : userStatus === "pending"
      ? "yellow"
      : userStatus === "declined"
      ? "red"
      : "default";

  // Calculate event status (Upcoming, On-Going, Expired)
  const eventStatus = computeEventStatus(event.start, event.end);

  // Build sanitized attendee list
  const attendees = (event.attendees || []).map((a) => ({
    user: a.user?._id || a.user, // fallback if not populated
    email: a.user?.email || "",
    status: a.status,
    reminder: a.reminder || null,
  }));

  return {
    id: event._id,
    title: event.title,
    description: event.description || "",
    start: event.start,
    end: event.end,
    allDay: event.allDay || false,
    location: event.location || "",
    timezone: event.timezone || "",
    attendees,
    createdBy: event.createdBy
      ? {
          id: event.createdBy._id || event.createdBy,
          email: event.createdBy.email || "",
          role: event.createdBy.role || "",
        }
      : null,
    status: eventStatus, // Include event status
    isCreator,
    userStatus,
    highlight,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
