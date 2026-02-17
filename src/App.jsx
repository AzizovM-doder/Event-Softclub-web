import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute, { AdminRoute } from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";
import EventsPage from "./pages/EventsPage";
import EventInfoPage from "./pages/EventInfoPage";
import PhotosPage from "./pages/PhotosPage";
import VideosPage from "./pages/VideosPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/home" element={<DashboardHome />} />
        <Route path="/dashboard/events" element={<EventsPage />} />
        <Route path="/dashboard/events/:id" element={<EventInfoPage />} />
        <Route path="/dashboard/photos" element={<PhotosPage />} />
        <Route path="/dashboard/videos" element={<VideosPage />} />
        <Route path="/dashboard/users" element={<UsersPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        {/* Admin only routes if any */}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard/home" replace />} />
      <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
    </Routes>
    <Toaster position="top-right" richColors />
    </>
  );
}
