import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  label: { type: String, default: "" }
});

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Under Review", "Completed", "Overdue"],
      default: "To Do"
    },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    dueDate: { type: Date, default: null },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    attachments: [attachmentSchema],
    activity: [activitySchema],
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

taskSchema.index({ title: "text", description: "text" });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ assignee: 1 });

export default mongoose.model("Task", taskSchema);
