// backend/server.js
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
import { setIO } from "./utils/socket.js";
import { initChatSocket } from "./sockets/chatSocket.js";
import { initCalendarSocket } from "./sockets/calendarSocket.js";
import { initTaskSocket } from "./sockets/taskSocket.js";
import { authSocket } from "./middleware/authSocket.js";
import cron from "node-cron";


dotenv.config();

// ✅ Initialize server inside DB connection to avoid race conditions
connectDB()
  .then(() => {
    const server = http.createServer(app);

    // ✅ Configure Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST","PUT", "PATCH","DELETE"],
        credentials: true,
      },
    });

    // ✅ Use JWT socket authentication
    io.use(authSocket);

    // ✅ Make io globally accessible
    setIO(io);

    // ✅ Initialize socket modules
    initChatSocket(io);
    initCalendarSocket(io);
    initTaskSocket(io);


    // ✅ Start server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    io.on("connection_error", (err) => {
      console.error("⚡ Socket Connection Error:", err.message);
    });

    cron.schedule("0 * * * *", async () => {
      console.log("🕒 Running hourly event status updater...");
      await updateEventStatuses();
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  });

// ✅ Catch fatal async rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
  process.exit(1);
});
