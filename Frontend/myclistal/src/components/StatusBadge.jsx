// src/components/StatusBadge.jsx
import React from "react";

const styles = {
  Approved: "bg-green-100 text-green-700 border border-green-300",
  "Pending Review": "bg-orange-100 text-orange-700 border border-orange-300",
  "Needs Signature": "bg-red-100 text-red-700 border border-red-300",
  Draft: "bg-gray-100 text-gray-700 border border-gray-300",
  Completed: "bg-blue-100 text-blue-700 border border-blue-300",
  Archived: "bg-gray-50 text-gray-500 border border-gray-200",
};

export default function StatusBadge({ status = "Pending Review" }) {
  const cls = styles[status] || "bg-gray-100 text-gray-700 border";
  return (
    <span
      className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${cls} tracking-wide`}
      data-testid="status-badge"
    >
      {status}
    </span>
  );
}
