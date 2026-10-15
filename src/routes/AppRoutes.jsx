import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ChangePassword from "@/pages/auth/ChangePassword";
import ChangePasswordDefault from "@/pages/auth/ChangePasswordDefault";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const NurseDashboard = lazy(() => import("@/pages/nurse/dashboard/NurseDashboard"));
const AssignedTask = lazy(() => import("@/pages/nurse/assignedTask/AssignedTask"));
const Task = lazy(() => import("@/pages/nurse/assignedTask/AssignedTask"));
const ViewAllPatientVitals = lazy(() => import("@/pages/nurse/patientVitals/ViewAllPatientVitals"));
const ViewAllAdmission = lazy(() => import("@/pages/nurse/patientVitals/ViewAllAdmission"));
const NurseAntenatalRecords = lazy(() => import("@/pages/nurse/patientVitals/NurseAntenatalRecords"));

const Appointmentss = lazy(() => import("@/pages/nurse/appointment/Appointment"));

const SurgeonDashboard = lazy(() => import("@/pages/surgeon/dashboard/SurgeonDashboard"));
const SurgeonAssignedTask = lazy(() => import("@/pages/surgeon/assignedTask/AssignedTask"));
const SurgeonAppointments = lazy(() => import("@/pages/surgeon/appointment/Appointment"));
const SurgeonIncoming = lazy(() => import("@/pages/surgeon/incoming/SurgeonIncoming"));
const WriteSurgicalNote = lazy(() => import("@/pages/surgeon/incoming/WriteSurgicalNote"));
const SurgeonNoteHistory = lazy(() => import("@/pages/surgeon/history/SurgeonNoteHistory"));

const ViewConsultationRecords = lazy(() => import("@/pages/doctor/incoming/ViewConsultationRecords"));
const ViewAllPrescriptions = lazy(() => import("@/pages/doctor/incoming/ViewAllPrescriptions"));
const ViewAllInvestigations = lazy(() => import("@/pages/doctor/incoming/ViewAllInvestigations"));
const ViewAllLabResults = lazy(() => import("@/pages/doctor/incoming/ViewAllLabResults"));
const ViewAllVitals = lazy(() => import("@/pages/doctor/incoming/ViewAllVitals"));
const DoctorDashboard = lazy(() => import("@/pages/doctor/dashboard/DoctorDashboard"));
const LabResults = lazy(() => import("@/pages/doctor/labResults/LabResults"));
const LabResultDetails = lazy(() => import("@/pages/doctor/labResults/LabResultDetails"));
const IncomingDoctor = lazy(() => import("@/pages/doctor/incoming/IncomingDoctor"));

const HmoDashboard = lazy(() => import("@/pages/hmo/dashboard/HmoDashboard"));
const IncomingHmo = lazy(() => import("@/pages/hmo/incoming/IncomingHmo"));
const IncomingHmoDetails = lazy(() => import("@/pages/hmo/incoming/IncomingHmoDetails"));
const PatientMedicalHistory = lazy(() => import("@/pages/doctor/incoming/PatientMedicalHistory"));
const AntenatalRecords = lazy(() => import("@/pages/doctor/incoming/AntenatalRecords"));
const AntenatalRecordDetails = lazy(() => import("@/pages/doctor/incoming/AntenatalRecordDetails"));
const AddDiagnosis = lazy(() => import("@/pages/doctor/incoming/AddDiagnosis"));
const EditConsultation = lazy(() => import("@/pages/doctor/incoming/EditConsultation"));
const SendToCashier = lazy(() => import("@/pages/doctor/incoming/SendToCashier"));
const SendToPharmacy = lazy(() => import("@/pages/doctor/incoming/SendToPharmacy"));
const SendToNurse = lazy(() => import("@/pages/doctor/incoming/SendToNurse"));
const ConsultationDetails = lazy(() => import("@/pages/doctor/incoming/ConsultationDetails"));
const ViewConsultation = lazy(() => import("@/pages/doctor/incoming/ViewConsultation"));
const AllPatients = lazy(() => import("@/pages/doctor/allPatients/AllPatients"));
const Appointment = lazy(() => import("@/pages/doctor/appiontments/Appointment"));
const MedicalRecordHistory = lazy(() => import("@/pages/medical-director/incoming/MedicalRecordHistory"));
const DRAdmittedList = lazy(() => import("@/pages/doctor/admitted/AdmittedList"));
const DRAdmittedPatient = lazy(() => import("@/pages/doctor/admitted/AdmittedPatient"));

