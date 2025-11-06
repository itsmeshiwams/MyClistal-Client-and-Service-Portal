import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "declined", "on-going","expired"], default: "pending" },
  reminder: { type: Date },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [attendeeSchema],
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
