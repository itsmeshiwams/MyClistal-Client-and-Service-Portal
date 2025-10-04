// models/Activity.js
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who performed action
    action: { type: String, required: true }, // e.g., Uploaded, Sent to Client, Reviewed
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    targetClient: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // recipient client
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