// Medical Director Pages
const MDDashboard = lazy(() => import("@/pages/medical-director/dashboard/MDDashboard"));
const MDPatientMedicalHistory = lazy(() => import("@/pages/medical-director/incoming/PatientMedicalHistory"));
const MDViewConsultationRecords = lazy(() => import("@/pages/medical-director/incoming/ViewConsultationRecords"));
const MDViewAllPrescriptions = lazy(() => import("@/pages/medical-director/incoming/ViewAllPrescriptions"));
const MDViewAllInvestigations = lazy(() => import("@/pages/medical-director/incoming/ViewAllInvestigations"));
const MDViewAllLabResults = lazy(() => import("@/pages/medical-director/incoming/ViewAllLabResults"));
const MDMedicalRecordHistory = lazy(() => import("@/pages/medical-director/incoming/MedicalRecordHistory"));
const MDViewAllVitals = lazy(() => import("@/pages/medical-director/incoming/ViewAllVitals"));
const MDIncomingLabResults = lazy(() => import("@/pages/medical-director/labResults/IncomingLabResults"));
const MDLabResultDetails = lazy(() => import("@/pages/medical-director/labResults/LabResultDetails"));
const IncomingMD = lazy(() => import("@/pages/medical-director/incoming/IncomingMD"));
const MDAntenatalRecords = lazy(() => import("@/pages/medical-director/incoming/AntenatalRecords"));
const MDAntenatalRecordDetails = lazy(() => import("@/pages/medical-director/incoming/AntenatalRecordDetails"));
const MDAddDiagnosis = lazy(() => import("@/pages/medical-director/incoming/AddDiagnosis"));
const MDEditConsultation = lazy(() => import("@/pages/medical-director/incoming/EditConsultation"));
const MDSendToCashier = lazy(() => import("@/pages/medical-director/incoming/SendToCashier"));
const MDSendToPharmacy = lazy(() => import("@/pages/medical-director/incoming/SendToPharmacy"));
const MDSendToNurse = lazy(() => import("@/pages/medical-director/incoming/SendToNurse"));
const MDViewConsultation = lazy(() => import("@/pages/medical-director/incoming/ViewConsultation"));
const MDViewAllAdmissions = lazy(() => import("@/pages/medical-director/incoming/ViewAllAdmission"));
const MDWritePrescription = lazy(() => import("@/pages/medical-director/incoming/WritePrescription"));
const MDAllPatients = lazy(() => import("@/pages/medical-director/allPatients/AllPatients"));
const MDAttendedToday = lazy(() => import("@/pages/medical-director/attended-today/AttendedToday"));
const MDPatients = lazy(() => import("@/pages/medical-director/patients/Patients"));
const MDAppointment = lazy(() => import("@/pages/medical-director/appiontments/Appointment"));
const MDPaymentRecords = lazy(() => import("@/pages/medical-director/payment-records/ReceiptRecord"));
const MDTask = lazy(() => import("@/pages/medical-director/assignTask/Task"));
const MDAdmittedList = lazy(() => import("@/pages/medical-director/admitted/AdmittedList"));
const MDAdmittedPatient = lazy(() => import("@/pages/medical-director/admitted/AdmittedPatient"));

// Admin Dashboard
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard/AdminDashboard"));
const Schedule = lazy(() => import("@/pages/admin/schedule/Schedule"));
const Stocks = lazy(() => import("@/pages/admin/stocks/Stocks"));
const Invoice = lazy(() => import("@/pages/admin/invoice/Invoice"));
const Users = lazy(() => import("@/pages/admin/users/Users"));
const StaffList = lazy(() => import("@/pages/admin/users/StaffList"));
const FrontdeskDashboard = lazy(() => import("@/pages/frontdesk/dashboard/Dashboard"));
const Patients = lazy(() => import("@/pages/frontdesk/patients/Patients"));
const Surgeries = lazy(() => import("@/pages/frontdesk/surgeries/Surgeries"));
const SurgeryDetails = lazy(() => import("@/pages/frontdesk/surgeries/SurgeryDetails"));


