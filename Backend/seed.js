import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";
import Document from "./src/models/Document.js";
import Activity from "./src/models/Activity.js";

dotenv.config();

// Helper: random date within last 30 days
const getRandomDateWithinLast30Days = () => {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 30);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Wipe old data
    await User.deleteMany();
    await Document.deleteMany();
    await Activity.deleteMany();

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const [client1, client2, staffUser] = await User.insertMany([
      { email: "ram@example.com", password: hashedPassword, role: "Client" },
      { email: "sita@example.com", password: hashedPassword, role: "Client" },
      { email: "staff@example.com", password: hashedPassword, role: "Staff" },
    ]);

    console.log("✅ Users seeded");

    // Create sample documents with random dates
    const client1Docs = [
      {
        name: "Ram Tax Report 2023",
        type: "Report",
        size: "1.5 MB",
        status: "Approved",
        fileUrl: "uploads/ram-tax-report-2023.pdf",
        uploadedBy: staffUser._id,
        client: client1._id,
        complianceRelated: true,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
      {
        name: "Ram Policy Agreement",
        type: "Policy",
        size: "0.9 MB",
        status: "Pending Review",
        fileUrl: "uploads/ram-policy-agreement.pdf",
        uploadedBy: client1._id,
        client: client1._id,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
    ];

    const client2Docs = [
      {
        name: "Sita Invoice #2001",
        type: "Invoice",
        size: "0.5 MB",
        status: "Draft",
        fileUrl: "uploads/sita-invoice-2001.pdf",
        uploadedBy: client2._id,
        client: client2._id,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
      {
        name: "Sita Project Plan",
        type: "Word",
        size: "2.1 MB",
        status: "Needs Signature",
        fileUrl: "uploads/sita-project-plan.docx",
        uploadedBy: client2._id,
        client: client2._id,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
      {
        name: "Sita Financial Sheet Q1",
        type: "Excel",
        size: "1.2 MB",
        status: "Completed",
        fileUrl: "uploads/sita-financial-sheet-q1.xlsx",
        uploadedBy: staffUser._id,
        client: client2._id,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
    ];

    const allDocs = [...client1Docs, ...client2Docs];
    const insertedDocs = await Document.insertMany(allDocs);

    console.log("✅ Documents seeded");

    // Create some activity logs with random dates
    const activities = [
      {
        user: client1._id,
        action: "UPLOAD",
        document: insertedDocs[1]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: staffUser._id,
        action: "UPLOAD",
        document: insertedDocs[0]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: client2._id,
        action: "UPLOAD",
        document: insertedDocs[2]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: client2._id,
        action: "UPLOAD",
        document: insertedDocs[3]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: staffUser._id,
        action: "UPLOAD",
        document: insertedDocs[4]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: staffUser._id,
        action: "DOWNLOAD",
        document: insertedDocs[2]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: staffUser._id,
        action: "STATUS_CHANGE",
        document: insertedDocs[3]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
    ];

    await Activity.insertMany(activities);

    console.log("✅ Activities seeded with realistic timestamps");

    process.exit();
  } catch (err) {
    console.error("❌ Error seeding database:", err.message);
    process.exit(1);
  }
};

seedDatabase();
