import fs from "fs";
import path from "path";
import Document from "../models/Document.js";
import { logActivity } from "../utils/logger.js";

// ✅ Upload document (Client or Staff)
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { name, type } = req.body;
    const fileUrl = req.file.path; // stored locally in /uploads
    const size = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

    const doc = await Document.create({
      name: name || req.file.originalname,
      type,
      size,
      fileUrl,
      uploadedBy: req.user._id,
      client: req.user.role === "Client" ? req.user._id : null,
    });

    await logActivity(req.user._id, "UPLOAD", doc._id);

    res.status(201).json(doc);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to upload document" });
  }
};

// ✅ Get all documents uploaded by the logged-in client
export const getClientDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user._id }).sort({
      uploadedDate: -1,
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// ✅ Staff: Get all documents
export const getAllDocuments = async (req, res) => {
  try {
    const docs = await Document.find()
      .populate("uploadedBy", "email role")
      .sort({ uploadedDate: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// ✅ Download document (Staff can access all, Clients only their own)
export const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Role check
    if (
      req.user.role !== "Staff" &&
      doc.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await logActivity(req.user._id, "DOWNLOAD", doc._id);

    res.download(doc.fileUrl, doc.name);
  } catch (err) {
    res.status(500).json({ message: "Failed to download document" });
  }
};

// ✅ Preview document inline (Staff can preview all, Clients only their own)
export const previewDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Role check
    if (
      req.user.role !== "Staff" &&
      doc.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await logActivity(req.user._id, "PREVIEW", doc._id);

    const ext = path.extname(doc.fileUrl).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    if ([".png", ".jpg", ".jpeg"].includes(ext)) contentType = "image/jpeg";
    if (ext === ".doc" || ext === ".docx")
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === ".xls" || ext === ".xlsx")
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    res.setHeader("Content-Type", contentType);
    fs.createReadStream(doc.fileUrl).pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Failed to preview document" });
  }
};

// ✅ Update document status (Staff only)
export const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.status = status;
    doc.lastModified = new Date();
    await doc.save();

    await logActivity(req.user._id, "STATUS_CHANGE", doc._id);

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update document status" });
  }
};

// ✅ Dashboard stats (Staff only)
export const getDashboardStats = async (req, res) => {
  try {
    const totalDocs = await Document.countDocuments();
    const pendingDocs = await Document.countDocuments({
      status: "Pending Review",
    });
    const approvedDocs = await Document.countDocuments({ status: "Approved" });

    res.json({ totalDocs, pendingDocs, approvedDocs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

// ✅ Recent activities (Staff only, show latest logs)
export const getRecentActivities = async (req, res) => {
  try {
    const activities = await (
      await import("../models/Activity.js")
    ).default
      .find()
      .populate("user", "email role")
      .populate("document", "name type status")
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch activities" });
  }
};
