import User from "../models/User.js";

// Sample mock data (later replace with DB queries)
const clientDashboardData = {
  pendingTasks: [
    { title: "Review Q4 Tax Documents", status: "Overdue" },
    { title: "Approve Financial Statements", status: "Pending" },
    { title: "Provide Payroll Information", status: "Due Soon" }
  ],
  unreadDocuments: [
    { name: "2023 Tax Return.pdf", date: "2024-02-01" },
    { name: "Q4 Financial Report.xlsx", date: "2024-01-20" }
  ],
  upcomingEvents: [
    { title: "Annual Tax Meeting", date: "2024-02-20" },
    { title: "Q1 Financial Review", date: "2024-03-05" },
    { title: "Payroll Submission Deadline", date: "2024-03-15" }
  ],
  outstandingInvoices: {
    amount: 2500,
    status: "pending payments"
  },
  complianceAlerts: {
    count: 1,
    message: "critical alerts detected"
  },
  recentCommunications: [
    {
      from: "Sita Sharma",
      message: "Your Q4 financial statements are ready for review. Please check the documents section.",
      timeAgo: "2 days ago"
    },
    {
      from: "AccountantConnect Support",
      message: "Welcome to AccountantConnect! We're here to help you manage your finances efficiently.",
      timeAgo: "1 week ago"
    }
  ]
};

const staffDashboardData = {
  tasksOverview: {
    total: 5,
    pending: 3,
    overdue: 2
  },
  documentsManagement: {
    pendingReview: 7,
    recentUploads: 12
  },
  upcomingEvents: [
    { title: "Client Review (10 AM)", type: "Meeting", date: "2024-02-25" },
    { title: "Tax Filing Deadline", type: "Deadline", date: "2024-03-15" }
  ],
  recentCommunications: {
    unreadMessages: 2,
    latestClientMessage: "Q4 Report Inquiry"
  },
  billingSummary: {
    invoicesDue: 4,
    paymentsProcessed: 12500
  },
  complianceStatus: {
    activeAlerts: 1,
    nextAudit: "June 2024"
  }
};

// Controller for fetching dashboard
export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("role email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "Client") {
      return res.json({ role: "Client", dashboard: clientDashboardData });
    } else if (user.role === "Staff") {
      return res.json({ role: "Staff", dashboard: staffDashboardData });
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
