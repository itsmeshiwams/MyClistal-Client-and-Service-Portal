// src/pages/ClientDocument.jsx
import React, { useEffect, useState, useRef } from "react";
import { Card } from "../components/Card";
import DocumentRow from "../components/DocumentRow";
import {
  getMyDocuments,
  getDocumentsSentToMe,
  uploadDocument,
} from "../api/documents";
import { Plus, AlertCircle, Search, Upload, XCircle } from "lucide-react";
import Pagination from "../components/Pagination";
import { useAuth } from "../contexts/AuthContext";

const TYPE_OPTIONS = [
  "PDF",
  "Excel",
  "Word",
  "Image",
  "Report",
  "Policy",
  "Invoice",
  "Tax Form",
];
const STATUS_OPTIONS = [
  "Approved",
  "Pending Review",
  "Needs Signature",
  "Draft",
  "Completed",
  "Archived",
];

// ------------------ FILTER SECTION ------------------
const FilterSection = ({
  search,
  setSearch,
  selectedTypes,
  toggleType,
  selectedStatuses,
  toggleStatus,
  sortDate,
  setSortDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => (
  <div className="bg-white shadow-md rounded-2xl p-5 mb-6 border border-gray-100">
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-1/3 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-800 hover:shadow-sm">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search by name or client email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-base font-medium text-gray-900">Type:</span>
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`px-3 py-1 rounded-full text-base font-medium cursor-pointer transition-all border ${
              selectedTypes.includes(t)
                ? " border-blue-800 text-white bg-blue-800"
                : "border-none shadow-sm text-gray-800 hover:border-2 hover:border-blue-800 bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-base font-medium text-gray-700">Status:</span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`px-3 py-1 rounded-full text-base font-medium cursor-pointer transition-all border ${
              selectedStatuses.includes(s)
                ? " border-blue-800 text-white bg-blue-800"
                : "border-none shadow-sm text-gray-800 hover:border-2 hover:border-blue-800 bg-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-base font-medium text-gray-900">Sort:</label>
        <select
          value={sortDate}
          onChange={(e) => setSortDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer bg-white hover:border-blue-800 focus:ring-2 focus:ring-blue-900 transition-all"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl hover:border-blue-800 transition-all">
        <label className="text-sm font-medium text-gray-700">From:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition-all"
        />
        <label className="text-sm font-medium text-gray-700">To:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm cursor-pointer focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition-all"
        />
      </div>
    </div>
  </div>
);

export default function ClientDocument() {
  const { user } = useAuth();

  // ------------------ MY DOCUMENT STATES ------------------
  const [myDocs, setMyDocs] = useState([]);
  const [mySearch, setMySearch] = useState("");
  const [mySelectedTypes, setMySelectedTypes] = useState([]);
  const [mySelectedStatuses, setMySelectedStatuses] = useState([]);
  const [mySortDate, setMySortDate] = useState("newest");
  const [myStartDate, setMyStartDate] = useState("");
  const [myEndDate, setMyEndDate] = useState("");
  const [myPage, setMyPage] = useState(1);
  const [myPagination, setMyPagination] = useState({
    totalPages: 1,
    totalDocuments: 0,
  });
  const [loadingMyDocs, setLoadingMyDocs] = useState(false);

  // ------------------ SENT TO ME STATES ------------------
  const [sentDocs, setSentDocs] = useState([]);
  const [sentSearch, setSentSearch] = useState("");
  const [sentSelectedTypes, setSentSelectedTypes] = useState([]);
  const [sentSelectedStatuses, setSentSelectedStatuses] = useState([]);
  const [sentSortDate, setSentSortDate] = useState("newest");
  const [sentStartDate, setSentStartDate] = useState("");
  const [sentEndDate, setSentEndDate] = useState("");
  const [sentPage, setSentPage] = useState(1);
  const [sentPagination, setSentPagination] = useState({
    totalPages: 1,
    totalDocuments: 0,
  });
  const [loadingSentDocs, setLoadingSentDocs] = useState(false);

  // ------------------ UPLOAD STATES ------------------
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState(null);
  const [alert, setAlert] = useState("");
  // Debounced search states
  const [debouncedMySearch, setDebouncedMySearch] = useState(mySearch);
  const [debouncedSentSearch, setDebouncedSentSearch] = useState(sentSearch);

  // ------------------ FETCH FUNCTIONS ------------------
  const loadMyDocs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No token found. Skipping document load.");
      setMyDocs([]);
      setSentDocs([]);
      return;
    }

    setLoadingMyDocs(true);
    try {
      const params = {
        search: mySearch,
        types: mySelectedTypes, // ✅ note plural keys
        statuses: mySelectedStatuses,
        sortDate: mySortDate,
        startDate: myStartDate,
        endDate: myEndDate,
        page: myPage,
        limit: 10,
      };
      const res = await getMyDocuments(params);
      setMyDocs(res.data || []);
      setMyPagination({
        totalPages: res.pagination.totalPages || 1,
        totalDocuments: res.pagination.totalDocuments || 0,
        page: res.pagination.currentPage || 1,
      });
    } catch (err) {
      console.error("❌ Error loading my documents:", err);
    } finally {
      setLoadingMyDocs(false);
    }
  };

  const loadSentDocs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No token found. Skipping document load.");
      setMyDocs([]);
      setSentDocs([]);
      return;
    }

    setLoadingSentDocs(true);
    try {
      const params = {
        search: sentSearch,
        types: sentSelectedTypes,
        statuses: sentSelectedStatuses,
        sortDate: sentSortDate,
        startDate: sentStartDate,
        endDate: sentEndDate,
        page: sentPage,
        limit: 10,
      };
      const res = await getDocumentsSentToMe(params);
      setSentDocs(res.data || []);
      setSentPagination({
        totalPages: res.pagination.totalPages || 1,
        totalDocuments: res.pagination.totalDocuments || 0,
        page: res.pagination.currentPage || 1,
      });
    } catch (err) {
      console.error("❌ Error loading sent documents:", err);
    } finally {
      setLoadingSentDocs(false);
    }
  };

  // ------------------ AUTO REFRESH ------------------
  // Reset page when filters change
  // Debounce My Search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedMySearch(mySearch), 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [mySearch]);

  // Debounce Sent Search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSentSearch(sentSearch), 500);
    return () => clearTimeout(handler);
  }, [sentSearch]);

  useEffect(() => {
    setMyPage(1);
  }, [
    debouncedMySearch, // ✅ use debounced search
    mySelectedTypes,
    mySelectedStatuses,
    mySortDate,
    myStartDate,
    myEndDate,
  ]);

  useEffect(() => {
    setSentPage(1);
  }, [
    debouncedSentSearch, // ✅ use debounced search
    sentSelectedTypes,
    sentSelectedStatuses,
    sentSortDate,
    sentStartDate,
    sentEndDate,
  ]);

  // Fetch data when filters or page change
  useEffect(() => {
    loadMyDocs();
  }, [
    debouncedMySearch,
    mySelectedTypes,
    mySelectedStatuses,
    mySortDate,
    myStartDate,
    myEndDate,
    myPage,
  ]);

  useEffect(() => {
    loadSentDocs();
  }, [
    debouncedSentSearch,
    sentSelectedTypes,
    sentSelectedStatuses,
    sentSortDate,
    sentStartDate,
    sentEndDate,
    sentPage,
  ]);

  // ------------------ UPLOAD HANDLERS ------------------
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert("File Size Limit Exceeded (Max 5 MB)");
      fileInputRef.current.value = "";
      return;
    }
    setPendingFile(file);
  };
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
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });
      await loadMyDocs();
      showAlert("File Uploaded Successfully");
    } catch (err) {
      console.error("Upload failed", err);
      showAlert("Upload Failed — Try Again");
    } finally {
      setUploading(false);
      setProgress(0);
      setPendingFile(null);
      fileInputRef.current.value = "";
    }
  };
  const discardUpload = () => {
    setPendingFile(null);
    fileInputRef.current.value = "";
  };

  // ------------------ FILTER TAG HANDLERS ------------------
  const toggleFilter = (value, setFunc) => {
    setFunc((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // ------------------ MAIN RENDER ------------------
  return (
    <div className="flex font-inter text-gray-800">
      <div className="flex-1 flex flex-col">
        <main className="p-6 min-h-screen ">
          {/* HEADER */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Documents Dashboard
              </h1>
              <p className="text-gray-600 text-base mt-1">
                Manage, search, and organize all your important documents
              </p>
            </div>

            {alert && (
              <div className="fixed top-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn z-50">
                <AlertCircle size={20} />
                <span className="font-medium text-base">{alert}</span>
              </div>
            )}

            <button
              onClick={openFilePicker}
              className="inline-flex items-center gap-2 bg-blue-800 text-white px-5 py-3 rounded-lg shadow-md text-base font-semibold hover:bg-blue-900 transition-all cursor-pointer"
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

          {/* MY DOCUMENTS */}
          <div>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                My Uploaded Documents ({myPagination.totalDocuments})
              </h2>
              <FilterSection
                search={mySearch}
                setSearch={setMySearch}
                selectedTypes={mySelectedTypes}
                toggleType={(t) => toggleFilter(t, setMySelectedTypes)}
                selectedStatuses={mySelectedStatuses}
                toggleStatus={(s) => toggleFilter(s, setMySelectedStatuses)}
                sortDate={mySortDate}
                setSortDate={setMySortDate}
                startDate={myStartDate}
                setStartDate={setMyStartDate}
                endDate={myEndDate}
                setEndDate={setMyEndDate}
              />
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr className="text-left text-gray-600 uppercase text-sm tracking-wider border-b">
                        <th className="px-6 py-3">Document Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Uploaded Date</th>
                        <th className="px-6 py-3">Size</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMyDocs ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            Loading documents…
                          </td>
                        </tr>
                      ) : myDocs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            No documents found.
                          </td>
                        </tr>
                      ) : (
                        myDocs.map((doc) => (
                          <DocumentRow key={doc._id} doc={doc} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  pagination={{
                    page: myPagination.page,
                    totalPages: myPagination.totalPages,
                  }}
                  onPageChange={(newPage) => setMyPage(newPage)}
                />
              </Card>
            </section>

            {/* SENT TO ME */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sent To Me ({sentPagination.totalDocuments})
              </h2>
              <FilterSection
                search={sentSearch}
                setSearch={setSentSearch}
                selectedTypes={sentSelectedTypes}
                toggleType={(t) => toggleFilter(t, setSentSelectedTypes)}
                selectedStatuses={sentSelectedStatuses}
                toggleStatus={(s) => toggleFilter(s, setSentSelectedStatuses)}
                sortDate={sentSortDate}
                setSortDate={setSentSortDate}
                startDate={sentStartDate}
                setStartDate={setSentStartDate}
                endDate={sentEndDate}
                setEndDate={setSentEndDate}
              />
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr className="text-left text-gray-600 uppercase text-sm tracking-wider border-b">
                        <th className="px-6 py-3">Document Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Uploaded Date</th>
                        <th className="px-6 py-3">Size</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingSentDocs ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            Loading documents…
                          </td>
                        </tr>
                      ) : sentDocs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            No documents found.
                          </td>
                        </tr>
                      ) : (
                        sentDocs.map((doc) => (
                          <DocumentRow key={doc._id} doc={doc} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  pagination={{
                    page: sentPagination.page,
                    totalPages: sentPagination.totalPages,
                  }}
                  onPageChange={(newPage) => setSentPage(newPage)}
                />
              </Card>
            </section>
          </div>
        </main>
      </div>

      {/* UPLOAD MODAL */}
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
                className="inline-flex text-lg items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition cursor-pointer"
              >
                <XCircle size={16} /> Discard
              </button>
              <button
                onClick={confirmUpload}
                className="inline-flex text-lg items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition cursor-pointer"
              >
                <Upload size={16} /> Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD PROGRESS */}
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
