import { useEffect, useState } from "react";
import {
  Eye,
  Download,
  X,
  CheckCircle2,
  Send,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllDocuments,
  getDashboardStats,
  getRecentActivities,
  sendDocumentToClient,
} from "../../api/documents";
import api from "../../api/api";
import { Card, CardContent } from "../../components/Card";
import DocumentRow from "../../components/DocumentRow";
import RecentActivityRow from "../../components/RecentActivityRow";
import { groupActivities } from "../../utils/activityGrouping";
import Pagination from "../../components/Pagination";
import { useCallback, useMemo } from "react";

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

const ACTION_TYPES = [
  "All",
  "SENT_TO_CLIENT",
  "DOWNLOAD",
  "PREVIEW",
  "UPLOAD",
  "REVIEWED",
  "DELETED",
  "EDITED",
  "STATUS_CHANGE",
];

const TIME_FILTERS = [
  "All",
  "Today",
  "Yesterday",
  "This Week",
  "This Month",
  "This Year",
  "Custom",
];

export default function StaffDashboard() {
  const { token } = useAuth();

  // All Documents

  // Document states
  const [documents, setDocuments] = useState([]);
  const [docPagination, setDocPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  //Documents
  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [sortDate, setSortDate] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Recent Activities
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [activityPagination, setActivityPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  // Stats
  const [stats, setStats] = useState({});

  // Loading
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Send card states
  const [isSendCardOpen, setIsSendCardOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState(TYPE_OPTIONS[0] || "");

  // Confirm modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);

  // Toast
  const [showToast, setShowToast] = useState(false);

  // Error box + shake animation
  const [errorMessage, setErrorMessage] = useState("");
  const [shake, setShake] = useState(false);

  // ✅ Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [docData, statsData, actData] = await Promise.all([
        getAllDocuments({ page: 1 }),
        getDashboardStats(),
        getRecentActivities(1),
      ]);

      console.log("📄 Docs loaded:", docData);

      setDocuments(docData.data);
      setDocPagination(docData.pagination);
      setStats(statsData || {});

      setActivities(actData.data || []);
      setFilteredActivities(actData.data || []);
      setActivityPagination(actData.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load paginated documents
  useEffect(() => {
    fetchDocuments(1);
  }, [search, selectedTypes, selectedStatuses, sortDate, startDate, endDate]);

  const fetchDocuments = async (page = 1) => {
    setLoadingDocs(true);
    try {
      const res = await getAllDocuments({
        page,
        search,
        types: selectedTypes,
        statuses: selectedStatuses,
        sortDate,
        startDate,
        endDate,
      });

      console.log("📑 Fetched documents:", res);

      setDocuments(res.data);
      setDocPagination(res.pagination);
    } catch (err) {
      console.error("❌ Error fetching documents:", err);
      setDocPagination({ page: 1, totalPages: 1 }); // fallback to safe default
    } finally {
      setLoadingDocs(false);
    }
  };

  // Checkbox helpers
  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // ✅ Load activities with filters + pagination (backend handles filtering)
  const loadActivities = async (page = 1) => {
    try {
      const res = await getRecentActivities({
        page,
        type: actionFilter,
        time: timeFilter,
        startDate: customStart,
        endDate: customEnd,
      });

      setActivities(res.data || []);
      setFilteredActivities(res.data || []); // identical for clarity
      setActivityPagination(res.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  // ✅ Reactively fetch activities whenever filters or pagination change
  useEffect(() => {
    loadActivities(1);
  }, [actionFilter, timeFilter, customStart, customEnd]);

  // ✅ Send Card Handlers
  const openSendCard = async () => {
    setIsSendCardOpen(true);
    try {
      const res = await api.get("http://localhost:5000/document/clients");
      setClients(res.data.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const closeSendCard = () => {
    setIsSendCardOpen(false);
    setSelectedClient("");
    setSelectedFile(null);
    setDocName("");
    setDocType(TYPE_OPTIONS[0] || "");
    setClientSearch("");
    setIsConfirmOpen(false);
    setErrorMessage("");
  };

  const filteredClients = clients.filter((c) => {
    const keyword = clientSearch.toLowerCase();
    return (
      c.email?.toLowerCase().includes(keyword) ||
      c.name?.toLowerCase().includes(keyword) ||
      c._id?.toLowerCase().includes(keyword)
    );
  });

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!selectedClient || !selectedFile) {
      setErrorMessage("Please select a client or a file before sending");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setErrorMessage("");
    setShake(false);

    setConfirmPayload({
      clientId: selectedClient,
      clientLabel:
        filteredClients.find((c) => c._id === selectedClient)?.email ||
        "Selected Client",
      file: selectedFile,
      name: docName || selectedFile.name,
      type: docType,
    });

    setIsConfirmOpen(true);
  };

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleConfirmSend = async () => {
    const fd = new FormData();
    fd.append("file", confirmPayload.file);
    fd.append("clientId", confirmPayload.clientId);
    fd.append("name", confirmPayload.name);
    fd.append("type", confirmPayload.type);

    try {
      await sendDocumentToClient(fd, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        }
      });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsConfirmOpen(false);
      closeSendCard();
      setUploadProgress(0);
      await loadDocuments(docPagination.page);
    } catch (err) {
      console.error("Error sending document:", err);
      setErrorMessage("Failed to send document. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-base">
        Loading...
      </div>
    );
  }

  const grouped = groupActivities(filteredActivities);

  return (
    <div className="p-6 text-base">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Documents Dashboard
          </h1>
          <p className="text-gray-600 text-base mt-1">
            Manage all your important documents
          </p>
        </div>
        <button
          onClick={openSendCard}
          className="inline-flex items-center gap-2 bg-blue-800 cursor-pointer text-white px-5 py-3 rounded-lg shadow-md text-base font-semibold hover:bg-blue-900 transition-all"
        >
          <Send size={18} /> Send To Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Documents" value={stats.totalDocuments} />
        <StatCard title="Pending Review" value={stats.pendingReview} />
        <StatCard title="Compliance-Related" value={stats.complianceRelated} />
        <StatCard title="Archived Documents" value={stats.archived} />
      </div>

      {/* Document Table + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Documents Section */}
        <section className="lg:col-span-2 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Documents
          </h2>

          {/* 🔍 Search + Filters */}
          <div className="bg-white shadow-md rounded-2xl p-5 mb-6 border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              {/* 🔍 Search bar */}
              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 w-full sm:w-1/3 md:w-1/4 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-800 hover:shadow-sm">
                <Search size={18} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search by doc or client name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full outline-none text-base text-gray-700 placeholder-gray-400 bg-transparent"
                />
              </div>

              {/* 📄 Type filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-base font-medium text-gray-900">
                  Type:
                </span>
                {TYPE_OPTIONS.map((t) => {
                  const isActive = selectedTypes.includes(t);
                  return (
                    <div
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`px-3 py-1 rounded-full text-base font-medium cursor-pointer transition-all border
              ${
                isActive
                  ? " border-blue-800 text-white bg-blue-800"
                  : " border-none shadow-sm text-gray-800  hover:border-blue-800 bg-gray-100"
              }`}
                    >
                      {t}
                    </div>
                  );
                })}
              </div>

              {/* 📂 Status filter */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-base font-medium text-gray-700">
                  Status:
                </span>
                {STATUS_OPTIONS.map((s) => {
                  const isActive = selectedStatuses.includes(s);
                  return (
                    <div
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={`px-3 py-1 rounded-full text-base font-medium cursor-pointer transition-all border
              ${
                isActive
                  ? " border-blue-800 text-white bg-blue-800"
                  : "border-none shadow-sm text-gray-800 hover:border-2 hover:border-blue-800 bg-gray-100"
              }`}
                    >
                      {s}
                    </div>
                  );
                })}
              </div>

              {/* 🔽 Sort dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-base font-medium text-gray-700">
                  Sort:
                </label>
                <select
                  value={sortDate}
                  onChange={(e) => setSortDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base cursor-pointer bg-white hover:border-blue-800 focus:ring-2 focus:ring-blue-900 transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* 📅 Date range */}
              <div className="flex items-center gap-2 shadow-sm border border-gray-200 px-3 py-2 rounded-xl hover:border-blue-800 transition-all">
                <label className="text-base font-medium text-gray-700">
                  From:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-400 shadow-sm rounded-lg px-2 py-1 text-base cursor-pointer focus:ring-4 focus:ring-blue-800 focus:border-blue-800 transition-all"
                />
                <label className="text-base font-medium text-gray-800">
                  To:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-400 rounded-lg shadow-sm px-2 py-1 text-base cursor-pointer focus:ring-4 focus:ring-blue-800 focus:border-blue-800 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="text-left text-gray-600 uppercase text-base tracking-wider border-b">
                    <th className="px-6 py-3">Document Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <DocumentRow
                        key={doc._id}
                        doc={doc}
                        onStatusUpdated={() =>
                          fetchDocuments(docPagination.page)
                        }
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-6 text-gray-500"
                      >
                        {loadingDocs ? "Loading..." : "No documents found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {docPagination.totalPages > 1 && (
              <Pagination
                pagination={docPagination}
                onPageChange={fetchDocuments}
              />
            )}
          </Card>
        </section>

        {/* Recent Activities Section */}
        <section className="bg-white overflow-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="font-semibold text-lg">Recent Activity</h2>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                className="border rounded px-2 py-1 text-sm cursor-pointer"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Types" : type}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-2 py-1 text-sm cursor-pointer"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                {TIME_FILTERS.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>

              {timeFilter === "Custom" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {["Today", "Yesterday", "This Week", "This Month", "This Year"].map(
            (groupName) =>
              grouped[groupName] &&
              grouped[groupName].length > 0 && (
                <div key={groupName} className="mb-4">
                  <h3 className="text-gray-500 text-sm font-semibold mb-2">
                    {groupName}
                  </h3>
                  <ul>
                    {grouped[groupName].map((activity) => (
                      <RecentActivityRow
                        key={activity._id}
                        activity={activity}
                      />
                    ))}
                  </ul>
                </div>
              )
          )}

          {filteredActivities.length === 0 && (
            <p className="text-gray-500 text-base">No recent activity found</p>
          )}

          {activityPagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                pagination={activityPagination}
                onPageChange={loadActivities}
              />
            </div>
          )}
        </section>
      </div>

      {/* ✅ Send Card */}
      {isSendCardOpen && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-52 w-full max-w-xl z-40">
          <div className="bg-white shadow-xl rounded-lg p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">
                  Send Document to Client
                </h3>
                <p className="text-base text-gray-500">
                  Select client, file and type, then send
                </p>
              </div>
              <button
                onClick={closeSendCard}
                className="text-blue-800 cursor-pointer hover:text-blue-600"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div
                className={`mt-4 flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded p-2 transition-all ${
                  shake ? "animate-shake" : ""
                }`}
              >
                <AlertTriangle size={18} />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleOpenConfirm}>
              <div>
                <label className="block text-base font-medium mb-1">
                  Select Client
                </label>
                <select
                  className="w-full border cursor-pointer rounded p-2"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">-- Select Client --</option>
                  {filteredClients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.email || client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-medium mb-1">File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full cursor-pointer border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-1">
                  Document Name (optional)
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Enter document name"
                />
              </div>

              <div>
                <label className="block text-base font-medium mb-1">Type</label>
                <select
                  className="w-full cursor-pointer border rounded p-2"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-gray-100 rounded h-2">
                  <div
                    className="bg-blue-800 h-2 rounded transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-800 hover:bg-blue-900 cursor-pointer text-white px-4 py-2 rounded-lg"
                >
                  Send Document
                </button>
                <button
                  type="button"
                  onClick={closeSendCard}
                  className="bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white shadow-xl rounded-lg p-6 max-w-sm w-full z-50">
          <h4 className="text-xl font-semibold mb-3">Confirm Send</h4>
          <p className="mb-4 text-base">
            Are you sure you want to send <strong>{confirmPayload.name}</strong>{" "}
            to <strong>{confirmPayload.clientLabel}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 bg-gray-100 cursor-pointer hover:bg-gray-200 rounded-lg"
            >
              Discard
            </button>
            <button
              onClick={handleConfirmSend}
              className="px-4 py-2 bg-blue-800 cursor-pointer hover:bg-blue-900 text-white rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-20 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} />
          <span>Document sent successfully!</span>
        </div>
      )}
    </div>
  );
}

/* Stat Card */
function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 text-center">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold">{value ?? 0}</p>
    </div>
  );
}
