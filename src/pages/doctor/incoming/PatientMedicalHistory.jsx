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
import { getLabResults } from "@/services/api/labResultsAPI";
import { getPrescriptionByPatientId } from "@/services/api/prescriptionsAPI";
import PrescriptionHistoryTable from "@/components/doctor/patient/PrescriptionHistoryTable";
import CreateBillModal from "@/components/modals/CreateBillModal";

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
  const [labResults, setLabResults] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    const loadLabs = async () => {
      try {
        setLabLoading(true);
        const res = await getLabResults({ patientId });
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (mounted) setLabResults(list);
      } finally {
        if (mounted) setLabLoading(false);
      }
    };
    loadLabs();
    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const loadPrescriptions = async () => {
      try {
        setPrescriptionsLoading(true);
        const res = await getPrescriptionByPatientId(patientId);
        // The API returns { data: { ...prescriptionObject } } or { data: [...] } or just the object/array
        // Based on the documentation, it returns a single object if there's one active prescription, or potentially an array.
        // However, the example response shows a single object in `data`.
        // Let's handle both cases: single object or array of objects.
        
        const rawData = res?.data ?? res;
        let list = [];

        if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData && typeof rawData === 'object') {
          // If it's a single object (and not an empty one), wrap it in an array
          if (Object.keys(rawData).length > 0) {
             list = [rawData];
          }
        }
        
        if (mounted) setPrescriptions(list);
      } catch (err) {
        console.error("Failed to load prescriptions", err);
      } finally {
        if (mounted) setPrescriptionsLoading(false);
      }
    };
    loadPrescriptions();
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

  const latestLab = useMemo(() => {
    if (!Array.isArray(labResults) || labResults.length === 0) return null;
    return labResults.slice().sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())[0];
  }, [labResults]);


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
              id: c?._id || c?.id,
              type: "Consultation",
              diagnosis: c?.diagnosis || "—",
              time: c?.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
              date: c?.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US") : "—",
              notes: c?.notes || "—",
            })) : []
          ), [consultations])} loading={loading} onAdd={() => navigate(`/dashboard/doctor/medical-history/${patientId}/add`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })} onViewDetails={(row) => {
            const cid = row?.id;
            if (cid) navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cid}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } });
          }} />

          <PrescriptionHistoryTable 
            loading={prescriptionsLoading}
            rows={useMemo(() => (
              Array.isArray(prescriptions) ? prescriptions.map((p) => ({
                id: p?._id || p?.id,
                status: p?.status || 'pending',
                date: p?.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US") : "—",
                medicationsCount: p?.medications?.length || 0,
                medicationsSummary: p?.medications?.slice(0, 2).map(m => `${m.drugName} (${m.dosage})`) || []
              })) : []
            ), [prescriptions])}
          />

          <CurrentVitalsCard patient={patient} latest={latest} loading={loading} onRecordOpen={() => setIsRecordOpen(true)} buttonHidden={true} />

          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-base-content">Latest Lab Result</h3>
                  {labLoading ? (
                    <div className="skeleton h-4 w-48 mt-2" />
                  ) : latestLab ? (
                    <div className="text-sm text-base-content/70">
                      {latestLab?.result?.[0]?.code || latestLab?.result?.[0]?.value || '—'} • {latestLab?.createdAt ? new Date(latestLab.createdAt).toLocaleString() : '—'}
                    </div>
                  ) : (
                    <div className="text-sm text-base-content/70">No lab results</div>
                  )}
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!latestLab}
                  onClick={() => latestLab && navigate(`/dashboard/doctor/labResults/${latestLab?._id || latestLab?.id}`)}
                >
                  View Lab Result
                </button>
              </div>
            </div>
          </div>

          <VitalsHistoryTable sortedVitals={sortedVitals} loading={loading} />

          <div className="mt-6 flex items-start gap-10">
            <div>
              <button
                className="text-primary text-lg font-semibold hover:underline"
                onClick={() => setIsBillModalOpen(true)}
              >
                Send to cashier
              </button>
              <div className="text-xs text-base-content/70">(send to cashier for payments)</div>
            </div>
            <div>
              <button
                className="text-primary text-lg font-semibold hover:underline"
                onClick={() => navigate(`/dashboard/doctor/send-to-pharmacy/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}
              >
                Send to Pharmacy
              </button>
              <div className="text-xs text-base-content/70">(send to Pharmacy for Prescription)</div>
            </div>
          </div>

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
          
          <CreateBillModal 
            isOpen={isBillModalOpen}
            onClose={() => setIsBillModalOpen(false)}
            patientId={patientId}
            onSuccess={() => {
              // Optionally refresh billing history or navigate away
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
