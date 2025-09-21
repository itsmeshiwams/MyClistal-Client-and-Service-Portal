import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadDocument, getMyDocuments, getAllDocuments, reviewDocument, getRecentActivity } from "../controllers/documentController.js";

const router = express.Router();

// Client
router.post("/upload", protect, uploadDocument);
router.get("/my", protect, getMyDocuments);

// Staff
router.get("/all", protect, getAllDocuments);
router.put("/review/:id", protect, reviewDocument);

// Shared
router.get("/activity", protect, getRecentActivity);

export default router;
