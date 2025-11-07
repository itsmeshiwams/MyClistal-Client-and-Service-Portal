// src/pages/Tasks.jsx
import React, { useState } from "react";
import NavBar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TaskBoard from "../components/tasks/TaskBoard";
import TaskTable from "../components/tasks/TaskTable";
import TaskModal from "../components/tasks/TaskModal";
import TaskDetailsSidebar from "../components/tasks/TaskDetailsSidebar";
import { useAuth } from "../contexts/AuthContext";
import { Plus, RefreshCcwIcon } from "lucide-react";

export default function TasksPage() {
  const [openModal, setOpenModal] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  function openTask(id) {
    setOpenTaskId(id);
  }
  function closeTask() {
    setOpenTaskId(null);
  }

  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <NavBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Tasks</h1>
              <p className="text-sm text-gray-500">
                Manage tasks, track status and collaborate — unified view for
                client & staff.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className=" cursor-pointer px-3 py-2 rounded-full hover:bg-gray-100 transition hover:scale-105"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <RefreshCcwIcon className="w-5 h-5 text-blue-800" />
              </button>
              <button
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center gap-2 bg-blue-800 text-white px-3 py-2 rounded-lg shadow-md text-base font-semibold hover:bg-blue-900 transition-all cursor-pointer"
              >
                <Plus size={18} /> Add Task
              </button>
            </div>
          </div>

          <section className="mb-4">
            <TaskBoard key={refreshKey} onOpenTask={openTask} />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">All Tasks</h2>
            <TaskTable onOpenTask={openTask} />
          </section>
        </main>
      </div>

      <TaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
      {openTaskId && (
        <TaskDetailsSidebar
          taskId={openTaskId}
          onClose={closeTask}
          onUpdated={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
