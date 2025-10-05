// src/pages/Documents.jsx
import React, { useEffect, useState, useRef } from "react";

import { Card } from "../components/Card";
import DocumentRow from "../components/DocumentRow";
import {
  getMyDocuments,
  getDocumentsSentToMe,
  uploadDocument,
} from "../api/documents";
import { Plus, Upload, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function ClientDocument() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [sentToMe, setSentToMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("uploadedDate-desc");

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState(null);
  const [alert, setAlert] = useState(""); // ✅ Alert message

  // Load documents
  useEffect(() => {
    (async () => {
      await loadDocs();
      await loadSentToMe();
    })();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await getMyDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error("Error loading documents", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSentToMe = async () => {
    try {
      const data = await getDocumentsSentToMe();
      setSentToMe(data || []);
    } catch (err) {
      console.error("Error loading sent-to-me docs", err);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  // ✅ File size validation (5MB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("File Size Limit Exceeded (Max 5 MB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPendingFile(file);
  };

  // ✅ Animated alert function
  const showAlert = (message) => {
    setAlert(message);
    setTimeout(() => setAlert(""), 3000);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setProgress(0);

    try {
      const ext = pendingFile.name.split(".").pop().toLowerCase();
      let type = "PDF";
      if (["xls", "xlsx"].includes(ext)) type = "Excel";
      if (["doc", "docx"].includes(ext)) type = "Word";
      if (["jpg", "jpeg", "png", "gif"].includes(ext)) type = "Image";

      await uploadDocument({
        file: pendingFile,
        type,
        onUploadProgress: (ev) => {
          if (ev.total)
            setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });

      await loadDocs();
      showAlert("File Uploaded Successfully");
    } catch (err) {
      console.error("Upload failed", err);
      showAlert("Upload Failed — Try Again");
    } finally {
      setUploading(false);
      setProgress(0);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const discardUpload = () => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Common filtering and sorting logic
  const applyFilters = (docs) => {
    return docs
      .filter((d) => (filterType === "All" ? true : d.type === filterType))
      .filter((d) =>
        filterStatus === "All" ? true : d.status === filterStatus
      )
      .sort((a, b) => {
        const [key, dir] = sortBy.split("-");
        const av = a[key] ? new Date(a[key]).getTime() : 0;
        const bv = b[key] ? new Date(b[key]).getTime() : 0;
        return dir === "desc" ? bv - av : av - bv;
      });
  };

  const filteredMyDocs = applyFilters(documents);
  const filteredSentToMe = applyFilters(sentToMe);

  return (
    <div className="flex font-inter text-gray-800">

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        <main className="p-6 min-h-screen">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Documents Dashboard
              </h1>
              <p className="text-gray-600 text-base mt-1">
                Manage and upload all your important client documents
              </p>
            </div>

            {alert && (
              <div className="fixed top-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn z-50">
                <AlertCircle size={20} />
                <span className="font-medium text-base">{alert}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={openFilePicker}
                className="inline-flex items-center gap-2 bg-blue-800 cursor-pointer text-white px-5 py-3 rounded-lg shadow-md text-base font-semibold hover:bg-blue-900 transition-all"
              >
                <Plus size={18} /> Upload Document
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Filters */}
          <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              Filter Documents
            </h2>
            <div className="flex flex-col lg:flex-row gap-5 lg:items-center">
              {/* Type */}
              <div className="flex items-center gap-3">
                <label className="text-base font-medium text-gray-700">
                  Type:
                </label>
                <select
                  className="border-2 rounded-sm px-2 py-1 text-base cursor-pointer focus:ring-blue-800 focus:border-blue-800"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option>All</option>
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>Word</option>
                  <option>Image</option>
                  <option>Invoice</option>
                  <option>Policy</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="text-base font-medium text-gray-700">
                  Status:
                </label>
                <select
                  className="border-2 rounded-sm px-2 py-1 text-base cursor-pointer focus:ring-blue-800 focus:border-blue-800"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option>All</option>
                  <option>Approved</option>
                  <option>Pending Review</option>
                  <option>Needs Signature</option>
                  <option>Draft</option>
                </select>
              </div>

              {/* Sort */}
              <div className="ml-auto flex items-center gap-3">
                <label className="text-base font-medium text-gray-700">
                  Sort By:
                </label>
                <select
                  className="border-2 rounded-sm px-2 py-1 text-base cursor-pointer focus:ring-blue-800 focus:border-blue-800"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="uploadedDate-desc">Newest First</option>
                  <option value="uploadedDate-asc">Oldest First</option>
                </select>
              </div>
            </div>
          </section>

          {/* My Documents */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              My Uploaded Documents
            </h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead>
                    <tr className="text-left text-gray-600 uppercase text-base tracking-wider border-b">
                      <th className="px-6 py-3">Document Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Uploaded Date</th>
                      <th className="px-6 py-3">Size</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Loading documents…
                        </td>
                      </tr>
                    ) : filteredMyDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No documents found.
                        </td>
                      </tr>
                    ) : (
                      filteredMyDocs.map((doc) => (
                        <DocumentRow key={doc._id} doc={doc} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* ✅ Sent To Me Section (Always visible) */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sent To Me
            </h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead>
                    <tr className="text-left text-gray-800 uppercase text-base tracking-wider border-b">
                      <th className="px-6 py-3">Document Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Uploaded Date</th>
                      <th className="px-6 py-3">Size</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Loading documents…
                        </td>
                      </tr>
                    ) : filteredSentToMe.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No documents found.
                        </td>
                      </tr>
                    ) : (
                      filteredSentToMe.map((d) => (
                        <DocumentRow key={d._id} doc={d} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </main>
      </div>

      {/* Upload Confirmation Modal */}
      {pendingFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="text-blue-700" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">
                Confirm Upload
              </h3>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Do you want to upload{" "}
              <span className="font-medium">{pendingFile.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={discardUpload}
                className="inline-flex text-lg cursor-pointer items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition"
              >
                <XCircle size={16} /> Discard
              </button>
              <button
                onClick={confirmUpload}
                className="inline-flex text-lg cursor-pointer items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Upload size={16} /> Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Bubble */}
      {uploading && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg p-4 shadow-lg w-72 animate-fadeIn">
          <div className="text-base font-medium text-gray-700 mb-2">
            Uploading {progress}%
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
