// src/components/tasks/TaskDetailsSidebar.jsx
import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  User,
  Calendar,
  Flag,
  MessageSquarePlus,
  ClipboardList,
  Edit3,
  Save,
  Trash2,
  Loader2,
  ChevronDown,
  Paperclip,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  getTask,
  addActivity,
  changeStatus,
  updateTask,
  deleteTask,
} from "../../api/tasks";
import { useAuth } from "../../contexts/AuthContext";

const STATUS_OPTIONS = [
  "To Do",
  "In Progress",
  "Under Review",
  "Completed",
  "Overdue",
];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

export default function TaskDetailsSidebar({ taskId, onClose, onUpdated }) {
  const { user, token } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [mode, setMode] = useState(null); // "update" or "status"
  const [editPayload, setEditPayload] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isCreator = task && user && task.createdBy?.email === user?.email;

  useEffect(() => {
    if (taskId && token) fetchTask();
  }, [taskId, token]);

  async function fetchTask() {
    setLoading(true);
    try {
      const res = await getTask(taskId, token);
      setTask(res);
      setEditPayload(res);
    } catch (err) {
      console.error("Failed to fetch task", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddActivity() {
    if (!activityText.trim()) return;
    await addActivity(taskId, activityText.trim(), {}, token);
    setActivityText("");
    fetchTask();
    onUpdated?.();
  }

  async function handleSaveUpdate() {
    setSaving(true);
    try {
      const allowedFields = [
        "title",
        "description",
        "dueDate",
        "priority",
        "progress",
        "attachments",
        "metadata",
      ];
      const payload = {};
      for (const field of allowedFields) {
        if (editPayload[field] !== undefined)
          payload[field] = editPayload[field];
      }
      await updateTask(taskId, payload, token); // (expected to not work per your note)
      setMode(null);
      fetchTask();
      onUpdated?.();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus() {
    if (!editPayload.status) return;
    setSaving(true);
    try {
      await changeStatus(taskId, editPayload.status, token);
      setMode(null);
      fetchTask();
      onUpdated?.();
    } catch (err) {
      console.error("Status change failed", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    try {
      setLoading(true);
      await deleteTask(taskId, token);
      setConfirming(false);

      // ✅ Show success toast
      showToast("Task deleted successfully ✅", "success");

      onUpdated?.();
      onClose?.();
    } catch (err) {
      console.error("Delete failed", err);
      showToast("Failed to delete task. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!taskId) return null;

  const progressValue = editPayload.progress ?? task?.progress ?? 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-[520px] bg-white backdrop-blur-xl border-l border-gray-100 rounded-l-xl shadow-3xl overflow-y-auto flex flex-col animate-slide-in"
      >
        {/* Header */}
        <div className="sticky top-0  bg-white text-black flex justify-between items-center p-5 shadow-md z-10">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2 gap-2">
              <ClipboardList className="w-5 h-5 text-blue-800" />
              Task Details
            </h2>
            <p className="text-sm opacity-90 truncate">
              Title : {task?.title || "Untitled Task"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-red-800 hover:bg-white/20 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-10 text-blue-900 animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              Loading task details...
            </div>
          ) : (
            <>
              {/* Overview */}
              <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-800" /> Overview
                </h3>

                <InputField
                  label="Title"
                  value={editPayload.title || ""}
                  onChange={(e) =>
                    setEditPayload((p) => ({ ...p, title: e.target.value }))
                  }
                  disabled={mode !== "update"}
                />

                <TextareaField
                  label="Description"
                  value={editPayload.description || ""}
                  onChange={(e) =>
                    setEditPayload((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  disabled={mode !== "update"}
                />

                {/* Progress */}
                {/* Progress */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progress
                  </label>
                  <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-800 h-4 transition-all duration-300 flex items-center justify-end pr-2 text-xs font-medium text-white"
                      style={{ width: `${progressValue}%` }}
                    >
                      {progressValue}%
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-blue-800" /> Attachments
                  </h3>

                  {task?.attachments?.length ? (
                    <ul className="space-y-2 text-sm">
                      {task.attachments.map((file, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 hover:bg-blue-50 transition-all"
                        >
                          <Paperclip className="w-4 h-4 text-blue-500" />
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-800 hover:text-blue-900 hover:underline truncate"
                          >
                            {file.label || file.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No Attachments found.
                    </p>
                  )}
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Due Date"
                    type="date"
                    value={
                      editPayload.dueDate
                        ? new Date(editPayload.dueDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditPayload((p) => ({
                        ...p,
                        dueDate: e.target.value,
                      }))
                    }
                    disabled={mode !== "update"}
                  />
                  <DropdownField
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={editPayload.priority || "Medium"}
                    onChange={(e) =>
                      setEditPayload((p) => ({
                        ...p,
                        priority: e.target.value,
                      }))
                    }
                    disabled={mode !== "update"}
                  />
                </div>
              </section>

              {/* Metadata */}
              <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-sm space-y-2">
                <MetaRow
                  icon={<User className="w-4 h-4 text-blue-800" />}
                  label="Creator"
                  value={task?.createdBy?.email || "Unknown"}
                />
                <MetaRow
                  icon={<User className="w-4 h-4 text-blue-800" />}
                  label="Assignee"
                  value={task?.assignee?.email || "Unassigned"}
                />
                <MetaRow
                  icon={<Clock className="w-4 h-4 text-blue-800" />}
                  label="Created At"
                  value={new Date(task?.createdAt).toLocaleString()}
                />
                <MetaRow
                  icon={<Clock className="w-4 h-4 text-blue-800" />}
                  label="Updated At"
                  value={new Date(task?.updatedAt).toLocaleString()}
                />
              </section>

              {/* Status */}
              <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Flag className="w-4 h-4 text-blue-800" /> Status
                </h3>
                <DropdownField
                  options={STATUS_OPTIONS}
                  value={editPayload.status || "To Do"}
                  onChange={(e) =>
                    setEditPayload((p) => ({
                      ...p,
                      status: e.target.value,
                    }))
                  }
                  disabled={mode !== "status"}
                />
              </section>

              {/* Activity */}
              <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <MessageSquarePlus className="w-4 h-4 text-blue-800" />{" "}
                  Activity
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {task?.activity?.length ? (
                    task.activity.map((a, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 p-3 rounded-md border border-gray-100"
                      >
                        <p className="text-sm text-gray-700">{a.text}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {a.user?.email} •{" "}
                          {new Date(a.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No activity yet.</p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-200 rounded-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                  <button
                    onClick={handleAddActivity}
                    className="bg-blue-800 text-white px-3 py-2 rounded-full hover:bg-blue-900 text-sm cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </section>

              {/* Actions */}
              {isCreator && (
                <section className="flex flex-wrap justify-between gap-3 pt-3">
                  {mode !== "update" && mode !== "status" && (
                    <>
                      <button
                        onClick={() => setMode("update")}
                        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-green-800 text-white hover:bg-green-900 cursor-pointer"
                      >
                        <Edit3 className="text-white" size={16} /> Update Task
                      </button>
                      <button
                        onClick={() => setMode("status")}
                        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-blue-800 text-white hover:bg-blue-900 cursor-pointer"
                      >
                        <Flag className="text-white" size={16} /> Change Status
                      </button>
                    </>
                  )}

                  {mode === "update" && (
                    <button
                      onClick={handleSaveUpdate}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-green-800 text-white hover:bg-green-900 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="text-white" size={16} /> Save Update
                        </>
                      )}
                    </button>
                  )}

                  {mode === "status" && (
                    <button
                      onClick={handleChangeStatus}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-green-800 text-white hover:bg-green-900 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="text-white" size={16} /> Save Status
                        </>
                      )}
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => setConfirming(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-red-800 text-white hover:bg-red-900 cursor-pointer transition-all shadow-sm"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </div>
      {/* Confirmation modal */}
      {confirming && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]"
          onClick={() => setConfirming(false)} // Click outside closes only modal
        >
          <div
            onClick={(e) => e.stopPropagation()} // Prevent sidebar close
            className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-sm animate-fade-in"
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Trash2 className="text-red-800" size={18} /> Confirm Deletion
            </h2>
            <p className="text-sm text-gray-800 mt-2">
              Are you sure you want to permanently delete this task? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                }}
                disabled={loading}
                className="px-3 py-2 text-sm cursor-pointer rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm();
                }}
                disabled={loading}
                className="flex items-center cursor-pointer gap-2 px-3 py-2 text-sm rounded-md bg-red-800 text-white hover:bg-red-900 transition disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Helper Components --- */
function MetaRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-gray-600">
      <div className="flex items-center gap-2 font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <span className="truncate text-sm">{value}</span>
    </div>
  );
}

function InputField({ label, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 ${
          disabled ? "opacity-100 cursor-not-allowed select-none" : "bg-white"
        }`}
      />
    </div>
  );
}

function TextareaField({ label, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        rows={4}
        {...props}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 ${
          disabled ? "opacity-100 cursor-not-allowed select-none" : "bg-white"
        }`}
      />
    </div>
  );
}

function DropdownField({ label, options, disabled, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          disabled={disabled}
          className={`w-full border rounded-lg px-3 py-2 text-sm appearance-none focus:ring-2 focus:ring-blue-600 ${
            disabled ? "opacity-100 cursor-not-allowed select-none" : "bg-white"
          }`}
        >
          {options.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

/* --- Toast Notification --- */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `
    fixed bottom-6 right-6 px-4 py-2 rounded-md text-white shadow-lg
    ${type === "success" ? "bg-green-700" : "bg-red-700"}
    animate-fade-in
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}
