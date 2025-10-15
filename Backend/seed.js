// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import User from "./src/models/User.js";
// import Document from "./src/models/Document.js";
// import Activity from "./src/models/Activity.js";

// dotenv.config();

// // Helper: random date within last 30 days
// const getRandomDateWithinLast30Days = () => {
//   const now = new Date();
//   const past = new Date();
//   past.setDate(now.getDate() - 30);
//   return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
// };

// const seedDatabase = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     // Wipe old data
//     await User.deleteMany();
//     await Document.deleteMany();
//     await Activity.deleteMany();

//     // Create sample users
//     const hashedPassword = await bcrypt.hash("password123", 10);

//     const [client1, client2, staffUser] = await User.insertMany([
//       { email: "ram@example.com", password: hashedPassword, role: "Client" },
//       { email: "sita@example.com", password: hashedPassword, role: "Client" },
//       { email: "staff@example.com", password: hashedPassword, role: "Staff" },
//     ]);

//     console.log("✅ Users seeded");

//     // Create sample documents with random dates
//     const client1Docs = [
//       {
//         name: "Ram Tax Report 2023",
//         type: "Report",
//         size: "1.5 MB",
//         status: "Approved",
//         fileUrl: "uploads/ram-tax-report-2023.pdf",
//         uploadedBy: staffUser._id,
//         client: client1._id,
//         complianceRelated: true,
//         uploadedDate: getRandomDateWithinLast30Days(),
//         lastModified: getRandomDateWithinLast30Days(),
//       },
//       {
//         name: "Ram Policy Agreement",
//         type: "Policy",
//         size: "0.9 MB",
//         status: "Pending Review",
//         fileUrl: "uploads/ram-policy-agreement.pdf",
//         uploadedBy: client1._id,
//         client: client1._id,
//         uploadedDate: getRandomDateWithinLast30Days(),
//         lastModified: getRandomDateWithinLast30Days(),
//       },
//     ];

//     const client2Docs = [
//       {
//         name: "Sita Invoice #2001",
//         type: "Invoice",
//         size: "0.5 MB",
//         status: "Draft",
//         fileUrl: "uploads/sita-invoice-2001.pdf",
//         uploadedBy: client2._id,
//         client: client2._id,
//         uploadedDate: getRandomDateWithinLast30Days(),
//         lastModified: getRandomDateWithinLast30Days(),
//       },
//       {
//         name: "Sita Project Plan",
//         type: "Word",
//         size: "2.1 MB",
//         status: "Needs Signature",
//         fileUrl: "uploads/sita-project-plan.docx",
//         uploadedBy: client2._id,
//         client: client2._id,
//         uploadedDate: getRandomDateWithinLast30Days(),
//         lastModified: getRandomDateWithinLast30Days(),
//       },
//       {
//         name: "Sita Financial Sheet Q1",
//         type: "Excel",
//         size: "1.2 MB",
//         status: "Completed",
//         fileUrl: "uploads/sita-financial-sheet-q1.xlsx",
//         uploadedBy: staffUser._id,
//         client: client2._id,
//         uploadedDate: getRandomDateWithinLast30Days(),
//         lastModified: getRandomDateWithinLast30Days(),
//       },
//     ];

//     const allDocs = [...client1Docs, ...client2Docs];
//     const insertedDocs = await Document.insertMany(allDocs);

//     console.log("✅ Documents seeded");

//     // Create some activity logs with random dates
//     const activities = [
//       {
//         user: client1._id,
//         action: "UPLOAD",
//         document: insertedDocs[1]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//       {
//         user: staffUser._id,
//         action: "UPLOAD",
//         document: insertedDocs[0]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//       {
//         user: client2._id,
//         action: "UPLOAD",
//         document: insertedDocs[2]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//       {
//         user: client2._id,
//         action: "UPLOAD",
//         document: insertedDocs[3]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//       {
//         user: staffUser._id,
//         action: "UPLOAD",
//         document: insertedDocs[4]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//       {
//         user: staffUser._id,
//         action: "DOWNLOAD",
//         document: insertedDocs[2]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//       {
//         user: staffUser._id,
//         action: "STATUS_CHANGE",
//         document: insertedDocs[3]._id,
//         createdAt: getRandomDateWithinLast30Days(),
//       },
//     ];

//     await Activity.insertMany(activities);

//     console.log("✅ Activities seeded with realistic timestamps");

//     process.exit();
//   } catch (err) {
//     console.error("❌ Error seeding database:", err.message);
//     process.exit(1);
//   }
// };

// seedDatabase();


// backend/seed.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "./src/models/User.js";
import Document from "./src/models/Document.js";
import Activity from "./src/models/Activity.js";
import Chat from "./src/models/Chat.js";
import Message from "./src/models/Message.js";
import Presence from "./src/models/Presence.js";

dotenv.config();

// Helper: random date within last 30 days
const getRandomDateWithinLast30Days = () => {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 30);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

