import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import PatientSummaryCard from "@/components/doctor/patient/PatientSummaryCard";
import MedicalHistoryTable from "@/components/doctor/patient/MedicalHistoryTable";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import VitalsHistoryTable from "@/components/doctor/patient/VitalsHistoryTable";
import RecordVitalsModal from "@/components/doctor/patient/RecordVitalsModal";
import { getVitalsByPatient, createVital } from "@/services/api/vitalsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getConsultations } from "@/services/api/consultationAPI";

const PatientMedicalHistory = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [patient, setPatient] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordForm, setRecordForm] = useState({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", notes: "" });
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    const snap = location?.state?.patientSnapshot;
    if (snap) {
      setPatient((prev) => prev || snap);
    }
  }, [location?.state]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getVitalsByPatient(patientId);
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (mounted) setVitals(list);

        const fromVitalsPatient = list?.[0]?.patient;
        if (fromVitalsPatient) {
          if (mounted) setPatient(fromVitalsPatient);
        } else {
          await getPatientById(patientId).then((pRes) => {
            const pData = pRes?.data ?? pRes;
            if (mounted) setPatient(pData);
          }).catch(() => {});
        }
      } catch {
        console.error("Failed to load vitals");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const loadConsultations = async () => {
      try {
        const res = await getConsultations({ patientId });
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (mounted) setConsultations(list);
      } catch {
      }
    };
    loadConsultations();
    return () => { mounted = false; };
  }, [patientId]);

  const latest = useMemo(() => {
    if (!Array.isArray(vitals) || vitals.length === 0) return null;
    return vitals.reduce((acc, v) => {
      const a = new Date(acc?.createdAt || 0).getTime();
      const b = new Date(v?.createdAt || 0).getTime();
      return b > a ? v : acc;
    }, vitals[0]);
  }, [vitals]);

  const sortedVitals = useMemo(() => {
    if (!Array.isArray(vitals)) return [];
    return [...vitals].sort((a, b) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return bt - at;
    });
  }, [vitals]);


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
          <PatientHeaderActions
            title="Patient Details"
            subtitle="Vitals overview and history"
            fromIncoming={fromIncoming}
            onBack={() => navigate(fromIncoming ? "/dashboard/doctor/incoming" : "/dashboard/doctor/patientVitals")}
          />

          <PatientSummaryCard patient={patient} loading={loading} />

          <MedicalHistoryTable rows={useMemo(() => (
            Array.isArray(consultations) ? consultations.map((c) => ({
              type: "Consultation",
              diagnosis: c?.diagnosis || "—",
              time: c?.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
              date: c?.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US") : "—",
              notes: c?.notes || "—",
            })) : []
          ), [consultations])} onAdd={() => navigate(`/dashboard/doctor/medical-history/${patientId}/add`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })} />

          <CurrentVitalsCard patient={patient} latest={latest} loading={loading} onRecordOpen={() => setIsRecordOpen(true)} buttonHidden={true} />

          <VitalsHistoryTable sortedVitals={sortedVitals} loading={loading} />

          <RecordVitalsModal
            isOpen={isRecordOpen}
            patientName={patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient"}
            recordForm={recordForm}
            setRecordForm={setRecordForm}
            recordError={recordError}
            recordLoading={recordLoading}
            onCancel={() => { setIsRecordOpen(false); setRecordForm({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", notes: "" }); setRecordError(""); }}
            onSubmit={async () => {
              try {
                setRecordLoading(true);
                setRecordError("");
                await createVital({ patientId, bp: recordForm.bp, pulse: recordForm.pulse, temperature: recordForm.temperature, weight: recordForm.weight, spo2: recordForm.spo2, notes: recordForm.notes });
                const res = await getVitalsByPatient(patientId);
                const raw = res?.data ?? res ?? [];
                const list = Array.isArray(raw) ? raw : raw?.data ?? [];
                setVitals(list);
                setIsRecordOpen(false);
                setRecordForm({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", notes: "" });
              } catch (e) {
                const msg = e?.response?.data?.message || "Failed to record vitals";
                setRecordError(msg);
              } finally {
                setRecordLoading(false);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;