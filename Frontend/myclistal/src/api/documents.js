// src/api/documents.js
import api from "./api";

/**
 * Document API helpers
 * Base endpoints expected:
 *  GET  /api/documents/my-documents
 *  GET  /api/documents/sent-to-me
 *  POST /api/documents/upload
 *  GET  /api/documents/:id/preview
 *  GET  /api/documents/:id/download
 */

const BASE_URL = "http://localhost:5000/document";

export const getMyDocuments = async () => {
  const res = await api.get(`${BASE_URL}/my-documents`);
  return res.data;
};

export const getDocumentsSentToMe = async () => {
  const res = await api.get(`${BASE_URL}/sent-to-me`);
  return res.data;
};

export const uploadDocument = async ({ file, name, type, onUploadProgress }) => {
  const fd = new FormData();
  fd.append("file", file);
  if (name) fd.append("name", name);
  if (type) fd.append("type", type);

  const res = await api.post(`${BASE_URL}/upload`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
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

// Staff: Get all documents
export const getAllDocuments = async () => {
  const res = await api.get(`${BASE_URL}/all`);
  return res.data;
};

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

// Staff: Recent activity logs
export const getRecentActivities = async () => {
  const res = await api.get(`${BASE_URL}/activities/recent`);
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