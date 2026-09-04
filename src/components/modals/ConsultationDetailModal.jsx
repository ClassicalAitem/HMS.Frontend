import React, { useState, useEffect } from 'react';
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import { getWardRoundRelatedByConsultation } from '@/services/api/wardRoundApi';
import { getExaminationByConsultationId } from '@/services/api/examinationAPI';
import { getReviewOfSystemsByConsultationId } from '@/services/api/reviewOfSystemAPI';
import { getAdmissionsForConsultation } from '@/services/api/admissionApi';
import { 
  FiUser, 
  FiClock, 
  FiAlertCircle 
} from 'react-icons/fi';

const EmptyNote = ({ children = 'None recorded' }) => (
  <p className="text-sm text-base-content/40 italic">{children}</p>
);

const SectionHeader = ({ title, count, badgeColor = 'badge-primary' }) => (
  <summary className="collapse-title text-sm font-semibold uppercase tracking-wider text-base-content/80 flex items-center justify-between cursor-pointer select-none py-3 px-4 bg-base-200/50 hover:bg-base-200 transition-colors">
    <div className="flex items-center gap-2">
      <span>{title}</span>
      {count != null && (
        <span className={`badge badge-sm ${badgeColor}`}>
          {count}
        </span>
      )}
    </div>
  </summary>
);

const formatDoctorName = (doc, fallbackName) => {
  if (fallbackName) return fallbackName.startsWith('Dr.') ? fallbackName : `Dr. ${fallbackName}`;
  if (!doc) return '—';
  if (typeof doc === 'string') return doc.startsWith('Dr.') ? doc : `Dr. ${doc}`;
  const full = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  if (!full) return '—';
  return full.startsWith('Dr.') ? full : `Dr. ${full}`;
};

const hasArray = (arr) => Array.isArray(arr) && arr.length > 0;

