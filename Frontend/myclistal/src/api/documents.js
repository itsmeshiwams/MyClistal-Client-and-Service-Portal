// src/api/documents.js
import api from "./api";

export const fetchMyDocuments = async () => {
  const { data } = await api.get("/documents/my");
  return data;
};

export const uploadDocument = async (formData) => {
  const { data } = await api.post("/documents/upload", formData);
  return data;
};