const PatientDetails = lazy(() => import("@/pages/frontdesk/patients/PatientDetails"));
const Registration = lazy(() => import("@/pages/frontdesk/registration/Registration"));
const OpdPatients = lazy(() => import("@/pages/frontdesk/opd-patients/OpdPatients"));
const AddOpdPatient = lazy(() => import("@/pages/frontdesk/opd-patients/AddOpdPatient"));


// SUper Admin
const SuperAdminDashboard = lazy(() => import("@/pages/superadmin/dashboard/SuperAdminDashboard"));
const GenerateReports = lazy(() => import("@/pages/superadmin/reports/GenerateReports"));
const ManageUsers = lazy(() => import("@/pages/superadmin/users/ManageUsers"));
const SuperAdminPatients = lazy(() => import("@/pages/superadmin/patients/Patients"));
const SuperPatientDetails = lazy(() => import("@/pages/superadmin/patients/PatientDetails"));
const SuperAdminAdmittedList = lazy(() => import("@/pages/superadmin/admitted/SuperAdminAdmittedList"));
const SuperAdminAdmittedPatient = lazy(() => import("@/pages/superadmin/admitted/SuperAdminAdmittedPatient"));
const SuperAdminRegistration = lazy(() => import("@/pages/superadmin/registration/SuperAdminRegistration"));
const SuperAdminAppointments = lazy(() => import("@/pages/superadmin/appointments/Appointments"));
const SuperAdminSettings = lazy(() => import("@/pages/superadmin/settings/SuperAdminSettings"));
const HospitalSetup = lazy(() => import("@/pages/superadmin/settings/HospitalSetup"));
const BillingFinance = lazy(() => import("@/pages/superadmin/settings/BillingFinance"));
const SecuritySettings = lazy(() => import("@/pages/superadmin/settings/SecuritySettings"));
const SecurityPreferences = lazy(() => import("@/pages/superadmin/settings/SecurityPreferences"));
const AuditLogs = lazy(() => import("@/pages/superadmin/settings/AuditLogs"));
const MedicalData = lazy(() => import("@/pages/superadmin/settings/MedicalData"));
const PharmacyInventory = lazy(() => import("@/pages/superadmin/settings/PharmacyInventory"));
const LaboratoryInventory = lazy(() => import("@/pages/superadmin/settings/LaboratoryInventory"));
const PharmacyReview = lazy(() => import("@/pages/superadmin/settings/PharmacyReview"));

// Cashier
const CashierDashboard = lazy(() => import("@/pages/cashier/dashboard/CashierDashboard"));
const CashierIncoming = lazy(() => import("@/pages/cashier/incoming/Incoming"));
const CashierPatients = lazy(() => import("@/pages/cashier/patients/CashierPatients"));
const BillingRecords = lazy(() => import("@/pages/cashier/payment-records/BillingRecord"));
const ReceiptRecords = lazy(() => import("@/pages/cashier/payment-records/ReceiptRecord"));
// import PaymentRecords from "@/pages/cashier/payment-records/PaymentRecords";
const CashierPatientDetails = lazy(() => import("@/pages/cashier/patient-details/CashierPatientDetails"));
const ReceiptDetails = lazy(() => import("@/pages/cashier/receipt-details/ReceiptDetails"));
const PaymentReceiptHistory = lazy(() => import("@/pages/cashier/payment-receipt-history/PaymentReceiptHistory"));
const GenerateBill = lazy(() => import("@/pages/cashier/generate-bill/GenerateBill"));
const CashierOpdPatients = lazy(() => import("@/pages/cashier/opd-patients/CashierOpdPatients"));
const CashierOpdPatientDetails = lazy(() => import("@/pages/cashier/opd-patients/CashierOpdPatientDetails"));
const CreateOpdPatient = lazy(() => import("@/pages/cashier/opd-patients/CreateOpdPatient"));
const CashierAdmissions = lazy(() => import("@/pages/cashier/admissions/CashierAdmissions"));
const CashierAdmissionDetails = lazy(() => import("@/pages/cashier/admissions/CashierAdmissionDetails"));

