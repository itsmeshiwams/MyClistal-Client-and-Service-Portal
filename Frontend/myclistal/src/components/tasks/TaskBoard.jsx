// src/components/tasks/TaskBoard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { listTasks, changeStatus } from "../../api/tasks";
import TaskCard from "./TaskCard";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const COLUMNS = [
  { key: "To Do", title: "To Do", icon: ClipboardList, color: "text-gray-600" },
  { key: "In Progress", title: "In Progress", icon: Loader2, color: "text-blue-600" },
  { key: "Under Review", title: "Under Review", icon: Clock, color: "text-yellow-600" },
  { key: "Completed", title: "Completed", icon: CheckCircle2, color: "text-green-600" },
  { key: "Overdue", title: "Overdue", icon: AlertTriangle, color: "text-red-600" },
];

export default function TaskBoard({ onOpenTask }) {
  const { token } = useAuth();
  const socket = useSocket();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOverCol, setDragOverCol] = useState(null);

  /** Fetch All Tasks **/
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTasks({ limit: 200 }, token);
      setTasks(res?.data || []);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /** Group Tasks by Status **/
  const groupedColumns = useMemo(() => {
    const grouped = {};
    COLUMNS.forEach(col => (grouped[col.key] = []));
    tasks.forEach(task => {
      const status = COLUMNS.some(c => c.key === task.status)
        ? task.status
        : "To Do";
      grouped[status].push(task);
    });
    return grouped;
  }, [tasks]);

  /** Initial + Socket-based Reload **/
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!socket) return;
    let timeout;
    const handleUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(fetchTasks, 300);
    };

    const events = [
      "task:status_changed",
      "task:assigned",
      "task:activity_added",
      "task:deleted",
    ];
    events.forEach(ev => socket.on(ev, handleUpdate));

    return () => {
      clearTimeout(timeout);
      events.forEach(ev => socket.off(ev, handleUpdate));
    };
  }, [socket, fetchTasks]);

  /** Drag & Drop **/
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    setDragOverCol(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, columnKey) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    setTasks(prev => prev.map(t => (t._id === taskId ? { ...t, status: columnKey } : t)));

    try {
      await changeStatus(taskId, columnKey, token);
    } catch (err) {
      console.error("Status update failed:", err);
      fetchTasks();
    } finally {
      setDragOverCol(null);
    }
  };

  /** Render **/
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-5 overflow-x-auto pb-8">
      {COLUMNS.map(col => {
        const Icon = col.icon;
        const columnTasks = groupedColumns[col.key] || [];
        const isActive = dragOverCol === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`rounded-2xl p-4 bg-white shadow-md border transition-all duration-200 
              ${isActive ? "border-blue-500 ring-2 ring-blue-100 scale-[1.01]" : "border-gray-100"}
              flex flex-col min-h-[400px]`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${col.color}`} />
                <h3 className="font-semibold text-gray-800 tracking-wide">{col.title}</h3>
              </div>
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto custom-scroll pr-1">
              {loading ? (
                <div className="text-sm text-gray-500 text-center mt-4">Loading tasks...</div>
              ) : columnTasks.length > 0 ? (
                columnTasks.map(task => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    className="cursor-grab active:cursor-grabbing transition-transform hover:scale-[1.02]"
                  >
                    <TaskCard task={task} onClick={onOpenTask} />
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 text-center italic py-6 border border-dashed border-gray-200 rounded-md">
                  No tasks yet
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
