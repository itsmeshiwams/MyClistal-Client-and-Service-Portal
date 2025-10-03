import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route for fetching dashboard
router.get("/", protect, getDashboard);

export default router;