// Helper: pick random element
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Wipe old data
    await Promise.all([
      User.deleteMany(),
      Document.deleteMany(),
      Activity.deleteMany(),
      Chat.deleteMany(),
      Message.deleteMany(),
      Presence.deleteMany(),
    ]);

    // Seed Users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const clientUsers = await User.insertMany([
      { email: "oliver.nz@example.com", password: hashedPassword, role: "Client" },
      { email: "sophie.nz@example.com", password: hashedPassword, role: "Client" },
      { email: "liam.nz@example.com", password: hashedPassword, role: "Client" },
      { email: "mia.nz@example.com", password: hashedPassword, role: "Client" },
      { email: "noah.nz@example.com", password: hashedPassword, role: "Client" },
    ]);

    const staffUsers = await User.insertMany([
      { email: "emma.staff@example.com", password: hashedPassword, role: "Staff" },
      { email: "jack.staff@example.com", password: hashedPassword, role: "Staff" },
      { email: "ava.staff@example.com", password: hashedPassword, role: "Staff" },
      { email: "lucas.staff@example.com", password: hashedPassword, role: "Staff" },
      { email: "harper.staff@example.com", password: hashedPassword, role: "Staff" },
    ]);

    console.log(`✅ Seeded ${clientUsers.length} clients & ${staffUsers.length} staff`);

    // Seed Presence (random online/offline)
    const allUsers = [...clientUsers, ...staffUsers];
    const presences = allUsers.map((u) => ({
      user: u._id,
      status: Math.random() > 0.5 ? "online" : "offline",
      lastSeen: getRandomDateWithinLast30Days(),
    }));
    await Presence.insertMany(presences);
    console.log("✅ Presence seeded");

    // Seed Chats (Staff ↔ Client and Staff ↔ Staff)
    const chats = [];

    // Client ↔ Staff (5 examples)
    for (let i = 0; i < 5; i++) {
      const client = clientUsers[i];
      const staff = pick(staffUsers);
      chats.push({
        isGroup: false,
        participants: [client._id, staff._id],
      });
    }

    // Staff ↔ Staff (2 examples)
    for (let i = 0; i < 2; i++) {
      const [s1, s2] = [pick(staffUsers), pick(staffUsers)];
      if (s1._id.toString() !== s2._id.toString()) {
        chats.push({
          isGroup: false,
          participants: [s1._id, s2._id],
        });
      }
    }

    const createdChats = await Chat.insertMany(chats);
    console.log(`✅ Seeded ${createdChats.length} chats`);

    // Seed Messages for each chat (3–5 per chat)
    const sampleTexts = [
      "Kia ora, hope you're doing well!",
      "Let's review the tax documents tomorrow.",
      "I’ve updated the financial report — please check.",
      "Good morning! How’s the audit going?",
      "I'll be in the Auckland office this afternoon.",
      "Cheers, talk soon.",
      "Can you clarify the GST details in section B?",
      "Looks good from my side.",
    ];

    for (const chat of createdChats) {
      const [p1, p2] = chat.participants;
      const messagesForThisChat = [];

      const msgCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < msgCount; i++) {
        const sender = i % 2 === 0 ? p1 : p2;
        messagesForThisChat.push({
          chat: chat._id,
          sender,
          text: pick(sampleTexts),
          createdAt: getRandomDateWithinLast30Days(),
          statusMap: new Map([
            [p1.toString(), i % 2 === 0 ? "read" : "delivered"],
            [p2.toString(), i % 2 !== 0 ? "read" : "delivered"],
          ]),
        });
      }

      const insertedMsgs = await Message.insertMany(messagesForThisChat);
      // update lastMessage on chat
      chat.lastMessage = insertedMsgs[insertedMsgs.length - 1]._id;
      await chat.save();
    }

    console.log("✅ Messages seeded");

    // Optional: Keep your previous Document + Activity seeding for completeness
    const staffUser = staffUsers[0];
    const client1 = clientUsers[0];

    const docs = await Document.insertMany([
      {
        name: "Oliver Annual Report 2024",
        type: "PDF",
        size: "1.2 MB",
        status: "Approved",
        fileUrl: "uploads/oliver-annual-report.pdf",
        uploadedBy: staffUser._id,
        client: client1._id,
        complianceRelated: true,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
      {
        name: "GST Filing Guidelines",
        type: "Policy",
        size: "0.8 MB",
        status: "Pending Review",
        fileUrl: "uploads/gst-guidelines.pdf",
        uploadedBy: client1._id,
        client: client1._id,
        uploadedDate: getRandomDateWithinLast30Days(),
        lastModified: getRandomDateWithinLast30Days(),
      },
    ]);

    await Activity.insertMany([
      {
        user: client1._id,
        action: "UPLOAD",
        document: docs[1]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
      {
        user: staffUser._id,
        action: "UPLOAD",
        document: docs[0]._id,
        createdAt: getRandomDateWithinLast30Days(),
      },
    ]);

    console.log("✅ Documents & activities seeded");

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
};

seedDatabase();
