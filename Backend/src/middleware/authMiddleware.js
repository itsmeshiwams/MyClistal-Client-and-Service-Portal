import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    token = token.split(" ")[1]; // Bearer <token>
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
};

export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export const isStaff = (req, res, next) => {
  if (req.user && req.user.role === "Staff") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Staff only." });
  }
};
export const isClient = (req, res, next) => {
  if (req.user && req.user.role === "Client") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Client only." });
  }
};
