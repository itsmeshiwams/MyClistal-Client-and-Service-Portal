import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/Notfound";
import ProtectedRoute from "./ProtectedRoute";
import Documents from "../pages/Documents";

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

      {/* <Route path="/documents" element={<Documents />} /> */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
