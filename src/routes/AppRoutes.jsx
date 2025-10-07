import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ChangePassword from "@/pages/auth/ChangePassword";
import ChangePasswordDefault from "@/pages/auth/ChangePasswordDefault";
import ProtectedRoute from "@/components/common/ProtectedRoute";

import NurseDashboard from "@/pages/nurse/dashboard/NurseDashboard";
import AssignedTask from "@/pages/nurse/assignedTask/AssignedTask";
import PatientVitals from "@/pages/nurse/patientVitals/PatientVitals";
import Incoming from "@/pages/nurse/incoming/Incoming";
import Appointmentss from "@/pages/nurse/appointment/Appointment"

import DoctorDashboard from "@/pages/doctor/dashboard/DoctorDashboard";
import PatientVItals from "@/pages/doctor/patientVitals/PatientVitals";
import LabResults from "@/pages/doctor/labResults/LabResults";
import Appointment from "@/pages/doctor/appiontments/Appointment";
import Task from "@/pages/doctor/assignTask/Task";

import AdminDashboard from "@/pages/admin/dashboard/AdminDashboard";
import Schedule from "@/pages/admin/schedule/Schedule";
import Stocks from "@/pages/admin/stocks/Stocks";
import Invoice from "@/pages/admin/invoice/Invoice";
import Users from "@/pages/admin/users/Users";
import StaffList from "@/pages/admin/users/StaffList";
import FrontdeskDashboard from "@/pages/frontdesk/dashboard/Dashboard";
import Patients from "@/pages/frontdesk/patients/Patients";
import PatientDetails from "@/pages/frontdesk/patients/PatientDetails";
import Appointments from "@/pages/frontdesk/appointments/Appointments";
import Registration from "@/pages/frontdesk/registration/Registration";
import SuperAdminDashboard from "@/pages/superadmin/dashboard/SuperAdminDashboard";
import GenerateReports from "@/pages/superadmin/reports/GenerateReports";
import ManageUsers from "@/pages/superadmin/users/ManageUsers";
import SuperAdminRegistration from "@/pages/superadmin/registration/SuperAdminRegistration";
import SuperAdminSettings from "@/pages/superadmin/settings/SuperAdminSettings";

// Cashier
import CashierDashboard from "@/pages/cashier/dashboard/CashierDashboard";
import CashierPatients from "@/pages/cashier/patients/CashierPatients";
import PaymentRecords from "@/pages/cashier/payment-records/PaymentRecords";
import CashierPatientDetails from "@/pages/cashier/patient-details/CashierPatientDetails";
import GenerateBill from "@/pages/cashier/generate-bill/GenerateBill";

// Modals
import { BookAppointmentModal } from "@/components/modals";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password-default" element={<ChangePasswordDefault />} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />
      
      {/* Frontdesk Dashboard Routes */}
      <Route path="/frontdesk/dashboard" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <FrontdeskDashboard />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/patients" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <Patients />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/patients/:patientId" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <PatientDetails />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/appointments" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <Appointments />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/registration" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <Registration />
        </ProtectedRoute>
      } />

      {/* NurseDashboard Routes*/}
      <Route path="/dashboard/nurse" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <NurseDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/assignedTask" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <AssignedTask />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/patient" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <PatientVitals />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/incoming" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <Incoming />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/appointments" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <Appointmentss />
        </ProtectedRoute>
      } />
      <Route path="/book" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <BookAppointmentModal />
        </ProtectedRoute>
      } />


      {/*Doctor Dashboard Routes*/}
      <Route path="/dashboard/doctor" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DoctorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/patientVitals" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <PatientVItals />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/LabResults" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <LabResults />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/appointments" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Appointment />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/assign-task" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Task />
        </ProtectedRoute>
      } />

      {/*Admin DashBoard Routes */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/schedule" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Schedule />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/stocks" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Stocks />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/invoice" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Invoice />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/admin/users/staffList" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <StaffList />
        </ProtectedRoute>
      } />

      {/* Super Admin Routes */}
      <Route path="/dashboard/superadmin" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/reports" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <GenerateReports />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/users" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <ManageUsers />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/registration" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminRegistration />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminSettings />
        </ProtectedRoute>
      } />

      {/* Cashier Routes */}
      <Route path="/dashboard/cashier" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierDashboard />
        </ProtectedRoute>
      } />
      <Route path="/cashier/incoming" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <Incoming />
        </ProtectedRoute>
      } />
      <Route path="/cashier/patients" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierPatients />
        </ProtectedRoute>
      } />
      <Route path="/cashier/payment-records" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <PaymentRecords />
        </ProtectedRoute>
      } />
      <Route path="/cashier/patient-details" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierPatientDetails />
        </ProtectedRoute>
      } />
      <Route path="/cashier/generate-bill" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <GenerateBill />
        </ProtectedRoute>
      } />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
