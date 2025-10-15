// backend/models/Message.js
import mongoose from "mongoose";

const DeliveryEnum = ["sent", "delivered", "read"];

const MessageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true },
    // per-recipient status map: { userId: "sent"|"delivered"|"read" }
    statusMap: {
      type: Map,
      of: { type: String, enum: DeliveryEnum },
      default: {},
    },
    // Additional small metadata placeholder (mentions, replyTo, etc)
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

MessageSchema.index({ chat: 1, createdAt: -1 });

export default mongoose.model("Message", MessageSchema);
