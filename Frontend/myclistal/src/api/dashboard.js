// src/api/dashboard.js
import api from "./api";

export const fetchDashboard = async () => {
  const { data } = await api.get("http://localhost:5000/dashboard/");
  return data;
};
