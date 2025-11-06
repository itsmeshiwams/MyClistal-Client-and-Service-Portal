import express from "express";
import {
  createTask,
  getTask,
  listTasks,
  updateTask,
  changeStatus,
  assignUser,
  addActivity,
  deleteTask
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createTask);
router.get("/", listTasks);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.post("/:id/status", changeStatus);
router.post("/:id/assign", assignUser);
router.post("/:id/activity", addActivity);
router.delete("/:id", deleteTask);

export default router;
