import express from "express";
import {
  getChats,
  getMessages,
  sendMessage,
  markMessagesRead,
  getOrCreatePrivateChat,
  searchChats,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 All chat routes require authentication
router.use(protect);

// List all chats for logged-in user
router.get("/getchats", getChats);

// Get or create private chat
router.post("/privatemsg", getOrCreatePrivateChat);

// 📨 Chat messages endpoints
router.get("/:id/getmessages", getMessages);
router.post("/:id/sendmessages", sendMessage);
router.post("/:id/mark-read", markMessagesRead);

// Presence
router.get("/search", protect, searchChats);

export default router;
