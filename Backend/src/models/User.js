// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Client", "Staff"], default: "Client" },

    providers: {
      google: {
        id: { type: String, default: null }, // same as remoteId (you can keep whichever)
        accessToken: { type: String, default: null },
        refreshToken: { type: String, default: null },
        tokenExpiry: { type: Date, default: null },
        syncEnabled: { type: Boolean, default: false },
        scope: [{ type: String }],
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: "text" });

export default mongoose.model("User", userSchema);