// Modals
import { BookAppointmentModal } from "@/components/modals";
const Appointments = lazy(() => import("@/pages/frontdesk/appointments/Appointments"));
const PatientVitals = lazy(() => import("@/pages/nurse/patientVitals/PatientVitals"));
const PatientVitalsDetails = lazy(() => import("@/pages/nurse/patientVitals/PatientVitalsDetails"));
const DependantVitalsDetails = lazy(() => import("@/pages/nurse/dependantVitals/PatientVitalsDetails"));
const NurseIncoming = lazy(() => import("@/pages/nurse/incoming/Incoming"));
const AdmittedList = lazy(() => import("@/pages/nurse/admitted/AdmittedList"));
const AdmittedPatient = lazy(() => import("@/pages/nurse/admitted/AdmittedPatient"));
// Pharmacist
const PharmacistDashboard = lazy(() => import("@/pages/pharmacist/dashboard/PharmacistDashboard"));
const DrugDispensation = lazy(() => import("@/pages/pharmacist/DrugDispensation/DrugDispensation"));
const PharmacistIncoming = lazy(() => import("@/pages/pharmacist/incoming/Incoming"));
const PharmacistIncomingDetails = lazy(() => import("@/pages/pharmacist/incoming/IncomingDetails"));
const InventoryStocks = lazy(() => import("@/pages/pharmacist/Inventory&stocks/Inventory&stocks"));
const PharmacistReports = lazy(() => import("@/pages/pharmacist/Reports/Reports"));
const PharmacistTransactions = lazy(() => import("@/pages/pharmacist/Transactions/Transactions"));

//Laboratory Dashboard Routes
const LaboratoryDashboard = lazy(() => import("@/pages/laboratory/laboratoryDashboard/LaboratoryDashboard"));
const IncomingLaboratory = lazy(() => import("@/pages/laboratory/incoming/IncomingLaboratory"));
const OrderedLab = lazy(() => import("@/pages/laboratory/OrderedLab"));
const IncomingScan = lazy(() => import("@/pages/laboratory/incoming/IncomingScan"));
const AddLabResult = lazy(() => import("@/pages/laboratory/results/AddLabResult"));
const ViewLabResult = lazy(() => import("@/pages/laboratory/results/ViewLabResult"));
const LabResultsHistory = lazy(() => import("@/pages/laboratory/results/LabResultsHistory"));
// import InventorySTOCKS from "@/pages/laboratory/inventoryStocks/InventoryStocks";
const InventoryAndStocks = lazy(() => import("@/pages/laboratory/Inventory&stocks/Inventory&stocks"));
const LaboratoryReports = lazy(() => import("@/pages/laboratory/Reports/LaboratoryReports"));
const TestRequestModal = lazy(() => import("@/pages/laboratory/incoming/modals/TestRequestModal"));
const CompletedTests = lazy(() => import("@/pages/laboratory/completed/CompletedTests"));
const LaboratoryPatientProfile = lazy(() => import("@/pages/laboratory/patients/LaboratoryPatientDetails"));
const LaboratoryPatientsList = lazy(() => import("@/pages/laboratory/patients/LaboratoryPatientsList"));
const LabAdmittedList = lazy(() => import("@/pages/laboratory/admitted/LabAdmittedList"));
const LabAdmittedPatientDetails = lazy(() => import("@/pages/laboratory/admitted/LabAdmittedPatientDetails"));
const WritePrescription = lazy(() => import("@/pages/doctor/incoming/WritePrescription"));
const FrontDeskPaymentRecords = lazy(() => import("@/pages/frontdesk/payment-records/ReceiptRecord"));
const NursePaymentRecords = lazy(() => import("@/pages/nurse/payment-records/ReceiptRecord"));
const PharmacistPaymentRecords = lazy(() => import("@/pages/pharmacist/payment-records/ReceiptRecord"));

