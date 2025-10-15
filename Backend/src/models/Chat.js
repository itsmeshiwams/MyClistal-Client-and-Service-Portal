// backend/models/Chat.js
import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    title: { type: String }, // optional for group chats
    isGroup: { type: Boolean, default: false },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // optional per-user unread count map: { userId: number }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

ChatSchema.index({ title: "text" });
// index to quickly find chats where a user participates
ChatSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model("Chat", ChatSchema);
