// src/api/documents.js
import api from "./api";

/**
 * Document API helpers
 * Expected endpoints:
 *  GET  /document/my-documents
 *  GET  /document/sent-to-me
 *  POST /document/upload
 *  GET  /document/:id/preview
 *  GET  /document/:id/download
 */

const BASE_URL = "http://localhost:5001/document";

// ✅ Build consistent query params
const buildParams = ({
  page = 1,
  limit = 15,
  search = "",
  types = [],
  statuses = [],
  sortDate = "newest",
  startDate = "",
  endDate = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (types.length) params.append("type", types.join(","));
  if (statuses.length) params.append("status", statuses.join(","));
  if (sortDate) params.append("sortDate", sortDate);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  return params;
};

// ✅ Universal fetch helper (handles token + params)
const fetchDocumentParam = async (endpoint, params = {}) => {
  try {
    const token = localStorage.getItem("token"); // JWT token
    if (!token) {
      console.warn("⚠️ No access token found in localStorage.");
      return { data: [], pagination: { page: 1, totalPages: 1 } };
    }

    const query = buildParams(params).toString();
    const res = await api.get(`${BASE_URL}/${endpoint}?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`, // ✅ Add Authorization header
      },
    });

    return {
      data: res.data?.data || [],
      pagination: res.data?.pagination || { page: 1, totalPages: 1 },
    };
  } catch (err) {
    console.error(`❌ fetchDocuments (${endpoint}) failed:`, err);
    return { data: [], pagination: { page: 1, totalPages: 1 } };
  }
};

// ✅ CLIENT: My Documents
export const getMyDocuments = (params = {}) =>
  fetchDocumentParam("my-documents", params);

// ✅ CLIENT: Sent To Me
export const getDocumentsSentToMe = (params = {}) =>
  fetchDocumentParam("sent-to-me", params);

export const uploadDocument = async ({
  file,
  name,
  type,
  onUploadProgress,
}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const fd = new FormData();
  fd.append("file", file);
  if (name) fd.append("name", name);
  if (type) fd.append("type", type);

  const res = await api.post(`${BASE_URL}/upload`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`, // ✅ add this line
    },
    onUploadProgress,
  });

  return res.data;
};

/**
 * Preview document inline in new tab (with auth token)
 */
export const previewDocument = async (id, token) => {
  const res = await api.get(`${BASE_URL}/${id}/preview`, {
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` },
  });
  const fileURL = URL.createObjectURL(res.data);
  window.open(fileURL, "_blank", "noopener,noreferrer");
};

/**
 * Download document file
 */
export const downloadDocument = async (id, name, token) => {
  const res = await api.get(`${BASE_URL}/${id}/download`, {
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` },
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ------------------ STAFF ROUTES ------------------

// ✅ STAFF: Get all documents
export const getAllDocuments = (params = {}) =>
  fetchDocumentParam("all", params);

// Staff: Update document status
export const updateDocumentStatus = async (documentId, status) => {
  const res = await api.put(`${BASE_URL}/${documentId}/status`, { status });
  return res.data;
};

// Staff: Dashboard stats
export const getDashboardStats = async () => {
  const res = await api.get(`${BASE_URL}/stats`);
  return res.data;
};

// ✅ Updated getRecentActivities API (with filters)
export const getRecentActivities = async ({
  page = 1,
  type = "All",
  time = "All",
  startDate = "",
  endDate = "",
}) => {
  const params = new URLSearchParams({
    page,
    type,
    time,
  });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const res = await api.get(
    `${BASE_URL}/activities/recent?${params.toString()}`
  );
  return res.data;
};


// Staff: Send a document to a specific client
export const sendDocumentToClient = async (formData) => {
  const res = await api.post(`${BASE_URL}/send-to-client`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ------------------ UNIVERSAL WRAPPER ------------------

// Auto-load depending on user role
export const fetchDocuments = async (role) => {
  if (role === "Staff") return await getAllDocuments();
  if (role === "Client") return await getMyDocuments();
  return [];
};
