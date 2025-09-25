import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import FrontdeskDashboard from "@/pages/frontdesk/dashboard/Dashboard";
import Patients from "@/pages/frontdesk/patients/Patients";
import PatientDetails from "@/pages/frontdesk/patients/PatientDetails";
import Appointments from "@/pages/frontdesk/appointments/Appointments";
import Registration from "@/pages/frontdesk/registration/Registration";
import NurseDashboard from "@/pages/nurse/dashboard/NurseDashboard";
import DoctorDashboard from "@/pages/doctor/dashboard/DoctorDashboard";
import AdminDashboard from "@/pages/admin/dashboard/AdminDashboard";
import SuperAdminDashboard from "@/pages/superadmin/dashboard/SuperAdminDashboard";
import GenerateReports from "@/pages/superadmin/reports/GenerateReports";
import ManageUsers from "@/pages/superadmin/users/ManageUsers";
import SuperAdminRegistration from "@/pages/superadmin/registration/SuperAdminRegistration";
import SuperAdminSettings from "@/pages/superadmin/settings/SuperAdminSettings";
import CashierDashboard from "@/pages/cashier/dashboard/CashierDashboard";
import Incoming from "@/pages/cashier/incoming/Incoming";
import CashierPatients from "@/pages/cashier/patients/CashierPatients";
import PaymentRecords from "@/pages/cashier/payment-records/PaymentRecords";
import CashierPatientDetails from "@/pages/cashier/patient-details/CashierPatientDetails";
import GenerateBill from "@/pages/cashier/generate-bill/GenerateBill";
import ChangePassword from "@/pages/auth/ChangePassword";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard/frontdesk" element={<FrontdeskDashboard />} />
      <Route path="/dashboard/nurse" element={<NurseDashboard />} />
      <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/superadmin/reports" element={<GenerateReports />} />
      <Route path="/superadmin/users" element={<ManageUsers />} />
      <Route path="/superadmin/registration" element={<SuperAdminRegistration />} />
      <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
      <Route path="/dashboard/cashier" element={<CashierDashboard />} />
      <Route path="/cashier/incoming" element={<Incoming />} />
      <Route path="/cashier/patients" element={<CashierPatients />} />
      <Route path="/cashier/payment-records" element={<PaymentRecords />} />
      <Route path="/cashier/patient-details" element={<CashierPatientDetails />} />
      <Route path="/cashier/generate-bill" element={<GenerateBill />} />

      {/* Frontdesk Routes */}
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:patientId" element={<PatientDetails />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/registration" element={<Registration />} />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
