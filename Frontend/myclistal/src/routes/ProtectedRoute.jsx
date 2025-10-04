// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRoute
 * Props:
 *  - children: JSX
 *  - allowedRoles?: array of roles allowed (e.g. ['Client'])
 *
 * If not logged in -> redirect to "/"
 * If role not allowed -> redirect to "/dashboard" (or wherever you prefer)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // role not allowed
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
