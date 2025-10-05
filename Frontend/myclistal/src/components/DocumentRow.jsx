// src/components/DocumentRow.jsx
import React from "react";
import { Eye, Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000";

export default function DocumentRow({ doc }) {
  const { user } = useAuth();
  const token = user?.token; // ✅ Properly access token

  const uploadedDate = doc.uploadedDate
    ? new Date(doc.uploadedDate).toISOString().slice(0, 10)
    : "";

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Not authenticated. Please log in again.");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/document/${doc._id}/preview`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const fileURL = URL.createObjectURL(res.data);
      window.open(fileURL, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Preview failed:", err);
      alert("Unable to preview document.");
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Not authenticated. Please log in again.");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/document/${doc._id}/download`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Unable to download document.");
    }
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 border">
            <span className="text-base">{doc.type === "Image" ? "🖼️" : "📄"}</span>
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800 hover:text-blue-600 transition-colors">
              {doc.name}
            </div>
            <div className="text-base text-gray-800">{doc.uploadedBy?.email}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-base text-gray-800">{doc.type}</td>
      <td className="px-6 py-4 text-base text-gray-800">{uploadedDate}</td>
      <td className="px-6 py-4 text-base text-gray-800">{doc.size}</td>
      <td className="px-6 py-4">
        <StatusBadge status={doc.status} />
      </td>

      <td className="px-6 py-4 text-right">
        <div className="inline-flex items-center gap-2">
          <button
            aria-label="Preview document"
            onClick={handlePreview}
            title="Preview document"
            className="p-2 hover:bg-gray-200 rounded-md cursor-pointer transition"
          >
            <Eye size={18} />
          </button>
          <button
            aria-label="Download document"
            onClick={handleDownload}
            title="Download document"
            className="p-2 hover:bg-gray-200 rounded-md cursor-pointer transition"
          >
            <Download size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
