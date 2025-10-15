// backend/models/Presence.js
import mongoose from "mongoose";

const PresenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Presence", PresenceSchema);
