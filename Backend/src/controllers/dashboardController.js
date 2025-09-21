export const getDashboard = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === "Client") {
      // Example client dashboard
      return res.json({
        message: "Client Dashboard",
        userId: id,
        stats: {
          totalDocsUploaded: 12,
          pendingApprovals: 2,
        },
      });
    }

    if (role === "Staff") {
      // Example staff dashboard
      return res.json({
        message: "Staff Dashboard",
        userId: id,
        stats: {
          clientsAssigned: 5,
          docsToReview: 10,
        },
      });
    }

    res.status(403).json({ message: "Unauthorized role" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
