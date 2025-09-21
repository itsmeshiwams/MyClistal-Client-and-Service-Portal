import Document from "../models/Document.js";
import Activity from "../models/Activity.js";

// Upload Document (Client)
export const uploadDocument = async (req, res) => {
  try {
    const { title, type, fileUrl, size } = req.body;

    const doc = await Document.create({
      title,
      type,
      fileUrl,
      size,
      uploadedBy: req.user.id
    });

    await Activity.create({
      action: `Uploaded '${title}'`,
      document: doc._id,
      user: req.user.id
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get My Documents (Client)
export const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff - Get All Documents with Filters
export const getAllDocuments = async (req, res) => {
  try {
    if (req.user.role !== "Staff") {
      return res.status(403).json({ message: "Only staff can view all documents" });
    }

    const { status, category } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    const docs = await Document.find(query).populate("uploadedBy", "email role").sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff - Review Document
export const reviewDocument = async (req, res) => {
  try {
    if (req.user.role !== "Staff") {
      return res.status(403).json({ message: "Only staff can review documents" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const doc = await Document.findByIdAndUpdate(id, { status }, { new: true });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    await Activity.create({
      action: `Reviewed '${doc.title}' - ${status}`,
      document: doc._id,
      user: req.user.id
    });

    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Recent Activity (Both Client & Staff can see their actions)
export const getRecentActivity = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Client") query.user = req.user.id;

    const activities = await Activity.find(query)
      .populate("document", "title")
      .populate("user", "email role")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