// Sonographer Dashboard Routes
const SonographerDashboard = lazy(() => import("@/pages/sonographer/dashboard/SonographerDashboard"));
const SonographerIncoming = lazy(() => import("@/pages/sonographer/incoming/Incoming"));
const SonographerIncomingDetails = lazy(() => import("@/pages/sonographer/incoming/IncomingDetails"));
const SonographerScanHistory = lazy(() => import("@/pages/sonographer/scan-history/ScanHistory"));
const SonographerPatients = lazy(() => import("@/pages/sonographer/patients/SonographerPatients"));
const SonographerAdmittedList = lazy(() => import("@/pages/sonographer/admitted/SonographerAdmittedList"));
const SonographerAdmittedPatientDetails = lazy(() => import("@/pages/sonographer/admitted/SonographerAdmittedPatientDetails"));
const AttendedToday = lazy(() => import("@/pages/doctor/attended-today/AttendedToday"));
const HmoConsultations = lazy(() => import("@/pages/hmo/incoming/HmoConsultations"));
const HmoConsultationDetail = lazy(() => import("@/pages/hmo/incoming/HmoConsultationDetail"));
const ViewAllAdmissions = lazy(() => import("@/pages/doctor/incoming/ViewAllAdmission"));
const PatientsHistory = lazy(() => import("@/pages/doctor/patients/PatientsHistory"));
const PatientHmoHistory = lazy(() => import("@/pages/hmo/incoming/PatientHmoHistory"));
const HMOPatients = lazy(() => import("@/pages/hmo/HmoPatients/HmoPatients"));
const PatientHmoHistoryFull = lazy(() => import("@/pages/hmo/incoming/PatientHmoHistoryFull"));
const HmoAdmissions = lazy(() => import("@/pages/hmo/admissions/HmoAdmissions"));
const HmoAdmissionDetails = lazy(() => import("@/pages/hmo/admissions/HmoAdmissionDetails"));
const PharmacyPatients = lazy(() => import("@/pages/pharmacist/PharmacyPatients/PharmacyPatients"));
const HMOLabResultDetails = lazy(() => import("@/pages/hmo/incoming/labResult"));
const IncomingLabResults = lazy(() => import("@/pages/doctor/labResults/IncomingLabResult"));
const NurseIncomingLabResults = lazy(() => import("@/pages/nurse/labResults/IncomingLabResult"));
const HmoIncomingLabResults = lazy(() => import("@/pages/hmo/labResults/IncomingLabResult"));
const PharmacistAttendedToday = lazy(() => import("@/pages/pharmacist/attendedToday/AttendedToday"));
const PharmacyAdmissions = lazy(() => import("@/pages/pharmacist/admissions/PharmacyAdmissions"));
const PharmacyAdmittedPatient = lazy(() => import("@/pages/pharmacist/admissions/PharmacyAdmittedPatient"));



const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-gray-500 font-medium">Loading module...</span>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

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
      <Route path="/frontdesk/opd-patients" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <OpdPatients />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/opd-patients/new" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <AddOpdPatient />
        </ProtectedRoute>
      } />
      <Route path="/frontdesk/opd-patients/:id/edit" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <AddOpdPatient />
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
      <Route path="/frontdesk/payment-records" element={
        <ProtectedRoute allowedRoles={['frontdesk', 'front-desk']}>
          <FrontDeskPaymentRecords />
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
      <Route path="/dashboard/nurse/view-vitals/:patientId" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <ViewAllPatientVitals />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/view-admissions/:patientId" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <ViewAllAdmission />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/patient/:patientId/antenatal-records" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <NurseAntenatalRecords />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/dependant/:dependantId" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <DependantVitalsDetails />
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
      <Route path="/dashboard/nurse/admitted" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <AdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/admittedList" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <AdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/admitted/:patientId" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <AdmittedPatient />
        </ProtectedRoute>
      } />
      <Route path="/book" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <BookAppointmentModal />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/payment-records" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <NursePaymentRecords />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nurse/lab-results" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <NurseIncomingLabResults />
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

    <Route path="/dashboard/doctor/medical-record-history/:patientId" element={
   <ProtectedRoute allowedRoles={['doctor']}>
      <MedicalRecordHistory />
    </ProtectedRoute>
     } />
  <Route path="/dashboard/doctor/view-consultation-records/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewConsultationRecords />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/view-prescriptions/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewAllPrescriptions />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/view-investigations/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewAllInvestigations />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/view-admissions/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewAllAdmissions />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/view-lab-results/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewAllLabResults />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/view-vitals/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewAllVitals />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/antenatal-records/:patientId/:recordId?" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <AntenatalRecords />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/antenatal-records/:patientId/view" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <AntenatalRecordDetails />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/patientshistory" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <PatientsHistory />
    </ProtectedRoute>
  } />
