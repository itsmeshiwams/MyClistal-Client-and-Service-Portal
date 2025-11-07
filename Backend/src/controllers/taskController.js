import Task from "../models/Task.js";
import User from "../models/User.js";
import { getIO } from "../utils/socket.js";
import mongoose from "mongoose";

const pushActivity = async (task, userId, text, meta = {}) => {
  task.activity.push({ user: userId, text, meta });
  await task.save();
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description = "",
      assignee,
      dueDate = null,
      priority = "Medium",
      attachments = [],
      metadata = {},
    } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    if (!assignee || !mongoose.Types.ObjectId.isValid(assignee))
      return res.status(400).json({ message: "Valid assignee required" });
    const assigneeUser = await User.findById(assignee).select("_id");
    if (!assigneeUser)
      return res.status(400).json({ message: "Assignee not found" });

    const task = new Task({
      title,
      description,
      createdBy: req.user._id,
      assignee: assigneeUser._id,
      dueDate,
      priority,
      attachments,
      metadata,
    });

    task.activity.push({ user: req.user._id, text: "created task", meta: {} });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("createdBy", "email role")
      .populate("assignee", "email role");
    const io = getIO();
    if (io) {
      io.to(`user:${req.user._id}`).emit("task:created", populated);
      io.to(`user:${assigneeUser._id}`).emit("task:created", populated);
      io.to(`task:${task._id}`).emit("task:created", populated);
    }

    return res.status(201).json(populated);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });
    const task = await Task.findById(id)
      .populate("createdBy", "email role")
      .populate("assignee", "email role")
      .populate("activity.user", "email role");
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isCreator = task.createdBy._id.equals(req.user._id);
    const isAssignee = task.assignee._id.equals(req.user._id);
    const isStaff = req.user.role === "Staff";

    if (!isCreator && !isAssignee && !isStaff)
      return res.status(403).json({ message: "Forbidden" });

    if (req.user.role === "Client" && !isCreator && !isAssignee)
      return res.status(403).json({ message: "Forbidden" });

    if (req.user.role === "Client") {
      const limited = task.toObject();
      limited.activity = limited.activity.filter(
        (a) =>
          a.user &&
          (a.user._id.equals(req.user._id) ||
            limited.createdBy._id.equals(req.user._id) ||
            limited.assignee._id.equals(req.user._id))
      );
      return res.json(limited);
    }

    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

const buildDateFilter = (dateFilter, from, to) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (dateFilter === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (dateFilter === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (dateFilter === "this_week") {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (dateFilter === "this_month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (dateFilter === "custom" && from && to) {
    const f = new Date(from);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    return { $gte: f, $lte: t };
  }
  return null;
};

export const listTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q,
      status,
      priority,
      dateFilter,
      from,
      to,
      createdBy,
      assignee,
    } = req.query;
    const filter = {};
    if (req.user.role !== "Staff") {
      filter.$or = [{ createdBy: req.user._id }, { assignee: req.user._id }];
    } else {
      if (createdBy && mongoose.Types.ObjectId.isValid(createdBy))
        filter.createdBy = createdBy;
      if (assignee && mongoose.Types.ObjectId.isValid(assignee))
        filter.assignee = assignee;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (q) filter.$text = { $search: q };
    const dateRange = buildDateFilter(dateFilter, from, to);
    if (dateRange) filter.createdAt = dateRange;
    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy", "email role")
        .populate("assignee", "email role"),
      Task.countDocuments(filter),
    ]);
    return res.json({
      data: tasks,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isCreator = task.createdBy.equals(req.user._id);
    const isAssignee = task.assignee.equals(req.user._id);
    const isStaff = req.user.role === "Staff";

    if (!isCreator && !isAssignee && !isStaff)
      return res.status(403).json({ message: "Forbidden" });

    const updatable = [
      "title",
      "description",
      "dueDate",
      "priority",
      "progress",
      "attachments",
      "metadata",
    ];
    for (const key of Object.keys(patch)) {
      if (updatable.includes(key)) {
        task[key] = patch[key];
      }
    }

    task.activity.push({
      user: req.user._id,
      text: `updated fields: ${Object.keys(patch).join(",")}`,
      meta: { fields: Object.keys(patch) },
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("createdBy", "email role")
      .populate("assignee", "email role");
    const io = getIO();
    if (io) {
      io.to(`task:${task._id}`).emit("task:updated", populated);
      io.to(`user:${task.assignee}`).emit("task:updated", populated);
      io.to(`user:${task.createdBy}`).emit("task:updated", populated);
    }

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status required" });
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.createdBy.equals(req.user._id))
      return res
        .status(403)
        .json({ message: "Only creator can change status" });

    task.status = status;
    task.activity.push({
      user: req.user._id,
      text: `status changed to ${status}`,
      meta: { status },
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("createdBy", "email role")
      .populate("assignee", "email role");
    const io = getIO();
    if (io) {
      io.to(`task:${task._id}`).emit("task:status_changed", populated);
      io.to(`user:${task.assignee}`).emit("task:status_changed", populated);
      io.to(`user:${task.createdBy}`).emit("task:status_changed", populated);
    }

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const assignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee } = req.body;
    if (!assignee || !mongoose.Types.ObjectId.isValid(assignee))
      return res.status(400).json({ message: "Valid assignee required" });
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.createdBy.equals(req.user._id) && req.user.role !== "Staff")
      return res
        .status(403)
        .json({ message: "Only creator or staff can assign" });

    const assigneeUser = await User.findById(assignee).select("_id");
    if (!assigneeUser)
      return res.status(400).json({ message: "Assignee not found" });

    task.assignee = assigneeUser._id;
    task.activity.push({
      user: req.user._id,
      text: `assigned to ${assigneeUser._id}`,
      meta: { assignee: assigneeUser._id },
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("createdBy", "email role")
      .populate("assignee", "email role");
    const io = getIO();
    if (io) {
      io.to(`task:${task._id}`).emit("task:assigned", populated);
      io.to(`user:${task.assignee}`).emit("task:assigned", populated);
      io.to(`user:${task.createdBy}`).emit("task:assigned", populated);
    }

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const addActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, meta = {} } = req.body;
    if (!text) return res.status(400).json({ message: "Text required" });
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isCreator = task.createdBy.equals(req.user._id);
    const isAssignee = task.assignee.equals(req.user._id);
    const isStaff = req.user.role === "Staff";

    if (!isCreator && !isAssignee && !isStaff)
      return res.status(403).json({ message: "Forbidden" });

    task.activity.push({ user: req.user._id, text, meta });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("activity.user", "email role")
      .populate("createdBy", "email role")
      .populate("assignee", "email role");
    const io = getIO();
    if (io) {
      io.to(`task:${task._id}`).emit("task:activity_added", populated);
      io.to(`user:${task.assignee}`).emit("task:activity_added", populated);
      io.to(`user:${task.createdBy}`).emit("task:activity_added", populated);
    }

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.createdBy.equals(req.user._id))
      return res.status(403).json({ message: "Only creator can delete" });

    await Task.deleteOne({ _id: id });

    const io = getIO();
    if (io) {
      io.to(`task:${id}`).emit("task:deleted", { taskId: id });
      io.to(`user:${task.assignee}`).emit("task:deleted", { taskId: id });
      io.to(`user:${task.createdBy}`).emit("task:deleted", { taskId: id });
    }

    return res.json({ message: "Task deleted", taskId: id });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
