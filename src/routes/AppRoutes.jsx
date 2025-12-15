import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ChangePassword from "@/pages/auth/ChangePassword";
import ChangePasswordDefault from "@/pages/auth/ChangePasswordDefault";
import ProtectedRoute from "@/components/common/ProtectedRoute";

import NurseDashboard from "@/pages/nurse/dashboard/NurseDashboard";
import AssignedTask from "@/pages/nurse/assignedTask/AssignedTask";
import Task from "@/pages/nurse/assignedTask/AssignedTask";
import Appointmentss from "@/pages/nurse/appointment/Appointment"

import DoctorDashboard from "@/pages/doctor/dashboard/DoctorDashboard";
import LabResults from "@/pages/doctor/labResults/LabResults";
import LabResultDetails from "@/pages/doctor/labResults/LabResultDetails";
import IncomingDoctor from "@/pages/doctor/incoming/IncomingDoctor";
import PatientMedicalHistory from "@/pages/doctor/incoming/PatientMedicalHistory";
import AddDiagnosis from "@/pages/doctor/incoming/AddDiagnosis";
import SendToCashier from "@/pages/doctor/incoming/SendToCashier";
import SendToPharmacy from "@/pages/doctor/incoming/SendToPharmacy";
import ConsultationDetails from "@/pages/doctor/incoming/ConsultationDetails";
import AllPatients from "@/pages/doctor/allPatients/AllPatients";
import Appointment from "@/pages/doctor/appiontments/Appointment";

// Admin Dashboard
import AdminDashboard from "@/pages/admin/dashboard/AdminDashboard";
import Schedule from "@/pages/admin/schedule/Schedule";
import Stocks from "@/pages/admin/stocks/Stocks";
import Invoice from "@/pages/admin/invoice/Invoice";
import Users from "@/pages/admin/users/Users";
import StaffList from "@/pages/admin/users/StaffList";
import FrontdeskDashboard from "@/pages/frontdesk/dashboard/Dashboard";
import Patients from "@/pages/frontdesk/patients/Patients";
import Surgeries from "@/pages/frontdesk/surgeries/Surgeries";
import SurgeryDetails from "@/pages/frontdesk/surgeries/SurgeryDetails";


import PatientDetails from "@/pages/frontdesk/patients/PatientDetails";
import Registration from "@/pages/frontdesk/registration/Registration";


import SuperAdminDashboard from "@/pages/superadmin/dashboard/SuperAdminDashboard";
import GenerateReports from "@/pages/superadmin/reports/GenerateReports";
import ManageUsers from "@/pages/superadmin/users/ManageUsers";
import SuperAdminRegistration from "@/pages/superadmin/registration/SuperAdminRegistration";
import SuperAdminSettings from "@/pages/superadmin/settings/SuperAdminSettings";
import HospitalSetup from "@/pages/superadmin/settings/HospitalSetup";
import BillingFinance from "@/pages/superadmin/settings/BillingFinance";
import SecuritySettings from "@/pages/superadmin/settings/SecuritySettings";
import SecurityPreferences from "@/pages/superadmin/settings/SecurityPreferences";
import AuditLogs from "@/pages/superadmin/settings/AuditLogs";

// Cashier
import CashierDashboard from "@/pages/cashier/dashboard/CashierDashboard";
import CashierIncoming from "@/pages/cashier/incoming/Incoming";
import CashierPatients from "@/pages/cashier/patients/CashierPatients";
import BillingRecords from "@/pages/cashier/payment-records/BillingRecord";
import ReceiptRecords from "@/pages/cashier/payment-records/ReceiptRecord";
// import PaymentRecords from "@/pages/cashier/payment-records/PaymentRecords";
import CashierPatientDetails from "@/pages/cashier/patient-details/CashierPatientDetails";
import GenerateBill from "@/pages/cashier/generate-bill/GenerateBill";

