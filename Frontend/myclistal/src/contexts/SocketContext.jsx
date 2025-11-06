import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth(); // expected: { _id, token, role, email }
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.token) return;

    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

    // ✅ Initialize socket connection with improved options
    const s = io(backendURL, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    // ✅ On connect
    s.on("connect", () => {
      setIsConnected(true);
      if (import.meta.env.DEV)
        console.log("✅ Socket connected:", s.id);

      // Join user and role-based rooms
      if (user?._id) s.emit("join", { room: `user:${user._id}` });
      if (user?.role === "Staff") s.emit("join", { room: "staff-room" });
    });

    // ✅ On disconnect
    s.on("disconnect", (reason) => {
      setIsConnected(false);
      console.warn("❌ Socket disconnected:", reason);
    });

    // ✅ On reconnection attempt
    s.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Socket reconnection attempt ${attempt}`);
    });

    // ✅ Connection error
    s.on("connect_error", (err) => {
      console.error("⚠️ Socket connection error:", err.message);
    });

    // ✅ Optional event logging
    // s.onAny((event, payload) => console.log("📡 Socket Event:", event, payload));

    setSocket(s);

    // ✅ Cleanup
    return () => {
      console.log("🧹 Cleaning up socket...");
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.token, user?._id, user?.role]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
      {isConnected ? (
        <div className="fixed bottom-2 right-4 bg-blue-800 text-white text-xs px-3 py-1 rounded-full shadow">
          🟢 Connected
        </div>
      ) : (
        <div className="fixed bottom-2 right-4 bg-gray-400 text-white text-xs px-3 py-1 rounded-full shadow">
          🔴 Disconnected
        </div>
      )}
    </SocketContext.Provider>
  );
};
