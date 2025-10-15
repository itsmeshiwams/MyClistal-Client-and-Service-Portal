// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import Documents from "../pages/Documents";
import Chat from "../pages/Chat";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={["Client", "Staff"]}>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communication"
        element={
          <ProtectedRoute allowedRoles={["Client", "Staff"]}>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
