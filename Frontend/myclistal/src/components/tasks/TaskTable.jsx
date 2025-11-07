// src/components/tasks/TaskTable.jsx
import React, { useEffect, useState } from "react";
import { listTasks } from "../../api/tasks";
import { useAuth } from "../../contexts/AuthContext";
import Pagination from "../Pagination";
import { User, Flag, Search, Eye } from "lucide-react";

export default function TaskTable({ onOpenTask }) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);

  // Fetch tasks from API
  async function fetchList() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listTasks(
        { page, limit: 10, q, status, priority },
        token
      );
      setTasks(res?.data || []);
      setMeta(res?.meta || {});
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount + when filters change
  useEffect(() => {
    const delay = setTimeout(fetchList, 400); // debounce for smooth search/filter
    return () => clearTimeout(delay);
  }, [page, q, status, priority, token]);

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 10)) || 1;

  // Helper: calculate days left
  const calcDaysLeft = (dueDate) => {
    if (!dueDate) return "-";
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "0 days left";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search by title or keywords..."
            className="w-full border border-gray-300 rounded-full pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 w-full md:w-auto"
        >
          <option value="">All Status</option>
          <option>To Do</option>
          <option>In Progress</option>
          <option>Under Review</option>
          <option>Completed</option>
          <option>Overdue</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priority}
          onChange={(e) => {
            setPage(1);
            setPriority(e.target.value);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 w-full md:w-auto"
        >
          <option value="">All Priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide border-b">
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Creator</th>
              <th className="p-3 text-left">Assignee</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Days Left</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  Loading tasks...
                </td>
              </tr>
            )}

            {!loading && tasks.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No tasks found.
                </td>
              </tr>
            )}

            {!loading &&
              tasks.map((t) => (
                <tr
                  key={t._id}
                  className="border-b hover:bg-gray-50 transition-all"
                >
                  <td className="p-3 max-w-[180px] truncate font-medium text-gray-800">
                    {t.title}
                  </td>

                  <td className="p-3 text-gray-600">
                    {t.createdBy?.email
                      ? t.createdBy.email.length > 18
                        ? t.createdBy.email.slice(0, 18) + "..."
                        : t.createdBy.email
                      : "-"}
                  </td>

                  <td className="p-3 text-gray-600 flex items-center gap-1.5">
                    <span>
                      {t.assignee?.email
                        ? t.assignee.email.length > 18
                          ? t.assignee.email.slice(0, 18) + "..."
                          : t.assignee.email
                        : "Unassigned"}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : t.status === "In Progress"
                          ? "bg-blue-100 text-blue-700"
                          : t.status === "Under Review"
                          ? "bg-yellow-100 text-yellow-700"
                          : t.status === "Overdue"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {t.status || "-"}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Flag
                        className={`w-3.5 h-3.5 ${
                          t.priority === "High"
                            ? "text-red-500"
                            : t.priority === "Medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      />
                      {t.priority || "Normal"}
                    </div>
                  </td>

                  <td className="p-3 text-gray-600">
                    {calcDaysLeft(t.dueDate)}
                  </td>

                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => onOpenTask(t._id)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-all"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tasks.length > 0 && (
        <Pagination
          pagination={{
            page: meta.page || 1,
            totalPages: totalPages,
          }}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}
