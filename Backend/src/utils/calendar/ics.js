// src/utils/ics.js (adjusted)
export const formatDateForICS = (d) => {
  const dt = new Date(d);
  return dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

export const generateICS = (event) => {
  const start = formatDateForICS(event.startDate || event.start);
  const end = formatDateForICS(event.endDate || event.end);
  const uid = `event-${event._id}@yourapp.local`;
  const organizer = event.createdBy?.email || "no-reply@yourapp.local";
  const attendees = (event.attendees || [])
    .map((a) => {
      const email = a.email || a; // if populated use a.email, else a is string
      return `ATTENDEE;CN=${email}:MAILTO:${email}`;
    })
    .join("\r\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//yourapp//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SUMMARY:${(event.title || "").replace(/\n/g, "\\n")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `DTSTAMP:${formatDateForICS(event.createdAt || new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `ORGANIZER:MAILTO:${organizer}`,
    attendees,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.filter(Boolean).join("\r\n");
};
