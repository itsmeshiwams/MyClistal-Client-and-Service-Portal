// backend/middleware/authSocket.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware for authenticating Socket.IO connections using JWT
 * Supports both `auth.token` and `Authorization` header
 */
export const authSocket = async (socket, next) => {
  try {
    // ✅ Get token from handshake (supports both modern and fallback)
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      console.warn("⚠️ Socket connection missing auth token");
      return next(new Error("Authentication error: Token missing"));
    }

    // ✅ Verify and decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id email role");

    if (!user) {
      console.warn("⚠️ Socket auth failed: user not found");
      return next(new Error("Authentication error: User not found"));
    }

    // ✅ Attach verified user to socket instance
    socket.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    console.log(`✅ Socket authenticated: ${user.email}`);
    next();
  } catch (err) {
    console.error("❌ Socket Auth Error:", err.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
};
