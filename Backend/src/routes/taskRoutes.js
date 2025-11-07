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

router.post("/create", createTask);
router.get("/list", listTasks);
router.get("/get/:id", getTask);
router.patch("update/:id", updateTask);
router.post("/:id/status", changeStatus);
router.post("/:id/assign", assignUser);
router.post("/:id/activity", addActivity);
router.delete("/delete/:id", deleteTask);

export default router;