const ConsultationDetailModal = ({
  consultation,
  onClose,
  prescriptions: propPrescriptions,
  investigations: propInvestigations,
  admissions: propAdmissions,
}) => {
  if (!consultation) return null;

  const consultationId = consultation.id || consultation._id;

  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState({
    consultation: consultation,
    prescriptions: propPrescriptions || consultation.prescriptions || [],
    investigations: propInvestigations || consultation.investigations || [],
    admissions: propAdmissions || consultation.admissions || [],
    examinations: null,
    reviewOfSystems: [],
  });

  useEffect(() => {
    let mounted = true;
    if (!consultationId) return;

    const fetchAllRelated = async () => {
      setLoading(true);
      try {
        const [relatedRes, examRes, rosRes, admRes] = await Promise.allSettled([
          getWardRoundRelatedByConsultation(consultationId),
          getExaminationByConsultationId(consultationId),
          getReviewOfSystemsByConsultationId(consultationId),
          getAdmissionsForConsultation(consultationId),
        ]);

        if (!mounted) return;

        let enrichedConsult = consultation;
        let fetchedPres = propPrescriptions || consultation.prescriptions || [];
        let fetchedInv = propInvestigations || consultation.investigations || [];

        if (relatedRes.status === 'fulfilled') {
          const val = relatedRes.value?.data ?? relatedRes.value;
          if (val?.consultation) enrichedConsult = { ...consultation, ...val.consultation };
          if (Array.isArray(val?.prescriptions) && val.prescriptions.length > 0) {
            fetchedPres = val.prescriptions;
          }
          if (Array.isArray(val?.investigations) && val.investigations.length > 0) {
            fetchedInv = val.investigations;
          }
        }

        let examData = null;
        if (examRes.status === 'fulfilled') {
          const raw = examRes.value?.data ?? examRes.value;
          examData = Array.isArray(raw) ? raw[0] : raw;
        }

        let rosData = [];
        if (rosRes.status === 'fulfilled') {
          const raw = rosRes.value?.data ?? rosRes.value;
          rosData = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        }

        let admData = propAdmissions || consultation.admissions || [];
        if (admRes.status === 'fulfilled') {
          const raw = admRes.value?.data ?? admRes.value;
          const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
          if (list.length > 0) admData = list;
        }

        setDetailData({
          consultation: enrichedConsult,
          prescriptions: fetchedPres,
          investigations: fetchedInv,
          admissions: admData,
          examinations: examData,
          reviewOfSystems: rosData,
        });
      } catch (err) {
        console.error('Error loading full consultation related data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllRelated();

    return () => {
      mounted = false;
    };
  }, [consultationId]);

  const c = detailData.consultation || consultation;
  const isDependant = !!c.dependantId;
  const subjectName = isDependant
    ? `${c.dependant?.firstName || ''} ${c.dependant?.lastName || ''}`.trim() || 'Dependant'
    : `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.trim() || 'Patient';

  const attendingDoctorName = formatDoctorName(c.doctor, c.doctorName);
  const prescriptions = detailData.prescriptions || [];
  const investigations = detailData.investigations || [];
  const admissions = detailData.admissions || [];
  const exam = detailData.examinations;
  const examFindings = exam?.findings || [];
  const ros = detailData.reviewOfSystems || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-base-100 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-base-200">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-200 px-5 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`badge ${isDependant ? 'badge-secondary' : 'badge-primary'} badge-md font-semibold shrink-0`}>
              {isDependant ? c.dependant?.relationshipType || 'Dependant' : 'Patient'}
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-base-content truncate">
                {subjectName}
              </h2>
              <p className="text-xs text-base-content/50 flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5 shrink-0" />
                <span>Consultation: {c.createdAt ? formatNigeriaDateTime(c.createdAt) : '—'}</span>
                {c.updatedAt && c.updatedAt !== c.createdAt && (
                  <span className="text-base-content/40 hidden sm:inline">
                    · Updated: {formatNigeriaDateTime(c.updatedAt)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {c.visitReason && (
              <span className="badge badge-ghost badge-sm capitalize hidden sm:inline-flex">
                {c.visitReason}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle shrink-0 text-base-content/70 hover:text-base-content"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top Clinical Summary Banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Attending Doctor
                </span>
                <p className="font-semibold text-base text-base-content mt-0.5 flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-primary shrink-0" />
                  {attendingDoctorName}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Primary Diagnosis
                </span>
                <p className="font-semibold text-base text-primary mt-0.5">
                  {c.diagnosis || 'Pending Diagnosis'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Reason for Visit
                </span>
                <p className="font-medium text-base-content mt-0.5 capitalize">
                  {c.visitReason || 'General Consultation'}
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-base-content/50">
              <span className="loading loading-spinner loading-xs text-primary" />
              <span>Fetching latest prescriptions, lab orders, and admission records...</span>
            </div>
          )}

          {/* Section 1: Complaints & Clinical Notes */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open>
            <SectionHeader title="Complaints & Doctor's Assessment" count={c.complaint?.length} badgeColor="badge-info" />
            <div className="collapse-content p-4 space-y-4 pt-2 border-t border-base-200">
              {/* Complaints List */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                  Patient Complaints
                </h4>
                {hasArray(c.complaint) ? (
                  <ul className="space-y-2">
                    {c.complaint.map((cp, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-base-200/60 border-l-4 border-primary text-sm"
                      >
                        <span className="font-medium text-base-content">{cp.symptom || cp}</span>
                        {cp.durationInDays != null && (
                          <span className="badge badge-sm badge-ghost">
                            {cp.durationInDays} day{cp.durationInDays === 1 ? '' : 's'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyNote>No specific complaints recorded</EmptyNote>
                )}
              </div>

              {/* Complaint History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Complaint History
                </h4>
                {c.complaintHistory ? (
                  <p className="text-sm text-base-content/90 bg-base-200/40 p-3 rounded-lg whitespace-pre-wrap break-words leading-relaxed">
                    {c.complaintHistory}
                  </p>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Doctor's Observations / Notes */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Doctor's Clinical Observations
                </h4>
                {c.notes ? (
                  <div className="bg-info/10 border border-info/20 p-3 rounded-lg text-sm text-base-content whitespace-pre-wrap break-words leading-relaxed">
                    {c.notes}
                  </div>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Instructions for Nurse */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Doctor's Instructions for Nurse
                </h4>
                {c.additionalNotes ? (
                  <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg text-sm text-base-content whitespace-pre-wrap break-words leading-relaxed font-medium">
                    {c.additionalNotes}
                  </div>
                ) : (
                  <EmptyNote>No special instructions for nurse</EmptyNote>
                )}
              </div>
            </div>
          </details>

          {/* Section 2: Patient Medical Histories */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden">
            <SectionHeader title="Patient Medical & Personal Histories" badgeColor="badge-neutral" />
            <div className="collapse-content p-4 space-y-4 pt-2 border-t border-base-200">
              {/* Allergic History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Allergic History
                </h4>
                {hasArray(c.allergicHistory) ? (
                  <div className="flex flex-wrap gap-2">
                    {c.allergicHistory.map((a, idx) => (
                      <span key={idx} className="badge badge-error badge-outline gap-1 text-xs py-2">
                        <FiAlertCircle className="w-3 h-3" />
                        {a.allergen || a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyNote>No allergies recorded</EmptyNote>
                )}
              </div>

              {/* Medical History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Past Medical History
                </h4>
                {hasArray(c.medicalHistory) ? (
                  <div className="flex flex-wrap gap-2">
                    {c.medicalHistory.map((m, idx) => (
                      <span key={idx} className="badge badge-ghost text-xs py-2">
                        {m.title || m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Family History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Family History
                </h4>
                {hasArray(c.familyHistory) ? (
                  <ul className="space-y-1.5">
                    {c.familyHistory.map((f, idx) => (
                      <li key={idx} className="text-sm text-base-content/80 border-l-2 border-secondary/40 pl-2.5 py-0.5">
                        <span className="font-semibold text-base-content">{f.relation || 'Relative'}:</span>{' '}
                        {f.condition || 'Condition not specified'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Surgical History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Surgical History
                </h4>
                {hasArray(c.surgicalHistory) ? (
                  <ul className="space-y-1.5">
                    {c.surgicalHistory.map((s, idx) => (
                      <li key={idx} className="text-sm text-base-content/80 flex items-center justify-between border-l-2 border-warning/50 pl-2.5 py-0.5">
                        <span className="font-medium text-base-content">{s.procedureName || s}</span>
                        {s.dateOfSurgery && (
                          <span className="text-xs text-base-content/50">
                            {formatNigeriaDate(s.dateOfSurgery)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Social History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1.5">
                  Social History
                </h4>
                {hasArray(c.socialHistory) ? (
                  <div className="flex flex-wrap gap-2">
                    {c.socialHistory.map((s, idx) => (
                      <span key={idx} className="badge badge-outline text-xs py-2">
                        {s.habit || s.title || s} {s.frequencyPerDay ? `(${s.frequencyPerDay}/day)` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyNote />
                )}
              </div>
            </div>
          </details>

          {/* Section 3: Physical Examination & Review of Systems */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden">
            <SectionHeader
              title="Physical Examinations & Review of Systems"
              count={(examFindings.length || 0) + (ros.length || 0)}
              badgeColor="badge-accent"
            />
            <div className="collapse-content p-4 space-y-4 pt-2 border-t border-base-200">
              {/* General Examination Overview */}
              {exam && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-base-200/50 rounded-lg text-sm">
                  {exam.generalAppearance && (
                    <div>
                      <span className="text-xs font-semibold text-base-content/50 uppercase">Appearance</span>
                      <p className="font-medium capitalize text-base-content">{exam.generalAppearance}</p>
                    </div>
                  )}
                  {exam.febrileStatus && (
                    <div>
                      <span className="text-xs font-semibold text-base-content/50 uppercase">Febrile Status</span>
                      <p className="font-medium capitalize text-base-content">
                        <span className={`badge badge-sm ${exam.febrileStatus === 'febrile' ? 'badge-error' : 'badge-success'}`}>
                          {exam.febrileStatus}
                        </span>
                      </p>
                    </div>
                  )}
                  {exam.generalNotes && (
                    <div className="sm:col-span-2">
                      <span className="text-xs font-semibold text-base-content/50 uppercase">General Notes</span>
                      <p className="text-base-content/80 mt-0.5">{exam.generalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Systemic Examination Findings */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                  Systemic Examination Findings
                </h4>
                {hasArray(examFindings) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {examFindings.map((f, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-base-200 bg-base-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-base-content">
                            {f.system}
                          </span>
                          <span className={`badge badge-xs ${f.isNormal ? 'badge-success' : 'badge-warning'}`}>
                            {f.isNormal ? 'Normal' : 'Abnormal'}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/80 whitespace-pre-wrap">{f.findings || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyNote>No systemic examination recorded</EmptyNote>
                )}
              </div>

              {/* Review of Systems */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                  Review of Systems
                </h4>
                {hasArray(ros) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ros.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-base-200 bg-base-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-base-content">
                            {item.system}
                          </span>
                          <span className={`badge badge-xs ${item.isNormal ? 'badge-success' : 'badge-warning'}`}>
                            {item.isNormal ? 'Normal' : 'Abnormal'}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/80 whitespace-pre-wrap">{item.findings || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyNote>No review of systems recorded</EmptyNote>
                )}
              </div>
            </div>
          </details>

          {/* Section 4: Active Prescriptions */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open>
            <SectionHeader title="Prescriptions" count={prescriptions.length} badgeColor="badge-success" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {prescriptions.length > 0 ? (
                <div className="divide-y divide-base-200 border border-base-200 rounded-xl overflow-hidden">
                  {prescriptions.map((pres, idx) => {
                    const presDoctor = formatDoctorName(pres.doctor, pres.doctorName);
                    const presStatus = (pres.status || 'pending').toLowerCase();
                    const statusClass =
                      presStatus === 'dispensed' || presStatus === 'completed'
                        ? 'badge-success'
                        : presStatus === 'pending'
                        ? 'badge-warning'
                        : 'badge-neutral';

                    return (
                      <div key={pres.id || pres._id || idx} className="p-4 bg-base-100">
                        {/* Prescription Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-base-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base-content">Prescription #{idx + 1}</span>
                            <span className={`badge ${statusClass} badge-sm capitalize font-medium`}>
                              {pres.status || 'pending'}
                            </span>
                          </div>
                          <div className="text-base-content/60 flex items-center gap-2">
                            <span>Ordered {pres.createdAt ? formatNigeriaDateTime(pres.createdAt) : '—'}</span>
                            <span>•</span>
                            <span className="font-medium text-base-content">{presDoctor}</span>
                          </div>
                        </div>

                        {/* Medications */}
                        <div className="space-y-3">
                          {(pres.medications || []).map((med, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-3 rounded-lg bg-base-200/50 border-l-4 border-success flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-base-content">{med.drugName}</span>
                                {med.route && (
                                  <span className="badge badge-outline badge-xs uppercase">{med.route}</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-base-content/70 mt-1">
                                <div>
                                  <span className="text-base-content/50">Dosage: </span>
                                  <span className="font-medium text-base-content">{med.dosage || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-base-content/50">Frequency: </span>
                                  <span className="font-medium text-base-content">{med.frequency || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-base-content/50">Duration: </span>
                                  <span className="font-medium text-base-content">{med.duration || '—'}</span>
                                </div>
                              </div>
                              {med.notes && (
                                <p className="text-xs text-base-content/80 mt-1 italic">
                                  Note: {med.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                  <p className="text-sm text-base-content/50">No prescriptions ordered for this consultation</p>
                </div>
              )}
            </div>
          </details>

          {/* Section 5: Ordered Labs & Investigations */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open>
            <SectionHeader title="Ordered Labs & Investigations" count={investigations.length} badgeColor="badge-warning" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {investigations.length > 0 ? (
                <div className="divide-y divide-base-200 border border-base-200 rounded-xl overflow-hidden">
                  {investigations.map((inv, idx) => {
                    const orderingDoc = formatDoctorName(inv.doctor, inv.doctorName);
                    const invStatus = (inv.status || 'requested').toLowerCase();
                    const statusClass =
                      invStatus === 'completed'
                        ? 'badge-success'
                        : invStatus === 'sample_collected'
                        ? 'badge-info'
                        : invStatus === 'in_progress'
                        ? 'badge-accent'
                        : 'badge-warning';

                    const priority = (inv.priority || 'normal').toLowerCase();
                    const priorityClass =
                      priority === 'urgent' || priority === 'emergency' || priority === 'stat'
                        ? 'badge-error'
                        : 'badge-ghost';

                    return (
                      <div key={inv.id || inv._id || idx} className="p-4 bg-base-100">
                        {/* Investigation Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-base-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base-content">Investigation Order #{idx + 1}</span>
                            <span className={`badge ${statusClass} badge-sm capitalize font-medium`}>
                              {inv.status || 'requested'}
                            </span>
                            <span className={`badge ${priorityClass} badge-sm uppercase font-semibold`}>
                              {inv.priority || 'normal'}
                            </span>
                          </div>
                          <div className="text-base-content/60 flex items-center gap-2">
                            <span>Ordered {inv.createdAt ? formatNigeriaDateTime(inv.createdAt) : '—'}</span>
                            <span>•</span>
                            <span className="font-medium text-base-content">{orderingDoc}</span>
                          </div>
                        </div>

                        {/* Tests List */}
                        <div className="space-y-2">
                          {(inv.tests || []).map((t, tIdx) => (
                            <div
                              key={tIdx}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-base-200/50 border-l-4 border-warning text-sm"
                            >
                              <div>
                                <span className="font-medium text-base-content">{t.name || t}</span>
                                {t.isCustom && (
                                  <span className="badge badge-xs badge-outline ml-2">Custom</span>
                                )}
                              </div>
                              {t.sampleType && (
                                <span className="text-xs text-base-content/60">{t.sampleType}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Lab Results if attached */}
                        {hasArray(inv.results) && (
                          <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                            <h5 className="text-xs font-semibold text-success uppercase mb-1">
                              Recorded Lab Results
                            </h5>
                            <div className="space-y-1 text-xs">
                              {inv.results.map((r, rIdx) => (
                                <div key={rIdx} className="flex justify-between border-b border-success/10 py-1">
                                  <span className="font-medium text-base-content">{r.code || r.name || 'Test'}:</span>
                                  <span className="text-base-content/90 font-mono font-bold">
                                    {r.value} {r.unit || ''} {r.range ? `(Ref: ${r.range})` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                  <p className="text-sm text-base-content/50">No lab investigations ordered for this consultation</p>
                </div>
              )}
            </div>
          </details>

          {/* Section 6: Admission Details */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open={admissions.length > 0}>
            <SectionHeader title="Hospital Admission Details" count={admissions.length} badgeColor="badge-secondary" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {admissions.length > 0 ? (
                <div className="space-y-3">
                  {admissions.map((adm, idx) => {
                    const admittingDoc = formatDoctorName(adm.doctor, adm.doctorName);
                    const admStatus = (adm.status || 'active').toLowerCase();
                    const statusClass =
                      admStatus === 'discharged'
                        ? 'badge-success'
                        : admStatus === 'active'
                        ? 'badge-warning'
                        : 'badge-neutral';

                    return (
                      <div
                        key={adm.id || adm._id || idx}
                        className="p-4 rounded-xl border border-base-200 bg-base-100 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-base-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-base-content">Admission #{idx + 1}</span>
                            <span className={`badge ${statusClass} badge-sm capitalize font-medium`}>
                              {adm.status || 'active'}
                            </span>
                          </div>
                          <span className="text-base-content/60">
                            Admitted {adm.createdAt ? formatNigeriaDateTime(adm.createdAt) : '—'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="p-2.5 rounded-lg bg-base-200/50">
                            <span className="text-xs text-base-content/50 block">Ward Assigned</span>
                            <span className="font-bold text-base-content">{adm.ward || '—'}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-base-200/50">
                            <span className="text-xs text-base-content/50 block">Bed Number</span>
                            <span className="font-bold text-base-content">{adm.bed || '—'}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-base-200/50">
                            <span className="text-xs text-base-content/50 block">Admitting Physician</span>
                            <span className="font-bold text-base-content">{admittingDoc}</span>
                          </div>
                        </div>

                        {/* Admission items / services */}
                        {hasArray(adm.admissions) && (
                          <div className="mt-2">
                            <h5 className="text-xs font-semibold text-base-content/60 uppercase mb-1">
                              Admission Services & Charges
                            </h5>
                            <div className="divide-y divide-base-200 border border-base-200 rounded-lg overflow-hidden text-xs">
                              {adm.admissions.map((item, iIdx) => (
                                <div key={iIdx} className="p-2 flex justify-between items-center bg-base-100">
                                  <span className="font-medium text-base-content">{item.name || 'Admission Service'}</span>
                                  {item.amount && (
                                    <span className="font-mono text-base-content/80">₦{Number(item.amount).toLocaleString()}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {adm.admissionNotes && (
                          <div>
                            <span className="text-xs font-semibold text-base-content/50 uppercase block mb-1">
                              Admission Note
                            </span>
                            <p className="text-sm text-base-content/80 bg-base-200/30 p-2.5 rounded-lg whitespace-pre-wrap">
                              {adm.admissionNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                  <p className="text-sm text-base-content/50">Patient was not admitted during this consultation</p>
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-base-200 bg-base-100 flex items-center justify-between">
          <div className="text-xs text-base-content/50">
            ID: <span className="font-mono">{consultationId || '—'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm px-6"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetailModal;
