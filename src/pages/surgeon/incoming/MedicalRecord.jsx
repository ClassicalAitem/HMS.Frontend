import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import PatientSummaryCard from "@/components/doctor/patient/PatientSummaryCard";
import MedicalHistoryTable from "@/components/surgeon/patient/MedicalHistoryTable";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import VitalsHistoryTable from "@/components/doctor/patient/VitalsHistoryTable";
import RecordVitalsModal from "@/components/doctor/patient/RecordVitalsModal";
import { getVitalsByPatient, createVital } from "@/services/api/vitalsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getConsultations } from "@/services/api/consultationAPI";
import { getLabResults } from "@/services/api/labResultsAPI";

const MedicalRecord = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [patient, setPatient] = useState(null); const [consultations, setConsultations] = useState([]);
  const [labResults, setLabResults] = useState([]);

  useEffect(() => {
    const snap = location?.state?.patientSnapshot;
    if (snap) {
      setPatient((prev) => prev || snap);
    }
  }, [location?.state]);


  useEffect(() => {
    let mounted = true;
    const loadLabs = async () => {
      try {
        setLoading(true);
        const res = await getLabResults({ patientId });
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (mounted) setLabResults(list);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadLabs();
    return () => { mounted = false; };
  }, [patientId]);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
         
          <PatientSummaryCard patient={patient} loading={loading} />

          <MedicalHistoryTable
            rows={useMemo(() => (
              Array.isArray(consultations) ? consultations.map((c) => ({
                id: c?._id || c?.id,
                type: "Consultation",
                diagnosis: c?.diagnosis || "—",
                time: c?.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
                date: c?.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US") : "—",
                notes: c?.notes || "—",
              })) : []
            ), [consultations])}
            loading={loading}
            onAdd={() => navigate(`/dashboard/surgeon/medical-history/${patientId}/add-surgical-note`, { state: { patientSnapshot: patient } })}
            onViewDetails={(row) => {
              const cid = row?.id;
              if (cid) navigate(`/dashboard/surgeon/medical-history/${patientId}/consultation/${cid}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } });
            }}
          />
            
        </div>
      </div>
    </div>
  );
};

export default MedicalRecord;
