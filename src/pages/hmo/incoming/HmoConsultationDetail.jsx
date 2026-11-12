import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { HmoLayout } from "@/layouts/hmo";
import KolakLoader from "@/components/common/KolakLoader";
import { getConsultationById } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getPrescriptionsForConsultation } from "@/services/api/prescriptionsAPI";
import { RiArrowLeftLine } from "react-icons/ri";
import { FaPrescriptionBottleAlt, FaClipboardList } from "react-icons/fa";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

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
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const [consultRes, rxRes] = await Promise.allSettled([
          getConsultationById(id),
          getPrescriptionsForConsultation(id),
        ]);

        let consultData = null;
        if (consultRes.status === 'fulfilled') {
          consultData = consultRes.value?.data?.data ?? consultRes.value?.data ?? consultRes.value;
          if (mounted) setConsultation(consultData);
        }

        if (rxRes.status === 'fulfilled') {
          const raw = rxRes.value?.data ?? rxRes.value ?? [];
          const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
          if (mounted) setPrescriptions(list);
        }

        if (consultData?.patientId) {
          const patRes = await getPatientById(consultData.patientId).catch(() => null);
          const patData = patRes?.data?.data ?? patRes?.data ?? patRes;
          if (mounted && patData) setPatient(patData);
        }
      } catch (err) {
        console.error("Failed to load consultation details:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (id) fetchAllData();
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
    <HmoLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="space-y-6 min-w-0">
        {/* Back + title */}
        <div className="flex items-center gap-3">
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
          <div className="py-16 flex justify-center">
            <KolakLoader />
          </div>
        ) : !consultation ? (
          <div className="alert alert-error max-w-md">Consultation not found.</div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {/* Subject banner */}
            <div className={`rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 ${
              isDependant ? 'bg-secondary/10 border border-secondary/20' : 'bg-primary/10 border border-primary/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                  isDependant ? 'bg-secondary text-secondary-content' : 'bg-primary text-primary-content'
                }`}>
                  {subjectName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base-content text-base">{subjectName}</span>
                    <span className={`badge badge-sm ${isDependant ? 'badge-secondary' : 'badge-primary'}`}>
                      {isDependant ? (consultation.dependant?.relationshipType || 'Dependant') : 'Patient'}
                    </span>
                  </div>
                  {isDependant && patientName && (
                    <p className="text-xs text-base-content/60">Principal: {patientName}</p>
                  )}
                  <p className="text-xs text-base-content/50">{consultation.patient?.hospitalId || '—'}</p>
                </div>
              </div>

              {/* HMO plan badge */}
              <div className="flex flex-col items-end gap-1">
                {hmos.length > 0 ? (
                  hmos.map(h => (
                    <span key={h.id || h._id} className="badge badge-info badge-sm">
                      {h.provider} {h.plan ? `(${h.plan})` : ''}
                    </span>
                  ))
                ) : (
                  <span className="badge badge-ghost badge-sm">No HMO attached</span>
                )}
                <span className="text-xs text-base-content/50">
                  {formatNigeriaDateTime(consultation.createdAt)}
                </span>
              </div>
            </div>

            {/* Visit Details */}
            <Section title="Visit Details">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Visit Reason" value={consultation.visitReason} />
                <Field label="Department" value={consultation.department} />
                <Field label="Doctor" value={doctorName || '—'} />
                <Field label="Consultation Date" value={formatNigeriaDate(consultation.createdAt)} />
                <Field label="Blood Pressure" value={consultation.vitals?.bloodPressure || consultation.bloodPressure} />
                <Field label="Temperature" value={consultation.vitals?.temperature ? `${consultation.vitals.temperature} °C` : null} />
              </div>
            </Section>

            {/* Diagnosis */}
            <Section title="Diagnosis">
              <p className="text-sm text-base-content/80 whitespace-pre-wrap">{consultation.diagnosis || 'No diagnosis recorded'}</p>
              {consultation.provisionalDiagnosis && (
                <div className="mt-3 pt-3 border-t border-base-200">
                  <span className="text-xs text-base-content/50 block mb-1">Provisional Diagnosis</span>
                  <p className="text-sm text-base-content/70">{consultation.provisionalDiagnosis}</p>
                </div>
              )}
            </Section>

            {/* Prescriptions */}
            <Section title={`Prescriptions (${prescriptions.length})`}>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-base-content/50">No prescriptions attached to this consultation.</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((p, idx) => (
                    <div key={p.id || idx} className="p-3 bg-base-200/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-base-content/70 flex items-center gap-1.5">
                          <FaPrescriptionBottleAlt className="text-primary" />
                          Prescription #{idx + 1}
                        </span>
                        {p.status && (
                          <span className="badge badge-sm badge-ghost uppercase text-[10px]">{p.status}</span>
                        )}
                      </div>
                      {Array.isArray(p.medications) && p.medications.length > 0 ? (
                        <div className="divide-y divide-base-200">
                          {p.medications.map((m, mIdx) => (
                            <div key={mIdx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="font-semibold text-base-content">{m.drugName || m.name || '—'}</span>
                                {m.dosage && <span className="text-base-content/60 ml-2">{m.dosage}</span>}
                                {m.frequency && <span className="text-base-content/50 ml-1">· {m.frequency}</span>}
                                {m.duration && <span className="text-base-content/50 ml-1">· {m.duration}</span>}
                              </div>
                              <div className="text-right shrink-0">
                                {m.quantity && <span className="badge badge-ghost badge-xs">Qty: {m.quantity}</span>}
                                {m.route && <span className="ml-1 text-base-content/40">{m.route}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-base-content/50">{p.notes || 'No medication details'}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Medical & Clinical Notes */}
            {consultation.medicalHistory && (
              <Section title="Medical History">
                <p className="text-sm text-base-content/80 whitespace-pre-wrap">{consultation.medicalHistory}</p>
              </Section>
            )}

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
    </HmoLayout>
  );
};

export default HmoConsultationDetail;