// Modals
import { BookAppointmentModal } from "@/components/modals";
import Appointments from "@/pages/frontdesk/appointments/Appointments";
import PatientVitals from "@/pages/nurse/patientVitals/PatientVitals";
import PatientVitalsDetails from "@/pages/nurse/patientVitals/PatientVitalsDetails";
import NurseIncoming from "@/pages/nurse/incoming/Incoming";
// Pharmacist
import PharmacistDashboard from "@/pages/pharmacist/dashboard/PharmacistDashboard";
import DrugDispensation from "@/pages/pharmacist/DrugDispensation/DrugDispensation";
import PharmacistIncoming from "@/pages/pharmacist/incoming/Incoming";
import InventoryStocks from "@/pages/pharmacist/Inventory&stocks/Inventory&stocks";
import PharmacistReports from "@/pages/pharmacist/Reports/Reports";
import PharmacistTransactions from "@/pages/pharmacist/Transactions/Transactions";

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
      <Route path="/dashboard" element={<FrontdeskDashboard />} />
      {/* <Route path="/dashboard/old" element={<Dashboard />} /> */}
      {/* LaboratoryDashboard */}
      <Route path="/dashboard/laboratory" element={<LaboratoryDashboard />} />
      <Route
        path="/dashboard/laboratory/incoming"
        element={<IncomingLaboratory />}
      />
      <Route
        path="/dashboard/laboratory/inventoryStocks"
        element={<InventorySTOCKS />}
      />
      <Route
        path="/dashboard/laboratory/Reports"
        element={<LaboratoryReports />}
      />
      <Route
        path="/dashboard/laboratory/modal"
        element={<TestRequestModal />}
      />
      {/* PharmacyDashboard Routes */}
      <Route path="/dashboard/pharmacist" element={<PharmacistDashboard />} />
      <Route
        path="/dashboard/pharmacist/DrugDispensation"
        element={<DrugDispensation />}
      />
      <Route path="/dashboard/pharmacist/incoming" element={<INCOMING />} />
      <Route
        path="/dashboard/pharmacist/InventoryStocks"
        element={<InventoryStocks />}
      />
      <Route
        path="/dashboard/pharmacist/Transactions"
        element={<Transactions />}
      />
      <Route path="/dashboard/pharmacist/Reports" element={<Reports />} />
      {/* NurseDashboard Routes*/}
      <Route path="/dashboard/nurse" element={<NurseDashboard />} />
      <Route path="/dashboard/nurse/assignedTask" element={<AssignedTask />} />
      <Route path="/dashboard/nurse/patient" element={<PatientVitals />} />
      <Route path="/dashboard/nurse/incoming" element={<Incomming />} />
      <Route path="/dashboard/nurse/appointments" element={<Appointmentss />} />
      <Route path="/book" element={<BookAppointmentModal />} />
      {/*Doctor Dashboard Routes*/}
      <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      <Route path="/dashboard/doctor/allPatients" element={<AllPatients />} />
      <Route path="/dashboard/doctor/LabResults" element={<LabResults />} />
      <Route path="/dashboard/doctor/appointments" element={<Appoxintment />} />
      <Route path="/dashboard/doctor/assign-task" element={<Task />} />
      <Route path="/dashboard/doctor/incoming" element={<IncomingDoctor />} />
      <Route
        path="/dashboard/incoming/patientdetails/:id"
        element={<Patientdetails />}
      />
      <Route
        path="/dashboard/doctor/incoming/patientdiagnosis"
        element={<PatientDiagnosis />}
      />
      <Route
        path="/dashboard/doctor/incoming/addnewdiagnosis"
        element={<AddNewDiagnosis />}
      />
      <Route
        path="/dashboard/doctor/incoming/incomingcashier"
        element={<IncomingCashier />}
      />
      {/*Admin DashBoard Routes */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/admin/schedule" element={<Schedule />} />
      <Route path="/dashboard/admin/stocks" element={<Stocks />} />
      <Route path="/dashboard/admin/invoice" element={<Invoice />} />
      <Route path="/dashboard/admin/users" element={<Users />} />
      <Route path="/dashboard/admin/users/staffList" element={<StaffList />} />
      <Route path="/dashboard/frontdesk" element={<FrontdeskDashboard />} />
      <Route path="/dashboard/nurse" element={<NurseDashboard />} />
      <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/superadmin/reports" element={<GenerateReports />} />
      <Route path="/superadmin/users" element={<ManageUsers />} />
      <Route
        path="/superadmin/registration"
        element={<SuperAdminRegistration />}
      />
      <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
      <Route path="/dashboard/cashier" element={<CashierDashboard />} />
      <Route path="/cashier/incoming" element={<CashierIncoming />} />
      <Route path="/cashier/patients" element={<CashierPatients />} />
      {/* <Route path="/cashier/payment-records" element={<PaymentRecords />} /> */}
      <Route
        path="/cashier/patient-details"
        element={<CashierPatientDetails  />}
      />
      <Route path="/cashier/generate-bill" element={<GenerateBill />} />
      {/* Frontdesk Routes */}
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:patientId" element={<PatientDetails />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/registration" element={<Registration />} />
      {/*==============================================================================================================

      ====================================  Auth Route ==============================================================

      ================================================================================================================*/}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/change-password-default" element={<ChangePasswordDefault />} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />


      {/*==============================================================================================================

      ====================================  Frontdesk DashBoard Route =====================================================

      ================================================================================================================*/}
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
      <Route path="/frontdesk/surgeries" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <Surgeries />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/surgeries/:surgeryId" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <SurgeryDetails />
        </ProtectedRoute>
      } />


      {/*==============================================================================================================

      ====================================  Nurse DashBoard Route =====================================================

      ================================================================================================================*/}
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
      <Route path="/dashboard/nurse/patient/:patientId" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <PatientVitalsDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/incoming" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <NurseIncoming />
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



      {/*==============================================================================================================

      ====================================  Doctor DashBoard Route =====================================================

      ================================================================================================================*/}
      <Route path="/dashboard/doctor" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DoctorDashboard />
        </ProtectedRoute>
      } />
  <Route path="/dashboard/doctor/patientVitals" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <PatientVitals />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/medical-history/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <PatientMedicalHistory />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/medical-history/:patientId/add" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <AddDiagnosis />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/medical-history/:patientId/consultation/:consultationId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ConsultationDetails />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/send-to-cashier/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <SendToCashier />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/send-to-pharmacy/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <SendToPharmacy />
    </ProtectedRoute>
  } />
      <Route path="/dashboard/doctor/labResults" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <LabResults />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/labResults/:labResultId" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <LabResultDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/appointments" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Appointment />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/incoming" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <IncomingDoctor />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/allPatients" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <AllPatients />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/assign-task" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Task />
        </ProtectedRoute>
      } />


      {/*==============================================================================================================

      ====================================  Admin DashBoard Route =====================================================

      ================================================================================================================*/}
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


      {/*=============================================================================================================

       ====================================  Super Admin Route =======================================================

      ================================================================================================================*/}

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
      <Route path="/superadmin/settings/hospital-setup" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <HospitalSetup />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/billing-finance" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <BillingFinance />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/security" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SecuritySettings />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/security-preferences" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SecurityPreferences />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/audit-logs" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <AuditLogs />
        </ProtectedRoute>
      } />



      {/*=============================================================================================================

       ====================================  Cashier Route ===========================================================

      ================================================================================================================*/}

      <Route path="/cashier/dashboard" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierDashboard />
        </ProtectedRoute>
      } />
      <Route path="/cashier/incoming" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierIncoming />
        </ProtectedRoute>
      } />
      <Route path="/cashier/patients" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierPatients />
        </ProtectedRoute>
      } />
      {/* <Route path="/cashier/payment-records" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <PaymentRecords />
        </ProtectedRoute>
      } /> */}
      <Route path="/cashier/billing-records" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <BillingRecords />
        </ProtectedRoute>
      } />
      <Route path="/cashier/receipt-records" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <ReceiptRecords />
        </ProtectedRoute>
      } />
      <Route path="/cashier/patient-details/:patientId" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierPatientDetails />
        </ProtectedRoute>
      } />
      <Route path="/cashier/generate-bill" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <GenerateBill />
        </ProtectedRoute>
      } />

      {/*==============================================================================================================

      ====================================  Pharmacist DashBoard Route ===============================================

      ================================================================================================================*/}
      <Route path="/dashboard/pharmacist" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/DrugDispensation" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <DrugDispensation />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/incoming" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistIncoming />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/Inventory&stocks" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <InventoryStocks />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/Reports" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistReports />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/Transactions" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistTransactions />
        </ProtectedRoute>
      } />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
