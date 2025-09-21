import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["Tax Form", "Invoice", "Policy", "Report", "Other"], required: true },
    fileUrl: { type: String, required: true }, 
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected", "Draft", "Completed"], default: "Pending" },
    category: { type: String, enum: ["Client", "Internal", "Compliance", "Archived"], default: "Client" }
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