<Route path="/dashboard/doctor/antenatal-records/:patientId" element={<AntenatalRecords />} />
<Route path="/dashboard/doctor/antenatal-records/:patientId/edit/:recordIndex" element={<AntenatalRecords />} />
  <Route path="/dashboard/doctor/medical-history/:patientId/add" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <AddDiagnosis />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/medical-history/:patientId/consultation/:consultationId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <ViewConsultation />
    </ProtectedRoute>
  } />  <Route path="/dashboard/doctor/medical-history/:patientId/consultation/:consultationId/edit" element={
    <ProtectedRoute allowedRoles={["doctor", "medical-director"]}>
      <EditConsultation />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/doctor/medical-history/:patientId/consultation/:consultationId/prescription" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <WritePrescription />
    </ProtectedRoute>
  } />


  <Route path="/dashboard/doctor/medical-history/:patientId/antenatal/:antenatalId/prescription" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <WritePrescription />
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
  <Route path="/dashboard/doctor/send-to-nurse/:patientId" element={
    <ProtectedRoute allowedRoles={['doctor']}>
      <SendToNurse />
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
      <Route path="/dashboard/doctor/attended-today" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <AttendedToday />
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
      <Route path="/dashboard/doctor/lab-results" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <IncomingLabResults />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/admitted" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DRAdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/admitted/:patientId" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DRAdmittedPatient />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/admittedPatients" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DRAdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/doctor/admittedPatients/:patientId" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DRAdmittedPatient />
        </ProtectedRoute>
      } />

      {/*==============================================================================================================

      ====================================  Medical Director DashBoard Route =====================================================

      ================================================================================================================*/}
      <Route path="/dashboard/medical-director" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDDashboard />
        </ProtectedRoute>
      } />
  <Route path="/dashboard/medical-director/patientVitals" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <PatientVitals />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/medical-history/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDPatientMedicalHistory />
    </ProtectedRoute>
  } />

  <Route path="/dashboard/medical-director/medical-record-history/:patientId" element={
   <ProtectedRoute allowedRoles={['medical-director']}>
      <MDMedicalRecordHistory />
    </ProtectedRoute>
     } />
  <Route path="/dashboard/medical-director/view-consultation-records/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewConsultationRecords />
    </ProtectedRoute>
  } />
    <Route path="/dashboard/medical-director/view-admissions/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewAllAdmissions />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/view-prescriptions/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewAllPrescriptions />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/view-investigations/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewAllInvestigations />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/view-lab-results/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewAllLabResults />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/view-vitals/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewAllVitals />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/antenatal-records/:patientId/:recordId?" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDAntenatalRecords />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/antenatal-records/:patientId/view" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDAntenatalRecordDetails />
    </ProtectedRoute>
  } />
      <Route path="/dashboard/medical-director/patients" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDPatients />
        </ProtectedRoute>
      } />
