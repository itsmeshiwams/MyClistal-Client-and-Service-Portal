// src/components/tasks/TaskCard.jsx
import React from "react";
import { Calendar, User, Clock } from "lucide-react";

export default function TaskCard({ task, onClick }) {
  const { title, assignee, createdBy, dueDate, progress = 0, _id } = task;

  // Calculate days left
  const daysLeft = (() => {
    if (!dueDate) return "No due date";
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "0 days left";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  })();

  // Format date
  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No due date";

  // Progress percentage (safe bounds)
  const progressValue = Math.min(100, Math.max(0, progress));

  return (
    <div
      draggable
      onClick={() => onClick(_id)}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all duration-200 transform hover:-translate-y-[2px] mb-3 p-4"
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h4
          className="font-semibold text-gray-800 leading-snug text-[15px] group-hover:text-blue-700 transition-colors line-clamp-2 break-words"
          title={title}
        >
          {title}
        </h4>
      </div>

      {/* Assignee & Creator */}
      <div className="mt-3 text-sm text-gray-600 flex flex-col gap-1">
        {assignee?.email && (
          <div className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span
              className="truncate text-gray-700"
              title={`Assignee: ${assignee.email}`}
            >
              {assignee.email}
            </span>
          </div>
        )}
        {createdBy?.email && (
          <div className="flex items-center gap-2 truncate">
            
            <span
              className="truncate text-gray-500 text-xs"
              title={`Created by: ${createdBy.email}`}
            >
              from : {createdBy.email}
            </span>
          </div>
        )}
      </div>

      {/* Due date, progress bar & days left */}
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-[11px] text-gray-500">
            <span>{progressValue}%</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              {daysLeft}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
