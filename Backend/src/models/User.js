import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Client", "Staff"], default: "Client" },
  },
  { timestamps: true }
);
userSchema.index({ email: "text" });

export default mongoose.model("User", userSchema);
