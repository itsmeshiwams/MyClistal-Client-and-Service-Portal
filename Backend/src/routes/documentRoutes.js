// routes/documentRoutes.js
import express from "express";
import { protect, isStaff } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  getClientDocuments,
  getAllDocuments,
  downloadDocument,
  previewDocument,
  updateDocumentStatus,
  getDashboardStats,
  getRecentActivities,
} from "../controllers/documentController.js";

const router = express.Router();


//    CLIENT ROUTES


//  Upload new document (Clients & Staff)
router.post("/upload", protect, upload.single("file"), uploadDocument);

// Get documents uploaded by logged-in client
router.get("/my-documents", protect, getClientDocuments);

// Download own document (Staff can access all)
router.get("/:documentId/download", protect, downloadDocument);

// Preview document inline
router.get("/:documentId/preview", protect, previewDocument);


//    STAFF ROUTES
   

//  Get all documents
router.get("/all", protect, isStaff, getAllDocuments);

//  Update document status
router.put("/:documentId/status", protect, isStaff, updateDocumentStatus);

//  Dashboard stats
router.get("/stats/dashboard", protect, isStaff, getDashboardStats);

//  Recent activity logs
router.get("/activities/recent", protect, isStaff, getRecentActivities);

export default router;
