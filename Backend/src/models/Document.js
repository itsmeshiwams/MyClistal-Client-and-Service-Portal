// models/Document.js
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "PDF",
      "Excel",
      "Word",
      "Image",
      "Report",
      "Policy",
      "Invoice",
      "Tax Form",
    ],
    required: true,
  },
  size: { type: String, required: true }, // store as "1.2 MB"
  status: {
    type: String,
    enum: [
      "Approved",
      "Pending Review",
      "Needs Signature",
      "Draft",
      "Completed",
      "Archived",
    ],
    default: "Pending Review",
  },
  fileUrl: { type: String, required: true }, // path to S3/local storage
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedDate: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  complianceRelated: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  dueDate: { type: Date },
});

export default mongoose.model("Document", documentSchema);
