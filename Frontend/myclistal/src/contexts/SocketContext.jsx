// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth(); // expected: { _id, token, role, email }
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.token) return;

    const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const s = io(backend, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);

      // Join personal room for this user (supports multi-tab)
      if (user?._id) s.emit("join", { room: `user:${user._id}` });

      // Join staff broadcast room if Staff
      if (user?.role === "Staff") s.emit("join", { room: "staff-room" });
    });

    s.on("disconnect", () => console.log("❌ Socket disconnected"));

    s.on("connect_error", (err) =>
      console.error("⚠️ Socket connect_error:", err.message)
    );

    // Optional: Debug all incoming events
    // s.onAny((event, payload) => console.log("Socket event:", event, payload));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.token, user?._id, user?.role]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
