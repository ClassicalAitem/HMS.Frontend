import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/medical-director/dashboard/Sidebar";
import { getConsultations } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { IoIosCloseCircleOutline } from "react-icons/io";
import {
  FaUserMd, FaHistory, FaSyringe, FaAllergies,
  FaUsers, FaHeartbeat, FaCalendarAlt, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ icon, title, color, children, count }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-0">
        <button
          className="flex items-center justify-between p-5 w-full text-left"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className={`flex items-center gap-3 ${color}`}>
            {icon}
            <h3 className="font-bold uppercase text-sm tracking-wider">{title}</h3>
            <span className="badge badge-sm badge-outline ml-1">{count}</span>
          </div>
          {collapsed
            ? <FaChevronDown className="w-4 h-4 text-base-content/40" />
            : <FaChevronUp className="w-4 h-4 text-base-content/40" />
          }
        </button>
        {!collapsed && (
          <div className="px-5 pb-5">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyRow = ({ message }) => (
  <p className="text-sm text-base-content/50 italic">{message}</p>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const MedicalRecordHistory = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot || null;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(snapshot || null);
  const [consultations, setConsultations] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen(s => !s);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [consultRes, patientRes] = await Promise.allSettled([
          getConsultations({ patientId }),
          snapshot ? Promise.resolve(null) : getPatientById(patientId),
        ]);

        if (consultRes.status === 'fulfilled') {
          const raw = consultRes.value?.data ?? consultRes.value ?? [];
          const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
          if (mounted) setConsultations(list);
        }

        if (patientRes.status === 'fulfilled' && patientRes.value) {
          const pData = patientRes.value?.data ?? patientRes.value;
          if (mounted && pData) setPatient(pData);
        }
      } catch (err) {
        console.error('Failed to load medical record history', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'
  ), [patient]);

  // ─── Aggregate all history entries across all consultations ─────────────────
  const aggregated = useMemo(() => {
    const medicalHistory = [];
    const surgicalHistory = [];
    const allergyHistory = [];
    const familyHistory = [];
    const socialHistory = [];

    consultations.forEach(c => {
      const date = c.createdAt ? formatNigeriaDate(c.createdAt) : '—';
      const doctor = c?.doctor
        ? `Dr. ${c.doctor.firstName || ''} ${c.doctor.lastName || ''}`.trim()
        : c?.doctorName || 'Unknown Doctor';

      // Medical History
      (c.medicalHistory || []).forEach(item => {
        const name = typeof item === 'object' ? item.title || item.name || '' : item;
        if (name && !medicalHistory.find(e => e.name.toLowerCase() === name.toLowerCase())) {
          medicalHistory.push({ name, date, doctor, consultationId: c._id || c.id });
        }
      });

      // Surgical History
      (c.surgicalHistory || []).forEach(item => {
        const name = typeof item === 'object'
          ? item.procedureName || item.procedure || item.title || item.name || ''
          : item;
        const surgeryDate = typeof item === 'object' && item.dateOfSurgery
          ? formatNigeriaDate(item.dateOfSurgery)
          : null;
        if (name) {
          surgicalHistory.push({ name, surgeryDate, date, doctor, consultationId: c._id || c.id });
        }
      });

      // Allergy History
      (c.allergicHistory || []).forEach(item => {
        const name = typeof item === 'object'
          ? item.allergen || item.title || item.name || ''
          : item;
        const reaction = typeof item === 'object' ? item.reaction || null : null;
        if (name && !allergyHistory.find(e => e.name.toLowerCase() === name.toLowerCase())) {
          allergyHistory.push({ name, reaction, date, doctor, consultationId: c._id || c.id });
        }
      });

      // Family History
      (c.familyHistory || []).forEach(item => {
        const relation = typeof item === 'object' ? item.relation || item.title || '' : item;
        const condition = typeof item === 'object' ? item.condition || item.value || '' : '';
        if (relation) {
          familyHistory.push({ relation, condition, date, doctor, consultationId: c._id || c.id });
        }
      });

      // Social History
      (c.socialHistory || []).forEach(item => {
        const name = typeof item === 'object'
          ? item.title || item.habit || item.name || ''
          : item;
        if (name && !socialHistory.find(e => e.name.toLowerCase() === name.toLowerCase())) {
          socialHistory.push({ name, date, doctor, consultationId: c._id || c.id });
        }
      });
    });

    return { medicalHistory, surgicalHistory, allergyHistory, familyHistory, socialHistory };
  }, [consultations]);

  // ─── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-4">
            <div className="skeleton h-10 w-64 rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">

          {/* ─── Page Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-xl shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary hidden sm:flex">
                <FaHeartbeat className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">Medical Record History</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70 mt-1">
                  <span className="flex items-center gap-1">
                    <FaUserMd className="w-3 h-3" />
                    {patientName}
                  </span>
                  {patient?.hospitalId && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>ID: {patient.hospitalId}</span>
                    </>
                  )}
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3" />
                    {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} on record
                  </span>
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-circle text-base-content/70 hover:bg-base-200"
              onClick={() => navigate(-1)}
            >
              <IoIosCloseCircleOutline className="w-8 h-8" />
            </button>
          </div>

          {/* ─── No consultations ─── */}
          {consultations.length === 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body items-center text-center py-16">
                <FaHeartbeat className="w-12 h-12 text-base-content/20 mb-3" />
                <h3 className="font-semibold text-base-content/60">No consultation records found</h3>
                <p className="text-sm text-base-content/40 mt-1">
                  Medical history will appear here once consultations are recorded.
                </p>
              </div>
            </div>
          )}

          {/* ─── Medical History ─── */}
          <SectionCard
            icon={<FaHistory className="w-4 h-4" />}
            title="Medical History"
            color="text-primary"
            count={aggregated.medicalHistory.length}
          >
            {aggregated.medicalHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-base-200 text-base-content/60 text-xs uppercase tracking-wider">
                      <th>Condition</th>
                      <th>Recorded On</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregated.medicalHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/30">
                        <td className="font-medium text-base-content">{item.name}</td>
                        <td className="text-base-content/60 text-sm">{item.date}</td>
                        <td className="text-base-content/60 text-sm">{item.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyRow message="No medical history recorded across all consultations." />}
          </SectionCard>

          {/* ─── Surgical History ─── */}
          <SectionCard
            icon={<FaSyringe className="w-4 h-4" />}
            title="Surgical History"
            color="text-secondary"
            count={aggregated.surgicalHistory.length}
          >
            {aggregated.surgicalHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-base-200 text-base-content/60 text-xs uppercase tracking-wider">
                      <th>Procedure</th>
                      <th>Surgery Date</th>
                      <th>Recorded On</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregated.surgicalHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/30">
                        <td className="font-medium text-base-content">{item.name}</td>
                        <td className="text-base-content/60 text-sm">{item.surgeryDate || '—'}</td>
                        <td className="text-base-content/60 text-sm">{item.date}</td>
                        <td className="text-base-content/60 text-sm">{item.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyRow message="No surgical history recorded across all consultations." />}
          </SectionCard>

          {/* ─── Allergy History ─── */}
          <SectionCard
            icon={<FaAllergies className="w-4 h-4" />}
            title="Allergy History"
            color="text-error"
            count={aggregated.allergyHistory.length}
          >
            {aggregated.allergyHistory.length > 0 ? (
              <div className="space-y-3">
                {/* Warning banner if allergies exist */}
                <div className="alert alert-error alert-soft py-2 text-sm">
                  ⚠ This patient has {aggregated.allergyHistory.length} known allergen{aggregated.allergyHistory.length !== 1 ? 's' : ''} on record.
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="border-b border-base-200 text-base-content/60 text-xs uppercase tracking-wider">
                        <th>Allergen</th>
                        <th>Reaction</th>
                        <th>Recorded On</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregated.allergyHistory.map((item, idx) => (
                        <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/30">
                          <td>
                            <span className="badge badge-error badge-outline font-medium">{item.name}</span>
                          </td>
                          <td className="text-base-content/60 text-sm">{item.reaction || '—'}</td>
                          <td className="text-base-content/60 text-sm">{item.date}</td>
                          <td className="text-base-content/60 text-sm">{item.doctor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <EmptyRow message="No allergies recorded across all consultations." />}
          </SectionCard>

          {/* ─── Family History ─── */}
          <SectionCard
            icon={<FaUsers className="w-4 h-4" />}
            title="Family History"
            color="text-info"
            count={aggregated.familyHistory.length}
          >
            {aggregated.familyHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-base-200 text-base-content/60 text-xs uppercase tracking-wider">
                      <th>Relation</th>
                      <th>Condition</th>
                      <th>Recorded On</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregated.familyHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/30">
                        <td className="font-medium text-base-content">{item.relation}</td>
                        <td className="text-base-content/70 text-sm">{item.condition || '—'}</td>
                        <td className="text-base-content/60 text-sm">{item.date}</td>
                        <td className="text-base-content/60 text-sm">{item.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyRow message="No family history recorded across all consultations." />}
          </SectionCard>

          {/* ─── Social History ─── */}
          <SectionCard
            icon={<FaUsers className="w-4 h-4" />}
            title="Social History"
            color="text-success"
            count={aggregated.socialHistory.length}
          >
            {aggregated.socialHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="border-b border-base-200 text-base-content/60 text-xs uppercase tracking-wider">
                      <th>Habit / Factor</th>
                      <th>Recorded On</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregated.socialHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/30">
                        <td className="font-medium text-base-content">{item.name}</td>
                        <td className="text-base-content/60 text-sm">{item.date}</td>
                        <td className="text-base-content/60 text-sm">{item.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyRow message="No social history recorded across all consultations." />}
          </SectionCard>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordHistory;