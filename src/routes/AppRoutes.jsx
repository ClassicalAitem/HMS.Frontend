import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import FrontdeskDashboard from "../pages/frontdesk/dashboard/Dashboard";
import Patients from "../pages/frontdesk/patients/Patients";
import Appointments from "../pages/frontdesk/appointments/Appointments";
import ChangePassword from "../pages/frontdesk/ChangePassword";
import NurseDashboard from "../pages/nurse/dashboard/NurseDashboard";

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
      
      {/* Frontdesk Routes */}
      <Route path="/patients" element={<Patients />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
