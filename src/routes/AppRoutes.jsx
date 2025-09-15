import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import FrontdeskDashboard from "../pages/dashboard/frontdesk/Dashboard";
import NurseDashboard from "../pages/dashboard/nurse/NurseDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<FrontdeskDashboard />} />
      <Route path="/dashboard/old" element={<Dashboard />} />
      <Route path="/dashboard/nurse" element={<NurseDashboard />} />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
