// src/api/documents.js
import api from "./api";

/**
 * Document API helpers for client role
 * Base endpoints expected:
 *  GET  /api/documents/my-documents
 *  GET  /api/documents/sent-to-me
 *  POST /api/documents/upload
 *  GET  /api/documents/:id/preview
 *  GET  /api/documents/:id/download
 */

export const getMyDocuments = async () => {
  const res = await api.get("http://localhost:5000/document/my-documents");
  return res.data;
};

export const getDocumentsSentToMe = async () => {
  const res = await api.get("http://localhost:5000/document/sent-to-me");
  return res.data;
};

export const uploadDocument = async ({ file, name, type, onUploadProgress }) => {
  const fd = new FormData();
  fd.append("file", file);
  if (name) fd.append("name", name);
  if (type) fd.append("type", type);

  const res = await api.post("http://localhost:5000/document/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data;
};

export const previewUrl = (id) => `http://localhost:5000/document/${id}/preview`;
export const downloadUrl = (id) => `http://localhost:5000/documents/${id}/download`;
