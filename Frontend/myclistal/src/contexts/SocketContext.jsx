// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider
 * - connects using token (backend authSocket expects token either in handshake.auth.token or Authorization header)
 * - passes socket instance via context
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth(); // user should be { token, role, email }
  const socketRef = useRef(null);

  useEffect(() => {
    // don't connect if no user
    if (!user?.token) return;

    const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // create socket with auth token so backend's authSocket can validate
    const socket = io(backend, {
      auth: {
        token: user.token, // backend's authSocket expects socket.handshake.auth?.token
      },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // console.info("Socket connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.token]);

  return <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>;
};
