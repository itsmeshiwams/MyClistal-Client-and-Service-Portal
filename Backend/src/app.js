// app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Serve /uploads folder publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);

app.use("/document", documentRoutes);

app.use("/chat", chatRoutes);

export default app;
