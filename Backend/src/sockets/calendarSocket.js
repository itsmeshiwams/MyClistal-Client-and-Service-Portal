// src/sockets/calendarSocket.js
import { getIO } from "../utils/socket.js";

export const initCalendarSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("📅 Calendar Socket connected:", socket.id);

    // Optional join logic
    socket.on("join", ({ room }) => {
      socket.join(room);
      console.log(`👥 Socket ${socket.id} joined room: ${room}`);
    });

    // 🟢 Event created
    socket.on("calendar:eventCreated", (eventData) => {
      console.log("📨 Broadcasting new event:", eventData.title);
      socket.broadcast.emit("calendar:eventCreated", eventData);
    });

    // 🔴 Event deleted
    socket.on("calendar:eventDeleted", (eventId) => {
      console.log("❌ Broadcasting deleted event:", eventId);
      socket.broadcast.emit("calendar:eventDeleted", eventId);
    });

    // 🟡 Event updated
    socket.on("calendar:eventUpdated", (updatedEvent) => {
      console.log("♻️ Broadcasting updated event:", updatedEvent.id);
      socket.broadcast.emit("calendar:eventUpdated", updatedEvent);
    });

    // 🟠 Event request responded (accept/reject)
    socket.on("calendar:eventRequestHandled", (payload) => {
      console.log("📬 Event request handled:", payload);
      socket.broadcast.emit("calendar:eventRequestHandled", payload);
    });

    socket.on("disconnect", () => {
      console.log("📴 Calendar Socket disconnected:", socket.id);
    });
  });
};

// ✅ Helper for backend routes to trigger socket emits manually
export const emitCalendarUpdate = (type, payload) => {
  const io = getIO();
  io.emit(`calendar:${type}`, payload);
};
