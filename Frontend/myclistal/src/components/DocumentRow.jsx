// src/components/DocumentRow.jsx
import React, { useState } from "react";
import { Eye, Download, Edit3, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  previewDocument,
  downloadDocument,
  updateDocumentStatus,
} from "../api/documents";

export default function DocumentRow({ doc, onStatusUpdated }) {
  const { user } = useAuth();
  const token = user?.token;
  const role = user?.role; // 🟢 Added

  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(doc.status);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, type: "", message: "" });

  const uploadedDate = doc.uploadedDate
    ? new Date(doc.uploadedDate).toISOString().slice(0, 10)
    : "";

  // 🟢 Popup alert UI handler
  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    setTimeout(() => setPopup({ show: false, type: "", message: "" }), 2500);
  };

  // 🟣 Preview document
  const handlePreview = async (e) => {
    e.preventDefault();
    if (!token) return showPopup("error", "Not authenticated. Please log in.");
    try {
      await previewDocument(doc._id, token);
    } catch (err) {
      console.error("Preview failed:", err);
      showPopup("error", "Unable to preview document.");
    }
  };

  // 🟡 Download document
  const handleDownload = async (e) => {
    e.preventDefault();
    if (!token) return showPopup("error", "Not authenticated. Please log in.");
    try {
      await downloadDocument(doc._id, doc.name, token);
      showPopup("success", "Download started successfully.");
    } catch (err) {
      console.error("Download failed:", err);
      showPopup("error", "Unable to download document.");
    }
  };

  // 🔵 Change document status
  const handleStatusChange = async () => {
    if (!token) return showPopup("error", "Not authenticated.");
    setLoading(true);

    try {
      await updateDocumentStatus(doc._id, selectedStatus);
      doc.status = selectedStatus;
      showPopup("success", "Document status updated successfully!");
      setShowModal(false);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error("Status update failed:", err);
      showPopup("error", "Failed to update document status.");
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Restrict edit button by role
  const handleEditClick = () => {
    if (role !== "Staff") {
      showPopup("error", "Access denied. Staff only");
      return;
    }
    setShowModal(true);
  };

  const truncatedName =
    doc.name.length > 30 ? doc.name.substring(0, 30) + "..." : doc.name;

  const statuses = [
    "Approved",
    "Pending Review",
    "Needs Signature",
    "Draft",
    "Completed",
    "Archived",
  ];

  return (
    <>
      {/* 🔸 Table Row */}
      <tr className="border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors">
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 border">
              <span className="text-base">
                {doc.type === "Image" ? "🖼️" : "📄"}
              </span>
            </div>
            <div>
              <div
                className="text-base font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                title={doc.name}
              >
                {truncatedName}
              </div>
              <div className="text-base text-gray-800">
                {doc.uploadedByData?.email}
              </div>
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
              onClick={handlePreview}
              title="Preview document"
              className="p-2 hover:bg-gray-200 cursor-pointer rounded-md transition"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={handleDownload}
              title="Download document"
              className="p-2 hover:bg-gray-200 cursor-pointer rounded-md transition"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleEditClick} // ✅ Role check here
              title="Edit Status"
              className={`p-2 rounded-md transition ${
                role === "Staff"
                  ? "hover:bg-gray-200 cursor-pointer"
                  : "hidden"
              }`}
            >
              <Edit3 size={18} />
            </button>
          </div>
        </td>
      </tr>

      {/* 🔸 Modal for changing status */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Change Document Status
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-blue-800 cursor-pointer hover:text-blue-900"
              >
                <X size={20} />
              </button>
            </div>

            <label className="block text-lg font-medium text-gray-800 mb-2">
              Select Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border rounded-md p-2 text-gray-800 cursor-pointer focus:outline-none focus:ring focus:ring-blue-800"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={handleStatusChange}
              disabled={loading}
              className={`mt-5 w-full py-2 rounded-md text-white cursor-pointer font-semibold ${
                loading
                  ? "bg-blue-800 opacity-75 cursor-not-allowed"
                  : "bg-blue-800 hover:bg-blue-900"
              } transition`}
            >
              {loading ? "Updating..." : "Change"}
            </button>
          </div>
        </div>
      )}

      {/* 🔸 Popup Alert */}
      {popup.show && (
        <div
          className={`fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-opacity duration-300 z-[60] ${
            popup.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}
    </>
  );
}
