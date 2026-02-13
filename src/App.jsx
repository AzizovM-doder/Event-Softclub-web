import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";
import EventsPage from "./pages/EventsPage";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/home" element={<DashboardHome />} />
        <Route path="/dashboard/events" element={<EventsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard/home" replace />} />
      <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
    </Routes>\
    <Toaster position="top-right" richColors />
    </>
  );
}
