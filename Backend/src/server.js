// backend/server.js
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
import { setIO } from "./utils/socket.js";
import { initChatSocket } from "./sockets/chatSocket.js";

dotenv.config();

// ✅ Connect DB first
connectDB().then(() => {
  // ✅ Create HTTP server using the same Express app
  const server = http.createServer(app);

  // ✅ Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // 🔌 Make io globally accessible
  setIO(io);

  // 🔥 Initialize Chat Socket Events
  initChatSocket(io);

  // ✅ Start Server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

// ✅ Handle unexpected crashes safely
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
  process.exit(1);
});
