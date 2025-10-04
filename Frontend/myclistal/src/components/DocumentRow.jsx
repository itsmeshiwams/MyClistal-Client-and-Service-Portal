// src/components/DocumentRow.jsx
import React from "react";
import { Eye, Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { previewUrl, downloadUrl } from "../api/documents";

/**
 * DocumentRow - table row for a document
 */
export default function DocumentRow({ doc, onPreview }) {
  const uploadedDate = doc.uploadedDate
    ? new Date(doc.uploadedDate).toISOString().slice(0, 10)
    : "";

  const handlePreview = (e) => {
    e.preventDefault();
    if (onPreview) return onPreview(doc);
    window.open(previewUrl(doc._id), "_blank", "noopener,noreferrer");
  };

  const handleDownload = (e) => {
    e.preventDefault();
    window.open(downloadUrl(doc._id), "_blank", "noopener,noreferrer");
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 border">
            <span className="text-lg">{doc.type === "Image" ? "🖼️" : "📄"}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors">
              {doc.name}
            </div>
            <div className="text-xs text-gray-500">{doc.uploadedBy?.email}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{uploadedDate}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{doc.size}</td>
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
            <Eye size={18}  />
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
