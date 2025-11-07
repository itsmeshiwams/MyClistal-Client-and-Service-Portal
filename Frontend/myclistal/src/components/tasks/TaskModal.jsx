// src/components/tasks/TaskModal.jsx
import React, { useState, useEffect } from "react";
import { createTask, updateTask } from "../../api/tasks";
import { useAuth } from "../../contexts/AuthContext";
import { X, Loader2, Paperclip, UserPlus } from "lucide-react";

export default function TaskModal({ open, onClose, existing, onSaved }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    priority: "Medium",
    attachments: [],
    metadata: {},
  });

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Reset form when opening or switching between edit/create mode
  useEffect(() => {
    setForm(
      existing || {
        title: "",
        description: "",
        assignee: "",
        dueDate: "",
        priority: "Medium",
        attachments: [],
        metadata: {},
      }
    );
  }, [existing]);

  // 🔍 Search users for assignee
  useEffect(() => {
    if (!userQuery.trim() || !token) return;
    const timeout = setTimeout(async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5001"}/calendar/users?search=${encodeURIComponent(
            userQuery
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setUserResults(data?.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [userQuery, token]);

  // 📎 Add new attachment
  const addAttachment = () =>
    setForm({
      ...form,
      attachments: [...form.attachments, { label: "", url: "" }],
    });

  // 📎 Update attachment field
  const updateAttachment = (idx, key, value) => {
    const updated = [...form.attachments];
    updated[idx][key] = value;
    setForm({ ...form, attachments: updated });
  };

  // 🗑 Remove attachment
  const removeAttachment = (idx) => {
    setForm({
      ...form,
      attachments: form.attachments.filter((_, i) => i !== idx),
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) return;
    try {
      if (existing?._id) {
        await updateTask(existing._id, form, token);
      } else {
        await createTask(form, token);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Error saving task:", err);
      alert("Failed to save task. Try again.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 transition-all">
      <form
        onSubmit={handleSubmit}
        className="bg-white relative p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-semibold mb-6 text-gray-800">
          {existing?._id ? "Edit Task" : "Create New Task"}
        </h3>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter task title"
            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Describe the task..."
            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none transition"
          />
        </div>

        {/* Assignee Search */}
        <div className="mb-5 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to
          </label>
          <div className="relative">
            <input
              type="text"
              value={
                userResults.find((u) => u.id === form.assignee)?.email ||
                userQuery
              }
              onChange={(e) => {
                setUserQuery(e.target.value);
                setForm({ ...form, assignee: "" });
              }}
              placeholder="Search user by email..."
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition pr-10"
            />
            <UserPlus className="absolute right-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>

          {loadingUsers && (
            <div className="absolute top-full left-0 bg-white border rounded-lg shadow-md mt-1 w-full text-sm text-gray-500 p-2 flex items-center gap-2">
              <Loader2 className="animate-spin w-4 h-4" /> Searching...
            </div>
          )}

          {userQuery && userResults.length > 0 && !form.assignee && (
            <ul className="absolute top-full left-0 bg-white border rounded-lg shadow-md mt-1 w-full max-h-48 overflow-y-auto z-20">
              {userResults.map((u) => (
                <li
                  key={u.id}
                  onClick={() => {
                    setForm({ ...form, assignee: u.id });
                    setUserQuery(u.email);
                    setUserResults([]);
                  }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 transition"
                >
                  <span className="font-medium">{u.email}</span>{" "}
                  <span className="text-gray-400 text-xs">({u.role})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date & Priority */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={form.dueDate ? form.dueDate.split("T")[0] : ""}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition cursor-pointer"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Attachments
            </label>
            <button
              type="button"
              onClick={addAttachment}
              className="text-blue-700 text-sm font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <Paperclip size={14} /> Add
            </button>
          </div>
          {form.attachments.map((att, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input
                type="text"
                placeholder="Label"
                value={att.label}
                onChange={(e) => updateAttachment(i, "label", e.target.value)}
                className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-600 transition"
              />
              <input
                type="url"
                placeholder="URL"
                value={att.url}
                onChange={(e) => updateAttachment(i, "url", e.target.value)}
                className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-600 transition"
              />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-red-600 hover:text-red-800 font-semibold text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-900 transition-all cursor-pointer"
          >
            {existing?._id ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
