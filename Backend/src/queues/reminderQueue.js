// src/queues/reminderQueue.js
/**
 * In-memory reminder scheduler (development)
 * scheduleReminder({ eventId, userId, email, notifyAtISO })
 *
 * This will set a setTimeout to fire at notifyAt; not persistent across restarts.
 * Replace with a persistent queue in production.
 */

const jobs = new Map();

export const scheduleReminder = async ({ eventId, userId = null, email, notifyAtISO }) => {
  try {
    const notifyAt = new Date(notifyAtISO);
    const delay = notifyAt.getTime() - Date.now();
    if (delay <= 0) return null; // past

    const key = `${eventId}:${userId || email}`;
    if (jobs.has(key)) {
      clearTimeout(jobs.get(key));
    }
    const t = setTimeout(async () => {
      // perform reminder action: for now console log and call email notifier
      console.log("Reminder fired for", eventId, userId, email);
      // import here to avoid cycles
      const { sendEmailNotification } = await import("../utils/notify.js");
      await sendEmailNotification({
        to: email,
        subject: "Event reminder",
        text: `Reminder: event ${eventId} is upcoming.`,
      }).catch((e) => console.error("Reminder email failed", e));
      jobs.delete(key);
    }, delay);
    jobs.set(key, t);
    return true;
  } catch (err) {
    console.error("scheduleReminder error", err);
    return null;
  }
};

export const cancelReminder = ({ eventId, userId = null, email }) => {
  const key = `${eventId}:${userId || email}`;
  if (jobs.has(key)) {
    clearTimeout(jobs.get(key));
    jobs.delete(key);
    return true;
  }
  return false;
};

export default scheduleReminder;
