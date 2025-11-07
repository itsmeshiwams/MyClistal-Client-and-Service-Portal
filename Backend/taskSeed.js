// backend/taskSeed.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import Task from "./src/models/Task.js";
import User from "./src/models/User.js";

dotenv.config();

// Helper: random date within next 30 days for due dates
const getRandomDueDate = () => {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + 30);
  return new Date(now.getTime() + Math.random() * (future.getTime() - now.getTime()));
};

// Helper: random date within last 30 days for activity timestamps
const getRandomPastDate = () => {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 30);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

// Helper: pick random element from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Sample data generators
const generateTaskTitles = (userEmail) => [
  `Complete tax documentation for ${userEmail.split('@')[0]}`,
  `Review financial statements - ${userEmail.split('@')[0]}`,
  `Prepare quarterly report for ${userEmail.split('@')[0]}`,
  `Client meeting preparation - ${userEmail.split('@')[0]}`,
  `Follow up on pending documents - ${userEmail.split('@')[0]}`,
  `Audit compliance check - ${userEmail.split('@')[0]}`,
  `Budget planning session - ${userEmail.split('@')[0]}`,
  `Tax filing submission - ${userEmail.split('@')[0]}`,
  `Document verification - ${userEmail.split('@')[0]}`,
  `Financial consultation - ${userEmail.split('@')[0]}`
];

const taskDescriptions = [
  "This task requires careful review of all financial documents and compliance with latest regulations.",
  "Important client task that needs to be completed before the deadline.",
  "Regular maintenance task to ensure all records are up to date.",
  "Urgent task that requires immediate attention and completion.",
  "Strategic planning task that will impact upcoming quarterly results.",
  "Detailed analysis required with comprehensive reporting.",
  "Coordination with multiple teams needed for successful completion.",
  "Document preparation and verification for regulatory compliance.",
  "Client-facing task that requires professional presentation.",
  "Backend administrative task to maintain system integrity."
];

const statuses = ["To Do", "In Progress", "Under Review", "Completed", "Overdue"];
const priorities = ["Low", "Medium", "High", "Critical"];

const attachmentSamples = [
  { url: "/uploads/tax-document.pdf", label: "Tax Document" },
  { url: "/uploads/financial-report.xlsx", label: "Financial Report" },
  { url: "/uploads/compliance-checklist.pdf", label: "Compliance Checklist" },
  { url: "/uploads/client-agreement.docx", label: "Client Agreement" },
  { url: "/uploads/audit-findings.pdf", label: "Audit Findings" }
];

const activitySamples = [
  "Task created and assigned",
  "Status updated to In Progress",
  "Document attached for review",
  "Progress updated to 50%",
  "Client feedback received",
  "Final review completed",
  "Task marked as completed",
  "Due date extended",
  "Priority level increased",
  "Additional information requested"
];

const seedTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected for task seeding");

    // Clear existing tasks
    await Task.deleteMany({});
    console.log("✅ Cleared existing tasks");

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to create tasks for`);

    if (users.length === 0) {
      console.log("❌ No users found. Please run user seed first.");
      process.exit(1);
    }

    const tasks = [];
    const staffUsers = users.filter(user => user.role === "Staff");
    const clientUsers = users.filter(user => user.role === "Client");

    console.log(`👥 Staff users: ${staffUsers.length}, Client users: ${clientUsers.length}`);

    // Create tasks for each user
    for (const user of users) {
      const userTitles = generateTaskTitles(user.email);
      const tasksForUser = [];
      
      // Create 5-7 tasks for each user (mix of createdBy and assignee)
      const taskCount = Math.floor(Math.random() * 3) + 5; // 5-7 tasks per user
      
      for (let i = 0; i < taskCount; i++) {
        const isAssignee = Math.random() > 0.5;
        const assignee = isAssignee ? user._id : pick(staffUsers)._id;
        const createdBy = isAssignee ? pick(staffUsers)._id : user._id;
        
        const status = pick(statuses);
        const progress = status === "Completed" ? 100 : 
                        status === "To Do" ? 0 : 
                        status === "In Progress" ? Math.floor(Math.random() * 60) + 20 :
                        status === "Under Review" ? Math.floor(Math.random() * 30) + 70 : 50;

        const dueDate = Math.random() > 0.2 ? getRandomDueDate() : null;
        
        // Generate 0-2 random attachments
        const attachmentCount = Math.floor(Math.random() * 3);
        const attachments = [];
        for (let j = 0; j < attachmentCount; j++) {
          attachments.push(pick(attachmentSamples));
        }

        // Generate 1-3 random activities
        const activityCount = Math.floor(Math.random() * 3) + 1;
        const activities = [];
        for (let j = 0; j < activityCount; j++) {
          activities.push({
            user: j === 0 ? createdBy : pick(users)._id,
            text: pick(activitySamples),
            meta: { autoGenerated: true },
            createdAt: getRandomPastDate(),
            updatedAt: getRandomPastDate()
          });
        }

        const task = {
          title: pick(userTitles),
          description: pick(taskDescriptions),
          createdBy,
          assignee,
          status,
          priority: pick(priorities),
          dueDate,
          progress,
          attachments,
          activity: activities,
          metadata: {
            seedData: true,
            complexity: pick(["Simple", "Moderate", "Complex"]),
            estimatedHours: Math.floor(Math.random() * 40) + 4
          },
          createdAt: getRandomPastDate(),
          updatedAt: getRandomPastDate()
        };

        tasksForUser.push(task);
      }

      tasks.push(...tasksForUser);
      console.log(`✅ Created ${tasksForUser.length} tasks for ${user.email}`);
    }

    // Insert all tasks
    const insertedTasks = await Task.insertMany(tasks);
    console.log(`🎉 Successfully seeded ${insertedTasks.length} tasks total`);

    // Print some statistics
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    console.log("\n📊 Task Status Distribution:");
    taskStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} tasks`);
    });

    const priorityStats = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    console.log("\n📊 Task Priority Distribution:");
    priorityStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} tasks`);
    });

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tasks:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed
seedTasks();