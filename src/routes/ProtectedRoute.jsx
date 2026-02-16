import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute: requires authentication. Redirects to /login if no token.
 */
export default function ProtectedRoute() {
  const token = useSelector((s) => s.auth.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * AdminRoute: requires ADMIN role. Shows 403 message if not admin.
 */
export function AdminRoute() {
  const { accessToken, user } = useSelector((s) => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
