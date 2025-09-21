import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g., Uploaded, Reviewed, Downloaded
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
