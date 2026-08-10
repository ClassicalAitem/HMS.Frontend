import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getConsultationById } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { RiArrowLeftLine } from "react-icons/ri";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import { FaClipboardList } from "react-icons/fa";

const Section = ({ title, children }) => (
  <div className="card bg-base-100 border border-base-200 shadow-sm">
    <div className="card-body p-4 sm:p-5">
      <h3 className="font-semibold text-base-content mb-3 text-base">{title}</h3>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, className = "" }) => (
  <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
    <span className="text-xs text-base-content/50">{label}</span>
    <span className="text-sm text-base-content font-medium break-words">{value || '—'}</span>
  </div>
);

const HmoConsultationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(location.state?.consultation || null);
  const [patient, setPatient] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchConsultation = async () => {
      try {
        setLoading(true);
        const res = await getConsultationById(id);
        const data = res?.data?.data ?? res?.data ?? res;
        if (mounted) setConsultation(data);

        if (data?.patientId) {
          const patRes = await getPatientById(data.patientId);
          const patData = patRes?.data?.data ?? patRes?.data ?? patRes;
          if (mounted) setPatient(patData);
        }
      } catch (err) {
        console.error("Failed to load consultation:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchConsultation();
    return () => { mounted = false; };
  }, [id]);

  const isDependant = !!consultation?.dependantId;
  const subjectName = isDependant
    ? `${consultation?.dependant?.firstName || ''} ${consultation?.dependant?.lastName || ''}`.trim()
    : `${consultation?.patient?.firstName || ''} ${consultation?.patient?.lastName || ''}`.trim();
  const patientName = `${consultation?.patient?.firstName || ''} ${consultation?.patient?.lastName || ''}`.trim();
  const doctorName = `${consultation?.doctor?.firstName || ''} ${consultation?.doctor?.lastName || ''}`.trim();

  // HMO coverage for this subject
  const hmos = isDependant
    ? (patient?.hmos || []).filter(h => h.dependantId === consultation?.dependantId)
    : (patient?.hmos || []).filter(h => !h.dependantId);

  return (
    <div className="flex min-h-screen w-full">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base-100">
        <Header onToggleSidebar={() => setIsSidebarOpen(v => !v)} />

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Back + title */}
          <div className="flex items-center gap-3 mb-6">
            <button
              className="btn btn-ghost btn-sm btn-circle shrink-0"
              onClick={() => navigate('/dashboard/hmo/consultations')}
            >
              <RiArrowLeftLine size={18} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <FaClipboardList size={20} className="text-primary shrink-0" />
              <h1 className="text-lg font-bold text-primary sm:text-xl truncate">Consultation Detail</h1>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-xl w-full" />
              ))}
            </div>
          ) : !consultation ? (
            <div className="alert alert-error max-w-md">Consultation not found.</div>
          ) : (
            <div className="space-y-4 max-w-4xl">

              {/* Subject banner */}
              <div className={`rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 ${
                isDependant ? 'bg-secondary/10 border border-secondary/20' : 'bg-primary/10 border border-primary/20'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isDependant ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                  }`}>
                    {subjectName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-base-content truncate">{subjectName}</p>
                    {isDependant && (
                      <p className="text-sm text-base-content/60 truncate">
                        Dependant of {patientName} · {consultation?.dependant?.relationshipType || 'Dependant'}
                      </p>
                    )}
                    {!isDependant && patient?.hospitalId && (
                      <p className="text-sm text-base-content/60">{patient.hospitalId}</p>
                    )}
                  </div>
                </div>
                <span className={`badge shrink-0 ${isDependant ? 'badge-secondary' : 'badge-primary'}`}>
                  {isDependant ? 'Dependant' : 'Patient'}
                </span>
              </div>

              {/* HMO Coverage */}
              {hmos.length > 0 && (
                <Section title="HMO Coverage">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hmos.map(hmo => (
                      <div key={hmo.id} className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="font-semibold text-sm text-success capitalize">{hmo.provider || '—'}</p>
                        <div className="mt-1 space-y-0.5 text-xs text-base-content/70">
                          <div className="break-words">Member ID: {hmo.memberId || '—'}</div>
                          {hmo.plan && <div className="break-words">Plan: {hmo.plan}</div>}
                          <div>Expires: {hmo.expiresAt ? formatNigeriaDate(hmo.expiresAt) : '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Consultation overview */}
              <Section title="Consultation Overview">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Visit Reason" value={consultation.visitReason} />
                  <Field label="Doctor" value={doctorName || '—'} />
                  <Field label="Date" value={consultation.createdAt ? formatNigeriaDate(consultation.createdAt) : '—'} />
                  <Field
                    label="Diagnosis"
                    value={consultation.diagnosis}
                    className="col-span-2 sm:col-span-3"
                  />
                </div>
              </Section>

              {/* Complaints */}
              {consultation.complaint?.length > 0 && (
                <Section title="Complaints">
                  <div className="space-y-2">
                    {consultation.complaint.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-base-200/50">
                        <span className="text-sm font-medium truncate">{c.symptom || '—'}</span>
                        <span className="text-xs text-base-content/50 shrink-0">{c.durationInDays ? `${c.durationInDays} day(s)` : ''}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Medical history */}
              {consultation.medicalHistory && (
                <Section title="Medical History">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">{consultation.medicalHistory}</p>
                </Section>
              )}

              {/* Family history */}
              {consultation.familyHistory?.length > 0 && (
                <Section title="Family History">
                  <div className="space-y-2">
                    {consultation.familyHistory.map((f, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-base-200/50">
                        <span className="text-xs text-base-content/50 w-20 shrink-0">{f.relation || '—'}</span>
                        <span className="text-sm font-medium">{f.condition || '—'}</span>
                        {f.value && <span className="text-xs text-base-content/50 sm:ml-auto">{f.value}</span>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Allergic history */}
              {consultation.allergicHistory && (
                <Section title="Allergic History">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">{consultation.allergicHistory}</p>
                </Section>
              )}

              {/* Notes */}
              {consultation.notes && (
                <Section title="Doctor's Notes">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">{consultation.notes}</p>
                </Section>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HmoConsultationDetail;