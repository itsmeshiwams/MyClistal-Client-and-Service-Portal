// backend/sockets/chatSocket.js
import { authSocket } from "../middleware/authSocket.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { getIO } from "../utils/socket.js";

export const initChatSocket = (io) => {
  io.use(authSocket);

  io.on("connection", (socket) => {
    const { id: userId, role } = socket.user;
    socket.join(userId); // ✅ Personal room for direct notifications

    console.log(`🔌 ${role} connected: ${userId}`);

    /**
     * ✅ BONUS: Join specific chat room for real-time updates
     * Called from frontend: socket.emit("chat:join", chatId)
     */
    socket.on("chat:join", async (chatId) => {
      try {
        // Optional: verify that user is a participant of the chat before joining
        const chat = await Chat.findById(chatId).select("participants");
        if (!chat) return;

        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (isParticipant) {
          socket.join(`chat:${chatId}`);
          console.log(`📡 ${userId} joined room chat:${chatId}`);
        } else {
          console.warn(`⚠️ User ${userId} tried to join chat ${chatId} without access`);
        }
      } catch (err) {
        console.error("❌ chat:join error:", err);
      }
    });

    /**
     * Existing message send event (you can keep or remove if replaced by HTTP API)
     */
    socket.on("message:send", async ({ chatId, recipientId, content }) => {
      try {
        if (!content || !content.trim()) return;

        // ✅ Permission checks (example)
        if (role === "Client" && socket.user.id === recipientId) {
          return; // prevent self messaging for client
        }
        if (role === "Client" && recipientId === userId) return;
        // Additional checks can go here

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          recipient: recipientId,
          content: content.trim(),
        });

        // 📡 Emit to recipient and sender
        io.to(recipientId).emit("message:new", message);
        io.to(userId).emit("message:sent", message);

        // 📡 Also broadcast to chat room if joined
        io.to(`chat:${chatId}`).emit("message:new", { chatId, message });
      } catch (err) {
        console.error("Socket send error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${role} disconnected: ${userId}`);
    });
  });
};
