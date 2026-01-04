// backend/sockets/chatSocket.js
import { authSocket } from "../middleware/authSocket.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export const initChatSocket = (io) => {
  io.use(authSocket);

  io.on("connection", (socket) => {
    const { id: userId, role, email } = socket.user;
    socket.join(userId); // 🔒 private user room
    console.log(`✅ ${role} connected: ${email} (${userId})`);

    /**
     * 🟢 Auto join all chat rooms for staff
     */
    if (role === "Staff") {
      Chat.find({ participants: userId })
        .select("_id")
        .then((chats) => {
          chats.forEach((c) => socket.join(`chat:${c._id}`));
          console.log(`🟦 Staff ${email} auto-joined ${chats.length} rooms`);
        })
        .catch((err) => console.error("Auto change failed please try again please", err.message));
    }

    /**
     * ✳️ Manual join (for Clients)
     */
    socket.on("chat:join", async (chatId) => {
      try {
        const chat = await Chat.findById(chatId).select("participants");
        if (!chat) return;

        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (isParticipant) {
          socket.join(`chat:${chatId}`);
          console.log(`📡 ${email} joined room chat:${chatId}`);
        }
      } catch (err) {
        console.error("❌ chat:join error:", err.message);
      }
    });

    /**
     * 💬 message:new — Broadcast instantly
     * Fired by backend controller via HTTP or client via socket
     */
    socket.on("message:new", async ({ chatId, content }) => {
      try {
        if (!chatId || !content?.trim()) return;
        const chat = await Chat.findById(chatId).populate(
          "participants",
          "_id email role"
        );
        if (!chat) return;

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          text: content.trim(),
        });
        await message.populate("sender", "email role");

        chat.lastMessage = message._id;
        await chat.save();

        io.to(`chat:${chatId}`).emit("message:new", { chatId, message });
      } catch (err) {
        console.error("❌ message:new error:", err);
      }
    });

    /**
     * 👁️ chat:read — live read receipts
     */
    socket.on("chat:read", async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId).select("participants");
        if (!chat) return;

        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) return;

        await Message.updateMany(
          { chat: chatId },
          { $set: { [`statusMap.${userId}`]: "read" } }
        );

        io.to(`chat:${chatId}`).emit("chat:read", { chatId, userId });
      } catch (err) {
        console.error("❌ chat:read error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 ${email} (${role}) disconnected`);
    });
  });
};
