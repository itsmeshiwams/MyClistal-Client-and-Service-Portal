// controllers/documentController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import { logActivity } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../uploads");

// ✅ Helper function to resolve page value (supports "next"/"prev")
const resolvePageNumber = (queryPage, totalPages, currentPage) => {
  if (queryPage === "next") {
    return currentPage < totalPages ? currentPage + 1 : totalPages;
  }
  if (queryPage === "prev") {
    return currentPage > 1 ? currentPage - 1 : 1;
  }
  const num = parseInt(queryPage);
  return isNaN(num) || num < 1 ? 1 : num;
};


const getContentType = (ext) => {
  const map = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] || "application/octet-stream";
};

// ✅ Upload document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { name, type } = req.body;
    const absolutePath = path.resolve(req.file.path);
    const publicUrl = `/uploads/${path.basename(req.file.path)}`;
    const size = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

    const doc = await Document.create({
      name: name || req.file.originalname,
      type,
      size,
      fileUrl: absolutePath,
      publicUrl,
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

// ✅ Client: get own documents
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

// ✅ Staff: get all documents
// ✅ Get all documents with pagination and next/prev switching
export const getAllDocuments = async (req, res) => {
  try {
    const limit = 15; // fixed page size
    const totalCount = await Document.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // Determine the current page first
    const rawPage = req.query.page || "1";
    // If rawPage is numeric, use it first, otherwise we’ll handle next/prev after fetching current page
    let currentPage = parseInt(rawPage);
    if (isNaN(currentPage)) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // If user requested next/prev explicitly
    const page = resolvePageNumber(rawPage, totalPages, currentPage);

    const skip = (page - 1) * limit;

    const docs = await Document.find()
      .populate("uploadedBy", "email role")
      .sort({ uploadedDate: -1 })
      .skip(skip)
      .limit(limit);

    const nextPageNumber = page < totalPages ? page + 1 : null;
    const prevPageNumber = page > 1 ? page - 1 : null;

    res.json({
      data: docs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        nextPageNumber,
        prevPageNumber,
      },
    });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// ✅ Download document safely
export const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (!fs.existsSync(doc.fileUrl)) {
      return res.status(404).json({ message: "File missing from server" });
    }

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
    console.error("Download error:", err);
    res.status(500).json({ message: "Failed to download document" });
  }
};

// ✅ Preview document inline
export const previewDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (!fs.existsSync(doc.fileUrl)) {
      return res.status(404).json({ message: "File missing from server" });
    }

    // Role check
    if (
      req.user.role !== "Staff" &&
      doc.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await logActivity(req.user._id, "PREVIEW", doc._id);

    const ext = path.extname(doc.fileUrl).toLowerCase();
    res.setHeader("Content-Type", getContentType(ext));
    fs.createReadStream(doc.fileUrl).pipe(res);
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ message: "Failed to preview document" });
  }
};

// ✅ Update document status (staff)
export const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (status == "Archived") {
      doc.archived = true;
    } else if (doc.archived && status != "Archived") {
      doc.archived = false;
    }
    doc.status = status;
    doc.lastModified = new Date();
    await doc.save();
    await logActivity(req.user._id, "STATUS_CHANGE", doc._id);

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update document status" });
  }
};

// ✅ Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const pendingReview = await Document.countDocuments({ status: "Pending Review" });
    const complianceRelated = await Document.countDocuments({ complianceRelated: true });
    const archived = await Document.countDocuments({ archived: true });

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
    res.status(500).json({ message: "Error fetching stats" });
  }
};

// ✅ Recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = 15; // fixed page size
    const totalCount = await Activity.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const rawPage = req.query.page || "1";
    let currentPage = parseInt(rawPage);
    if (isNaN(currentPage)) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const page = resolvePageNumber(rawPage, totalPages, currentPage);

    const skip = (page - 1) * limit;

    const activities = await Activity.find()
      .populate("user", "email role")
      .populate("targetClient", "email role")
      .populate("document", "name type status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const nextPageNumber = page < totalPages ? page + 1 : null;
    const prevPageNumber = page > 1 ? page - 1 : null;

    res.json({
      data: activities,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        nextPageNumber,
        prevPageNumber,
      },
    });
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
};



// ✅ Staff sends document to client
export const sendDocumentToClient = async (req, res) => {
  try {
    const { clientId, name, type } = req.body;

    if (!req.file) return res.status(400).json({ message: "File is required" });

    const client = await User.findById(clientId);
    if (!client || client.role !== "Client") {
      return res.status(400).json({ message: "Invalid client" });
    }

    const absolutePath = path.resolve(req.file.path);
    const publicUrl = `/uploads/${path.basename(req.file.path)}`;

    const document = await Document.create({
      name,
      type,
      size: (req.file.size / 1024 / 1024).toFixed(2) + " MB",
      status: "Pending Review",
      fileUrl: absolutePath,
      publicUrl,
      uploadedBy: req.user._id,
      client: client._id,
    });

    await Activity.create({
      user: req.user._id,
      action: "SENT_TO_CLIENT",
      document: document._id,
      targetClient: client._id,
    });

    res.status(201).json({ message: "Document sent to client", document });
  } catch (err) {
    console.error("Error sending document:", err);
    res.status(500).json({ message: "Error sending document" });
  }
};

// ✅ Client fetches documents sent to them
export const getDocumentsSentToMe = async (req, res) => {
  try {
    const docs = await Document.find({
      client: req.user._id,
      uploadedBy: { $ne: req.user._id },
    }).populate("uploadedBy", "email role");

    res.json(docs);
  } catch (err) {
    console.error("Error fetching client documents:", err);
    res.status(500).json({ message: "Error fetching documents" });
  }
};


// ✅ Get all users with role "Client" (Staff-only)
export const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: "Client" }).select("-password"); // exclude password
    res.status(200).json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
