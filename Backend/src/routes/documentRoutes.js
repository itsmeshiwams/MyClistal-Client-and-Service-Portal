// routes/documentRoutes.js
import express from "express";
import { protect, isStaff, isClient } from "../middleware/authMiddleware.js";
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
  sendDocumentToClient,
  getDocumentsSentToMe,
  getAllClients
} from "../controllers/documentController.js";

const router = express.Router();

//    CLIENT ROUTES

//  Upload new document (Clients & Staff)
router.post("/upload", protect, upload.single("file"), uploadDocument);


// Download own document (CLient and Staff can access )
router.get("/:documentId/download", protect, downloadDocument);

// Preview document inline(Client and staff can access )
router.get("/:documentId/preview", protect, previewDocument);

// Get documents uploaded by logged-in client
router.get("/my-documents", protect, isClient, getClientDocuments);

//    STAFF ROUTES

//  Get all documents
router.get("/all", protect, isStaff, getAllDocuments);

//  Update document status
router.put("/:documentId/status", protect, isStaff, updateDocumentStatus);

//  Dashboard stats
router.get("/stats", protect, isStaff, getDashboardStats);

//  Recent activity logs
router.get("/activities/recent", protect, isStaff, getRecentActivities);

// STAFF → send doc to client
router.post(
  "/send-to-client",
  protect,
  isStaff,
  upload.single("file"),
  sendDocumentToClient
);

// CLIENT → view docs sent by staff
router.get("/sent-to-me", protect, isClient, getDocumentsSentToMe);

//Get Clients(Staff Only)
router.get("/clients", protect, isStaff, getAllClients);


export default router;