<Route path="/dashboard/medical-director/antenatal-records/:patientId" element={<MDAntenatalRecords />} />
<Route path="/dashboard/medical-director/antenatal-records/:patientId/edit/:recordIndex" element={<MDAntenatalRecords />} />
  <Route path="/dashboard/medical-director/medical-history/:patientId/add" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDAddDiagnosis />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/medical-history/:patientId/consultation/:consultationId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDViewConsultation />
    </ProtectedRoute>
  } />  <Route path="/dashboard/medical-director/medical-history/:patientId/consultation/:consultationId/edit" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDEditConsultation />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/medical-history/:patientId/consultation/:consultationId/prescription" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDWritePrescription />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/medical-history/:patientId/antenatal/:antenatalId/prescription" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDWritePrescription />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/send-to-cashier/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDSendToCashier />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/send-to-pharmacy/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDSendToPharmacy />
    </ProtectedRoute>
  } />
  <Route path="/dashboard/medical-director/send-to-nurse/:patientId" element={
    <ProtectedRoute allowedRoles={['medical-director']}>
      <MDSendToNurse />
    </ProtectedRoute>
  } />
      <Route path="/dashboard/medical-director/labResults" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDIncomingLabResults />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/labResults/:labResultId" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDLabResultDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/appointments" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAppointment />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/incoming" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <IncomingMD />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/attended-today" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAttendedToday />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/allPatients" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAllPatients />
          <MDAttendedToday />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/assign-task" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDTask />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/payment-records" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDPaymentRecords />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/admitted" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/admitted/:patientId" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAdmittedPatient />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/admittedPatients" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/medical-director/admittedPatients/:patientId" element={
        <ProtectedRoute allowedRoles={['medical-director']}>
          <MDAdmittedPatient />
        </ProtectedRoute>
      } />

      {/* HMO Dashboard Routes */}
      <Route path="/dashboard/hmo" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HmoDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/incoming" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <IncomingHmo />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/incoming/:patientId" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <IncomingHmoDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/patient-history/:patientId" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <PatientHmoHistoryFull />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/patients" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HMOPatients />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/patients" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HMOPatients />
        </ProtectedRoute>
      } />
        <Route path="/dashboard/hmo/labResults/:labResultId" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HMOLabResultDetails />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard/hmo/consultations" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HmoConsultations />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/consultations/:id" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HmoConsultationDetail />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/lab-results" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HmoIncomingLabResults />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/admissions" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HmoAdmissions />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/hmo/admissions/:patientId/:admissionId" element={
        <ProtectedRoute allowedRoles={['hmo']}>
          <HmoAdmissionDetails />
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
      {/* <Route path="/superadmin/patients" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <Navigate to="/superadmin/patients/Patients" replace />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/patients/patients" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <Navigate to="/superadmin/patients/Patients" replace />
        </ProtectedRoute>
      } /> */}
      <Route path="/superadmin/patients" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminPatients />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/patients/patientDetails/:patientId" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperPatientDetails />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/admitted" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminAdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/admitted/patient/:patientId" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminAdmittedPatient />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/admitted/patient/:patientId/dependant/:dependantId" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminAdmittedPatient />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/admitted/dependant/:dependantId" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminAdmittedPatient />
        </ProtectedRoute>
      } />
      {/* <Route path="/superadmin/patients/:patientId" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperPatientDetails />
        </ProtectedRoute>
      } /> */}
      <Route path="/superadmin/registration" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminRegistration />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/appointments" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <SuperAdminAppointments />
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
      <Route path="/superadmin/settings/medical-data" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <MedicalData />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/pharmacy-inventory" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <PharmacyInventory />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/pharmacy-inventory" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <PharmacyInventory />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/laboratory-inventory" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <LaboratoryInventory />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/settings/pharmacy-reviews" element={
        <ProtectedRoute allowedRoles={['super-admin']}>
          <PharmacyReview />
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
      <Route path="/cashier/receipt-details/:receiptId" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <ReceiptDetails />
        </ProtectedRoute>
      } />
      <Route path="/cashier/payment-receipt-history/:patientId" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <PaymentReceiptHistory />
        </ProtectedRoute>
      } />
      <Route path="/cashier/generate-bill" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <GenerateBill />
        </ProtectedRoute>
      } />
      <Route path="/cashier/opd-patients" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierOpdPatients />
        </ProtectedRoute>
      } />
      <Route path="/cashier/opd-patients/new" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CreateOpdPatient />
        </ProtectedRoute>
      } />
      <Route path="/cashier/opd-patient-details/:patientId" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierOpdPatientDetails />
        </ProtectedRoute>
      } />
       <Route path="/cashier/opd-patients/:id/edit" element={
        <ProtectedRoute allowedRoles={['cashier', 'cashier']}>
          <CreateOpdPatient />
        </ProtectedRoute>
      } />
      <Route path="/cashier/admissions" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierAdmissions />
        </ProtectedRoute>
      } />
      <Route path="/cashier/admissions/:admissionId" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <CashierAdmissionDetails />
        </ProtectedRoute>
      } />
 
      <Route path="/cashier/generate-bill/:patientId" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <GenerateBill />
        </ProtectedRoute>
      } />
      <Route path="/cashier/billing/:id" element={
        <ProtectedRoute allowedRoles={['cashier']}>
          <BillingRecords />
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
      <Route path="/dashboard/pharmacist/patients" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacyPatients />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/incoming/:patientId" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistIncomingDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/attended-today" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistAttendedToday />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/admissions" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacyAdmissions />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pharmacist/admissions/:patientId" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacyAdmittedPatient />
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
      <Route path="/dashboard/pharmacist/payment-records" element={
        <ProtectedRoute allowedRoles={['pharmacist']}>
          <PharmacistPaymentRecords />
        </ProtectedRoute>
      } />




         {/*==============================================================================================================

      ====================================  Surgeon DashBoard Route =====================================================

      ================================================================================================================*/}
      <Route path="/dashboard/surgeon" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
          <SurgeonDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/surgeon/assignedTask" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
          <SurgeonAssignedTask />
        </ProtectedRoute>
      } />


      <Route path="/dashboard/surgeon/incoming" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
          <SurgeonIncoming />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/surgeon/appointments" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
          <SurgeonAppointments />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/surgeon/surgical-notes" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
          <SurgeonNoteHistory />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/surgeon/write-surgical-note/:investigationRequestId" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
            <WriteSurgicalNote />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/surgeon/write-surgical-note" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
            <WriteSurgicalNote />
        </ProtectedRoute>
      } />
      <Route path="/book" element={
        <ProtectedRoute allowedRoles={['surgeon']}>
          <BookAppointmentModal />
        </ProtectedRoute>
      } />





      {/*==============================================================================================================

      ====================================  Laboratory DashBoard Route ===============================================
      ===============================================================================================================*/}
      {/* LaboratoryDashboard */}
            <Route path="/dashboard/laboratory" element={
        <ProtectedRoute allowedRoles={['lab-technician']}>
          <LaboratoryDashboard />
        </ProtectedRoute>
      } />
      {/* <Route path="/dashboard/laboratory" element={<LaboratoryDashboard />} allowedRoles={['laboratory']} /> */}
      <Route
        path="/dashboard/laboratory/incoming"
        element={<IncomingLaboratory />}
      />
      <Route
        path="/dashboard/laboratory/ordered"
        element={<OrderedLab />}
      />
      <Route
        path="/dashboard/laboratory/incoming-scan"
        element={<IncomingScan />}
      />
      <Route
        path="/dashboard/laboratory/results/add/:investigationId"
        element={<AddLabResult />}
      />
      <Route
        path="/dashboard/laboratory/results/add-opd"
        element={<AddLabResult />}
      />
      <Route
        path="/dashboard/laboratory/results/edit/:labResultId"
        element={<AddLabResult />}
      />
      <Route
        path="/dashboard/laboratory/results/:labResultId"
        element={<ViewLabResult />}
      />
      <Route
        path="/dashboard/laboratory/results/history"
        element={<LabResultsHistory />}
      />
      {/* <Route
        path="/dashboard/laboratory/inventoryStocks"
        element={<InventorySTOCKS />}
      /> */}
      <Route
        path="/dashboard/laboratory/inventory&stocks"
        element={<InventoryAndStocks />}
      />
      <Route
        path="/dashboard/laboratory/Reports"
        element={<LaboratoryReports />}
      />
      <Route
        path="/dashboard/laboratory/modal"
        element={<TestRequestModal />}
      />
      <Route
        path="/dashboard/laboratory/completed"
        element={<CompletedTests />}
      />
      <Route
        path="/dashboard/laboratory/patients/:patientId"
        element={<LaboratoryPatientProfile />}
      />
      <Route
        path="/dashboard/laboratory/patients"
        element={<LaboratoryPatientsList />}
      />
      <Route
        path="/dashboard/laboratory/admitted"
        element={<LabAdmittedList />}
      />
      <Route
        path="/dashboard/laboratory/admitted/:patientId"
        element={<LabAdmittedPatientDetails />}
      />

      {/*==============================================================================================================

      ====================================  Sonographer DashBoard Route ================================================
      ===============================================================================================================*/}
      <Route path="/dashboard/sonographer" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sonographer/incoming" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerIncoming />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sonographer/incoming/:patientId" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerIncomingDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sonographer/patients" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerPatients />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sonographer/admitted" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerAdmittedList />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sonographer/admitted/:patientId" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerAdmittedPatientDetails />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/sonographer/scan-history" element={
        <ProtectedRoute allowedRoles={['sonographer']}>
          <SonographerScanHistory />
        </ProtectedRoute>
      } />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
