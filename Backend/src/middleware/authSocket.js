// backend/middleware/authSocket.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication error"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error("User not found"));

    socket.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    next();
  } catch (err) {
    console.error("❌ Socket Auth Error:", err.message);
    next(new Error("Authentication error"));
  }
};
