import fs from "fs";
import path from "path";
import Document from "../models/Document.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";

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



// ✅ Dashboard statistics with real DB counts
export const getDashboardStats = async (req, res) => {
  try {
    // Total docs
    const totalDocuments = await Document.countDocuments();

    // Pending Review
    const pendingReview = await Document.countDocuments({
      status: "Pending Review",
    });

    // Compliance Related
    const complianceRelated = await Document.countDocuments({
      complianceRelated: true,
    });

    // Archived
    const archived = await Document.countDocuments({
      archived: true,
    });

    // Due This Week (example: docs with dueDate within next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const dueThisWeek = await Document.countDocuments({
      dueDate: { $gte: today, $lte: nextWeek },
    });

    res.json({
      totalDocuments,
      pendingReview,
      complianceRelated,
      archived,
      dueThisWeek,
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};


// ✅ Recent activities (Staff only, show latest logs)
export const getRecentActivities = async (req, res) => {
  try {
    const activities = await (
      await import("../models/Activity.js")
    ).default
      .find()
      .populate("user", "email role")           // staff/client who did the action
      .populate("targetClient", "email role")   // the recipient client (if any)
      .populate("document", "name type status") // document info
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
};


// Staff sends document to a specific client
export const sendDocumentToClient = async (req, res) => {
  try {
    const { clientId, name, type } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    // validate client
    const client = await User.findById(clientId);
    if (!client || client.role !== "Client") {
      return res.status(400).json({ message: "Invalid client" });
    }

    const document = await Document.create({
      name,
      type,
      size: (req.file.size / 1024 / 1024).toFixed(2) + " MB",
      status: "Pending Review",
      fileUrl: req.file.path,
      uploadedBy: req.user._id,   // staff
      client: client._id,         // assigned client
    });

    // log activity
    await Activity.create({
      user: req.user._id,
      action: "SENT_TO_CLIENT",
      document: document._id,
      targetClient: client._id,
    });

    res.status(201).json({ message: "Document sent to client", document });
  } catch (err) {
    console.error("Error sending document:", err);
    res.status(500).json({ message: "Error sending document", error: err.message });
  }
};


// Client fetches only documents sent to them by staff
export const getDocumentsSentToMe = async (req, res) => {
  try {
    const docs = await Document.find({
      client: req.user._id,
      uploadedBy: { $ne: req.user._id }, // exclude self-uploads
    }).populate("uploadedBy", "email role");

    res.json(docs);
  } catch (err) {
    console.error("Error fetching client documents:", err);
    res.status(500).json({ message: "Error fetching documents", error: err.message });
  }
};
