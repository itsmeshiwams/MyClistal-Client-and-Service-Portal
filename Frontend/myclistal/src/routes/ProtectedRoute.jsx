import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while restoring session to avoid flicker
  if (loading) return null;

  // Fallback to localStorage after refresh
  const localToken = localStorage.getItem("token");
  const localRole = localStorage.getItem("role");
  const localEmail = localStorage.getItem("email");

  const currentUser =
    user || (localToken ? { token: localToken, role: localRole, email: localEmail } : null);

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // If role is restricted and user is not allowed, redirect to dashboard
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
