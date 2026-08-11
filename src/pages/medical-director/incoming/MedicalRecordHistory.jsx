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
          className="flex items-center justify-between p-4 sm:p-5 w-full text-left"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className={`flex items-center gap-2 sm:gap-3 min-w-0 ${color}`}>
            <span className="shrink-0">{icon}</span>
            <h3 className="font-bold uppercase text-xs sm:text-sm tracking-wider truncate">{title}</h3>
            <span className="badge badge-sm badge-outline ml-1 shrink-0">{count}</span>
          </div>
          {collapsed
            ? <FaChevronDown className="w-4 h-4 text-base-content/40 shrink-0" />
            : <FaChevronUp className="w-4 h-4 text-base-content/40 shrink-0" />
          }
        </button>
        {!collapsed && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
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

// ─── Mobile Field Row (used inside stacked mobile cards) ──────────────────────
const MobileField = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 py-1">
    <span className="text-[11px] uppercase tracking-wider text-base-content/40 shrink-0">{label}</span>
    <span className="text-sm text-base-content text-right break-words">{value || '—'}</span>
  </div>
);

// ─── Mobile Card Wrapper ────────────────────────────────────────────────────────
const MobileCard = ({ children }) => (
  <div className="rounded-lg border border-base-200 bg-base-100 p-3 space-y-1">
    {children}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const MedicalRecordHistory = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search || window.location.search || "");

  // ✅ URL query param takes priority — survives refresh/back-forward
  const dependantId = searchParams.get('dependantId')
    || location?.state?.dependantId
    || location?.state?.selectedDependantId
    || null;

  const dependantSnapshot = location?.state?.dependantSnapshot || location?.state?.selectedDependantSnapshot || null;
  const isViewingDependant = !!dependantId;
  const snapshot = location?.state?.patientSnapshot || null;
  const targetPatientId = location?.state?.patientId || patientId;

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
          getConsultations({ patientId: targetPatientId, ...(dependantId ? { dependantId } : {}) }),
          snapshot ? Promise.resolve(null) : getPatientById(targetPatientId),
        ]);

        if (consultRes.status === 'fulfilled') {
          const raw = consultRes.value?.data ?? consultRes.value ?? [];
          let list = Array.isArray(raw) ? raw : (raw?.data ?? []);
          if (isViewingDependant && dependantId) {
            list = list.filter(c => c.dependantId === dependantId);
          } else {
            list = list.filter(c => !c.dependantId);
          }
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
  }, [targetPatientId, dependantId, isViewingDependant, snapshot]);

  const patientName = useMemo(() => {
    if (isViewingDependant) {
      return dependantSnapshot?.fullName || `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim() || 'Dependant';
    }
    return patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
  }, [patient, isViewingDependant, dependantSnapshot]);

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

      (c.medicalHistory || []).forEach(item => {
        const name = typeof item === 'object' ? item.title || item.name || '' : item;
        if (name && !medicalHistory.find(e => e.name.toLowerCase() === name.toLowerCase())) {
          medicalHistory.push({ name, date, doctor, consultationId: c._id || c.id });
        }
      });

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

      (c.allergicHistory || []).forEach(item => {
        const name = typeof item === 'object'
          ? item.allergen || item.title || item.name || ''
          : item;
        const reaction = typeof item === 'object' ? item.reaction || null : null;
        if (name && !allergyHistory.find(e => e.name.toLowerCase() === name.toLowerCase())) {
          allergyHistory.push({ name, reaction, date, doctor, consultationId: c._id || c.id });
        }
      });

      (c.familyHistory || []).forEach(item => {
        const relation = typeof item === 'object' ? item.relation || item.title || '' : item;
        const condition = typeof item === 'object' ? item.condition || item.value || '' : '';
        if (relation) {
          familyHistory.push({ relation, condition, date, doctor, consultationId: c._id || c.id });
        }
      });

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
      <div className="min-h-screen flex flex-col bg-base-200/50">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <Sidebar />
        </div>
        <div className="flex overflow-hidden flex-col flex-1 lg:ml-64">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-4">
            <div className="skeleton h-10 w-full sm:w-64 rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200/50">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 lg:ml-64">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">

          {/* ─── Page Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-base-100 p-4 sm:p-6 rounded-xl shadow-sm border border-base-200">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-full text-primary hidden sm:flex shrink-0">
                <FaHeartbeat className="w-6 h-6" />
              </div>
            <button
              className="btn btn-ghost btn-circle btn-sm sm:btn-md text-base-content/70 hover:bg-base-200 self-end sm:self-auto shrink-0"
              onClick={() => navigate(-1)}
            >
              <IoIosCloseCircleOutline className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-base-content">Medical Record History</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-base-content/70 mt-1">
                  <span className="flex items-center gap-1 min-w-0">
                    <FaUserMd className="w-3 h-3 shrink-0" />
                    <span className="truncate">{patientName}</span>
                    {isViewingDependant && (
                      <span className="badge badge-secondary badge-xs ml-1 shrink-0">
                        {dependantSnapshot?.relationshipType || 'Dependant'}
                      </span>
                    )}
                  </span>
                  {patient?.hospitalId && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>ID: {patient.hospitalId}</span>
                    </>
                  )}
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3 shrink-0" />
                    {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} on record
                  </span>
                </div>
              </div>
            </div>
          </div>

          {consultations.length === 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body items-center text-center py-12 sm:py-16 px-4">
                <FaHeartbeat className="w-10 h-10 sm:w-12 sm:h-12 text-base-content/20 mb-3" />
                <h3 className="font-semibold text-base-content/60 text-sm sm:text-base">No consultation records found</h3>
                <p className="text-xs sm:text-sm text-base-content/40 mt-1">
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
              <>
                <div className="hidden sm:block overflow-x-auto">
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
                <div className="sm:hidden space-y-2">
                  {aggregated.medicalHistory.map((item, idx) => (
                    <MobileCard key={idx}>
                      <p className="font-semibold text-base-content text-sm">{item.name}</p>
                      <MobileField label="Recorded On" value={item.date} />
                      <MobileField label="Recorded By" value={item.doctor} />
                    </MobileCard>
                  ))}
                </div>
              </>
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
              <>
                <div className="hidden sm:block overflow-x-auto">
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
                <div className="sm:hidden space-y-2">
                  {aggregated.surgicalHistory.map((item, idx) => (
                    <MobileCard key={idx}>
                      <p className="font-semibold text-base-content text-sm">{item.name}</p>
                      <MobileField label="Surgery Date" value={item.surgeryDate} />
                      <MobileField label="Recorded On" value={item.date} />
                      <MobileField label="Recorded By" value={item.doctor} />
                    </MobileCard>
                  ))}
                </div>
              </>
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
                <div className="alert alert-error alert-soft py-2 text-xs sm:text-sm">
                  ⚠ This {isViewingDependant ? 'dependant' : 'patient'} has {aggregated.allergyHistory.length} known allergen....
                </div>
                <div className="hidden sm:block overflow-x-auto">
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
                <div className="sm:hidden space-y-2">
                  {aggregated.allergyHistory.map((item, idx) => (
                    <MobileCard key={idx}>
                      <span className="badge badge-error badge-outline font-medium">{item.name}</span>
                      <MobileField label="Reaction" value={item.reaction} />
                      <MobileField label="Recorded On" value={item.date} />
                      <MobileField label="Recorded By" value={item.doctor} />
                    </MobileCard>
                  ))}
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
              <>
                <div className="hidden sm:block overflow-x-auto">
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
                <div className="sm:hidden space-y-2">
                  {aggregated.familyHistory.map((item, idx) => (
                    <MobileCard key={idx}>
                      <p className="font-semibold text-base-content text-sm">{item.relation}</p>
                      <MobileField label="Condition" value={item.condition} />
                      <MobileField label="Recorded On" value={item.date} />
                      <MobileField label="Recorded By" value={item.doctor} />
                    </MobileCard>
                  ))}
                </div>
              </>
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
              <>
                <div className="hidden sm:block overflow-x-auto">
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
                <div className="sm:hidden space-y-2">
                  {aggregated.socialHistory.map((item, idx) => (
                    <MobileCard key={idx}>
                      <p className="font-semibold text-base-content text-sm">{item.name}</p>
                      <MobileField label="Recorded On" value={item.date} />
                      <MobileField label="Recorded By" value={item.doctor} />
                    </MobileCard>
                  ))}
                </div>
              </>
            ) : <EmptyRow message="No social history recorded across all consultations." />}
          </SectionCard>

          <div className="h-8 sm:h-12" />
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordHistory;