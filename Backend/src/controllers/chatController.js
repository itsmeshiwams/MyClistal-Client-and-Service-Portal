// backend/controllers/chatController.js
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getIO } from "../utils/socket.js";

/**
 * 📌 Get all chats for the current user
 */
/**
 * 📌 Get paginated chats for the current user
 * Supports: /getchats?page=1&limit=20
 */
export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Count total chats for this user
    const totalChats = await Chat.countDocuments({ participants: userId });

    // Fetch chats with pagination
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "email role")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "email role" },
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const hasMore = totalChats > page * limit;

    res.json({
      data: chats,
      total: totalChats,
      hasMore,
    });
  } catch (err) {
    console.error("❌ getChats error:", err);
    res.status(500).json({ message: "Failed to get chats" });
  }
};

/**
 * 📌 Create or return a private chat
 */

export const getOrCreatePrivateChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const requester = req.user;

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required" });
    }

    // 📝 Self Chat (Personal Chat)
    if (targetUserId === requester._id.toString()) {
      let selfChat = await Chat.findOne({
        isGroup: false,
        participants: [requester._id], // self chat has only 1 participant
      })
        .populate("participants", "email role")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "email role" },
        });

      if (selfChat) {
        return res.json({
          chat: selfChat,
          created: false,
          message: "Existing self chat found",
        });
      }

      // Create new self chat
      selfChat = await Chat.create({
        participants: [requester._id],
        isGroup: false,
        isSelfChat: true, // 👈 optional flag for clarity
      });

      await selfChat.populate("participants", "email role");

      return res.status(201).json({
        chat: selfChat,
        created: true,
        message: "New self chat created",
      });
    }

    // 🧍 Regular Chat Between Two Different Users
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // 🔒 Role-based rule enforcement
    if (requester.role === "Client" && targetUser.role === "Client") {
      return res.status(403).json({
        message: "Clients cannot initiate chats with other clients",
      });
    }

    // ✅ Check if chat already exists between exactly these 2 users
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [requester._id, targetUserId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    })
      .populate("participants", "email role")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "email role" },
      });

    if (chat) {
      return res.json({
        chat,
        created: false,
        message: "Existing private chat found",
      });
    }

    // ✨ Create a new private chat if not found
    const newChat = await Chat.create({
      participants: [requester._id, targetUserId],
      isGroup: false,
    });

    await newChat.populate("participants", "email role");

    return res.status(201).json({
      chat: newChat,
      created: true,
      message: "New private chat created",
    });
  } catch (err) {
    console.error("❌ getOrCreatePrivateChat error:", err);
    res.status(500).json({ message: "Failed to create or fetch private chat" });
  }
};

/**
 * 📜 Get messages in a chat (Cursor-based pagination for infinite scroll)
 * Frontend usage: GET /chat/:id/getmessages?before=<lastMessageId>&limit=20
 */
export const getMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id.toString();
    const limit = parseInt(req.query.limit) || 20;
    const before = req.query.before; // optional messageId for cursor-based pagination

    // ✅ Verify chat participation
    const chat = await Chat.findById(chatId).select("participants");
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant)
      return res
        .status(403)
        .json({ message: "Access denied: Not a participant of this chat" });

    // ✅ Pagination logic
    const query = { chat: chatId };
    if (before) {
      const beforeMsg = await Message.findById(before).select("_id createdAt");
      if (beforeMsg) query.createdAt = { $lt: beforeMsg.createdAt };
    }

    // ✅ Fetch messages, oldest → newest
    const messages = await Message.find(query)
      .populate("sender", "_id email role")
      .sort({ createdAt: -1 })
      .limit(limit + 1); // fetch one extra to check hasMore

    const hasMore = messages.length > limit;
    const sliced = hasMore ? messages.slice(0, limit) : messages;

    res.json({
      messages: sliced.reverse(), // return in chronological order
      hasMore,
      nextCursor: hasMore ? sliced[0]._id : null, // send cursor for next fetch
    });
  } catch (err) {
    console.error("❌ getMessages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};


/**
 * 📌 Send message with strict participant, role & recipient checks
 */
export const sendMessage = async (req, res) => {
  try {
    const chatId = req.params.id;
    const senderId = req.user._id.toString();
    const { content, recipientId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // ✅ 1. Load chat & validate
    const chat = await Chat.findById(chatId).populate(
      "participants",
      "_id role email"
    );
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const participantIds = chat.participants.map((p) => p._id.toString());

    // ✅ 2. Sender must be in the chat
    if (!participantIds.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "Access denied: Not a participant of this chat" });
    }

    // ✅ 3. Determine if this is a self chat
    const isSelfChat =
      chat.participants.length === 1 && participantIds[0] === senderId;

    // ✅ 4. Validate recipientId rules
    if (!isSelfChat) {
      // Private chat → must have recipientId and it must be a valid participant
      if (!recipientId) {
        return res
          .status(400)
          .json({ message: "recipientId is required for private chats" });
      }
      if (!participantIds.includes(recipientId)) {
        return res
          .status(400)
          .json({ message: "Recipient is not part of this chat" });
      }
    } else {
      // Self chat → recipientId is optional but if provided must match sender
      if (recipientId && recipientId !== senderId) {
        return res.status(400).json({
          message:
            "For self chats, recipientId must match sender or be omitted",
        });
      }
    }

    // ✅ 5. Role logic: Clients cannot message other clients (except self)
    if (req.user.role === "Client" && !isSelfChat) {
      const hasOtherClient = chat.participants.some(
        (p) => p._id.toString() !== senderId && p.role === "Client"
      );
      if (hasOtherClient) {
        return res
          .status(403)
          .json({ message: "Clients cannot send messages to other clients" });
      }
    }

    // 💬 6. Create the message
    const message = await Message.create({
      chat: chatId,
      sender: senderId,
      text: content.trim(),
    });
    await message.populate("sender", "email role");

    // 📌 7. Update chat's lastMessage & unread counts
    const incOps = {};
    chat.participants.forEach((p) => {
      const pid = p._id.toString();
      if (pid !== senderId) {
        incOps[`unreadCounts.${pid}`] = 1;
      }
    });

    const updateOps = {
      $set: { lastMessage: message._id, updatedAt: new Date() },
      ...(Object.keys(incOps).length && { $inc: incOps }),
    };

    await Chat.findByIdAndUpdate(chatId, updateOps);

    // 📡 8. Emit to chat room
    const io = getIO();
    io.to(`chat:${chatId}`).emit("message:new", { chatId, message });

    res.status(201).json({ message });
  } catch (err) {
    console.error("❌ sendMessage error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

/**
 * 📌 Mark messages as read
 * Only participants can mark messages as read.
 */
// backend/controllers/chatController.js
export const markMessagesRead = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id.toString();

    const chat = await Chat.findById(chatId).select(
      "participants unreadCounts"
    );
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant)
      return res
        .status(403)
        .json({ message: "Access denied: Not a participant of this chat" });

    // ✅ Mark messages as read for this user
    const setObj = {};
    setObj[`statusMap.${userId}`] = "read";
    await Message.updateMany({ chat: chatId }, { $set: setObj });

    // ✅ Reset unread count for this user
    await Chat.findByIdAndUpdate(chatId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    });

    const io = getIO();
    io.to(`chat:${chatId}`).emit("chat:read", { chatId, userId });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ markMessagesRead error:", err);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

export const searchChats = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id.toString();

    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query (q) is required" });
    }

    const searchRegex = new RegExp(q.trim(), "i"); // ✅ case-insensitive partial match

    // Step 1: Find users whose emails partially match the query
    const matchedUsers = await User.find({ email: searchRegex }).select(
      "_id email"
    );
    const matchedUserIds = matchedUsers.map((u) => u._id.toString());

    const orFilters = [];

    // ✅ A. Fuzzy title match (requester must be participant)
    orFilters.push({
      $and: [{ participants: userId }, { title: { $regex: searchRegex } }],
    });

    // ✅ B. Fuzzy email match — both requester and matched user must be participants
    matchedUserIds.forEach((targetUserId) => {
      orFilters.push({
        $and: [{ participants: userId }, { participants: targetUserId }],
      });
    });

    if (orFilters.length === 0) {
      return res.json([]);
    }

    const chats = await Chat.find({ $or: orFilters })
      .populate("participants", "email role")
      .populate("lastMessage")
      .sort({ updatedAt: -1 }); // Optional: sort by activity

    res.json(chats);
  } catch (err) {
    console.error("❌ searchChats error:", err);
    res.status(500).json({ message: "Failed to search chats" });
  }
};

/**
 * 🔍 Search users by email
 * - Clients can search self + staff
 * - Staff can search anyone
 */
export const searchUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    const requester = req.user;

    const baseFilter = { email: { $regex: q, $options: "i" } };

    let filter = {};
    if (requester.role === "Client") {
      filter = {
        $and: [
          baseFilter,
          { $or: [{ role: "Staff" }, { _id: requester._id }] },
        ],
      };
    } else if (requester.role === "Staff") {
      filter = baseFilter;
    }

    const users = await User.find(filter).select("_id email role").limit(20);
    res.json(users);
  } catch (err) {
    console.error("❌ searchUsers error:", err);
    res.status(500).json({ message: "Failed to search users" });
  }
};
