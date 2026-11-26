import React, { useState, useEffect } from 'react';
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import { getPrescriptionsByAntenatalId } from '@/services/api/prescriptionsAPI';
import { getInvestigationsByAntenatalId } from '@/services/api/investigationRequestAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getAllBillings } from '@/services/api/billingAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import apiClient from '@/services/api/apiClient';
import { HmoStatusBadge } from './ConsultationDetailModal';
import {
  FiUser,
  FiClock,
  FiCalendar,
  FiActivity,
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

const formatStaffName = (doc, fallbackName) => {
  if (fallbackName) return fallbackName;
  if (!doc) return '—';
  if (typeof doc === 'string') return doc;
  if (doc.fullName) return doc.fullName;
  const full = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
  return full || '—';
};

const hasArray = (arr) => Array.isArray(arr) && arr.length > 0;

const getAntenatalRecordId = (record) =>
  record?._id || record?.id || record?.antenatalId || record?.recordId || record?.__wrapperId || null;

const getRoutineTestField = (record, field) => {
  if (!record) return '—';
  const routine = Array.isArray(record.routineTest)
    ? record.routineTest[0]
    : (record.routineTest || record.routineTests || record.presentPregnancyHistories?.[0]?.routineTest);
  if (!routine) return '—';
  const normField = String(field || '').toLowerCase();
  if (normField === 'abo' || normField === 'bloodgroup') {
    return routine.ABO || routine.abo || routine.bloodGroup || routine.BloodGroup || '—';
  }
  if (normField === 'genotype') {
    return routine.GENOTYPE || routine.genotype || routine.Genotype || '—';
  }
  if (normField === 'pcv') return routine.PCV || routine.pcv || '—';
  if (normField === 'rvs') return routine.RVS || routine.rvs || '—';
  if (normField === 'vdrl') return routine.VDRL || routine.vdrl || '—';
  if (normField === 'hbv') return routine.HBV || routine.hbv || '—';
  return routine[field] || routine[field.toUpperCase?.()] || routine[field.toLowerCase?.()] || '—';
};

const AntenatalDetailModal = ({
  antenatalRecord,
  patientId: propPatientId,
  patient: propPatient,
  onClose,
  prescriptions: propPrescriptions,
  investigations: propInvestigations,
}) => {
  if (!antenatalRecord) return null;

  const recordId = getAntenatalRecordId(antenatalRecord);
  const initialPatientId =
    propPatientId ||
    antenatalRecord.patientId ||
    antenatalRecord.patient?.id ||
    antenatalRecord.patient?._id;
  const initialDependantId =
    antenatalRecord.dependantId ||
    antenatalRecord.dependant?.id ||
    antenatalRecord.dependant?._id;

  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState(propPrescriptions || []);
  const [investigations, setInvestigations] = useState(propInvestigations || []);
  const [labResults, setLabResults] = useState([]);
  const [hmosData, setHmosData] = useState([]);
  const [billingsData, setBillingsData] = useState([]);
  const [patientDetails, setPatientDetails] = useState(propPatient || antenatalRecord.patient || null);

  useEffect(() => {
    let mounted = true;
    if (!recordId && !initialPatientId) return;

    const fetchRelatedData = async () => {
      setLoading(true);
      try {
        const [presRes, invRes, labRes, hmosRes, billingsRes, ptRes] = await Promise.allSettled([
          recordId ? getPrescriptionsByAntenatalId(recordId) : Promise.resolve([]),
          recordId ? getInvestigationsByAntenatalId(recordId) : Promise.resolve([]),
          initialPatientId ? getLabResults({ patientId: initialPatientId }) : Promise.resolve([]),
          initialPatientId ? apiClient.get('/hmo', { params: { patientId: initialPatientId }, skipErrorToast: true }) : Promise.resolve(null),
          initialPatientId ? getAllBillings({ patientId: initialPatientId }) : Promise.resolve(null),
          initialPatientId && !propPatient ? getPatientById(initialPatientId) : Promise.resolve(null),
        ]);

        if (!mounted) return;

        if (presRes.status === 'fulfilled') {
          const raw = presRes.value?.data ?? presRes.value ?? [];
          if (Array.isArray(raw)) setPrescriptions(raw);
        }

        if (invRes.status === 'fulfilled') {
          const raw = invRes.value?.data ?? invRes.value ?? [];
          if (Array.isArray(raw)) setInvestigations(raw);
        }

        if (labRes.status === 'fulfilled') {
          const raw = labRes.value?.data ?? labRes.value ?? [];
          const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
          const scoped = initialDependantId
            ? list.filter((r) => String(r.dependantId || '') === String(initialDependantId))
            : list.filter((r) => !r.dependantId);
          setLabResults(scoped);
        }

        if (hmosRes.status === 'fulfilled' && hmosRes.value) {
          const raw = hmosRes.value?.data?.data ?? hmosRes.value?.data ?? [];
          setHmosData(Array.isArray(raw) ? raw : []);
        }

        if (billingsRes.status === 'fulfilled' && billingsRes.value) {
          const raw = billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [];
          const list = Array.isArray(raw) ? raw : (raw?.billings || []);
          setBillingsData(
            [...list].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
          );
        }

        if (ptRes.status === 'fulfilled' && ptRes.value) {
          const raw = ptRes.value?.data?.data ?? ptRes.value?.data ?? ptRes.value;
          if (raw) {
            setPatientDetails(raw);
            if (Array.isArray(raw.hmos) && raw.hmos.length > 0) {
              setHmosData((prev) => (prev.length > 0 ? prev : raw.hmos));
            }
          }
        }
      } catch (err) {
        console.error('Error loading antenatal related data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRelatedData();
    return () => {
      mounted = false;
    };
  }, [recordId, initialPatientId, initialDependantId, propPatient]);

  const r = antenatalRecord;
  const isDependant = Boolean(initialDependantId);
  const subjectName = isDependant
    ? `${r.dependant?.firstName || ''} ${r.dependant?.lastName || ''}`.trim() || 'Dependant'
    : patientDetails?.fullName ||
      `${patientDetails?.firstName || r.patient?.firstName || ''} ${patientDetails?.lastName || r.patient?.lastName || ''}`.trim() ||
      'Patient';

  const creatorName = formatStaffName(
    r.creator || r.doctor || r.createdBy,
    r.createdByName || r.doctorName || r.nurseName
  );
  const presentPregnancy = r.presentPregnancyHistories?.[0] || r.presentPregnancy || null;
  const medicalHistory = r.medicalHistories?.[0] || null;
  const familyHistory = r.familyHistories?.[0] || null;
  const obstetricHistories = r.obstetricHistories || [];
  const examinations = r.anteNatalExamination || r.antenatalExaminations || [];

  // HMO coverage detection
  const subjectHmos = isDependant && initialDependantId
    ? hmosData.filter((h) => h.dependantId === initialDependantId)
    : hmosData.filter((h) => !h.dependantId);
  const activeHmos = subjectHmos.length > 0 ? subjectHmos : hmosData;

  const hasHmoCoverage = Boolean(
    activeHmos.length > 0 ||
    patientDetails?.hmos?.length > 0 ||
    (typeof window !== 'undefined' && window.location.pathname.includes('/hmo'))
  );

  const effectiveHmoStatus = (() => {
    const ptStatus = String(patientDetails?.status || '').toLowerCase();
    if (ptStatus === 'hmo_approved') return 'approved';
    if (ptStatus === 'hmo_rejected') return 'rejected';
    if (ptStatus === 'awaiting_hmo') return 'pending';
    return hasHmoCoverage ? 'pending' : 'none';
  })();

  const getMedHmoStatus = (med, pres) => {
    if (!hasHmoCoverage) return null;
    if (med?.hmoStatus && String(med.hmoStatus).toLowerCase() !== 'pending') return med.hmoStatus;
    if (med?.hmoApprovalStatus && String(med.hmoApprovalStatus).toLowerCase() !== 'pending') return med.hmoApprovalStatus;

    const pId = String(pres?.id || pres?._id || '');
    const medName = String(med?.drugName || med?.name || '').trim().toLowerCase();
    for (const bill of billingsData) {
      for (const item of bill.itemDetails || []) {
        const desc = String(item.description || '').trim().toLowerCase();
        const nameMatch = medName && (desc.includes(medName) || medName.includes(desc));
        const idMatch = item.prescriptionId && pId && String(item.prescriptionId) === pId;
        if (idMatch || nameMatch) {
          const st = String(item.hmoStatus || item.hmoApprovalStatus || '').toLowerCase();
          if (st && st !== 'pending') return st;
          if (item.isClaimed || item.paymentStatus === 'paid' || item.isCleared || bill?.isCleared) return 'approved';
        }
      }
    }
    return med?.hmoStatus || pres?.hmoStatus || pres?.hmoApprovalStatus || effectiveHmoStatus || 'pending';
  };

  const getTestHmoStatus = (test, inv) => {
    if (!hasHmoCoverage) return null;
    if (typeof test === 'object') {
      if (test.hmoStatus && String(test.hmoStatus).toLowerCase() !== 'pending') return test.hmoStatus;
      if (test.hmoApprovalStatus && String(test.hmoApprovalStatus).toLowerCase() !== 'pending') return test.hmoApprovalStatus;
    }

    const invId = String(inv?.id || inv?._id || '');
    const tName = (typeof test === 'string' ? test : test?.name || test?.testName || '').trim().toLowerCase();
    for (const bill of billingsData) {
      for (const item of bill.itemDetails || []) {
        const desc = String(item.description || '').trim().toLowerCase();
        const nameMatch = tName && (desc.includes(tName) || tName.includes(desc));
        const idMatch = item.investigationId && invId && String(item.investigationId) === invId;
        if (idMatch || nameMatch) {
          const st = String(item.hmoStatus || item.hmoApprovalStatus || '').toLowerCase();
          if (st && st !== 'pending') return st;
          if (item.isClaimed || item.paymentStatus === 'paid' || item.isCleared || bill?.isCleared) return 'approved';
        }
      }
    }
    return (typeof test === 'object' && test?.hmoStatus) || inv?.hmoStatus || inv?.hmoApprovalStatus || effectiveHmoStatus || 'pending';
  };

  const getLabResultForRequest = (inv) => {
    if (!inv) return null;
    const invId = String(inv._id || inv.id || '');
    return labResults.find(
      (lr) =>
        String(lr.investigationRequestId || '') === invId ||
        String(lr.investigationId || '') === invId
    );
  };

  const routineTests = [
    { label: 'Blood Group (ABO)', value: getRoutineTestField(r, 'ABO') },
    { label: 'Genotype', value: getRoutineTestField(r, 'GENOTYPE') },
    { label: 'PCV', value: getRoutineTestField(r, 'PCV') },
    { label: 'RVS', value: getRoutineTestField(r, 'RVS') },
    { label: 'VDRL', value: getRoutineTestField(r, 'VDRL') },
    { label: 'HBV', value: getRoutineTestField(r, 'HBV') },
  ];
  const hasRoutineTests = routineTests.some((t) => t.value && t.value !== '—');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-base-100 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-base-200">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-200 px-5 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`badge ${isDependant ? 'badge-secondary' : 'badge-accent'} badge-md font-semibold shrink-0`}>
              {isDependant ? r.dependant?.relationshipType || 'Dependant' : 'Antenatal'}
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-base-content truncate">
                {subjectName}
              </h2>
              <p className="text-xs text-base-content/50 flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5 shrink-0" />
                <span>Antenatal Record: {r.createdAt ? formatNigeriaDateTime(r.createdAt) : '—'}</span>
                {r.updatedAt && r.updatedAt !== r.createdAt && (
                  <span className="text-base-content/40 hidden sm:inline">
                    · Updated: {formatNigeriaDateTime(r.updatedAt)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {presentPregnancy?.EDD && (
              <span className="badge badge-ghost badge-sm hidden sm:inline-flex gap-1">
                <FiCalendar className="w-3 h-3" />
                EDD: {formatNigeriaDate(presentPregnancy.EDD)}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top Antenatal Summary Banner */}
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Recorded By
                </span>
                <p className="font-semibold text-base text-base-content mt-0.5 flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-accent shrink-0" />
                  {creatorName}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Expected Delivery (EDD)
                </span>
                <p className="font-semibold text-base text-accent mt-0.5">
                  {presentPregnancy?.EDD ? formatNigeriaDate(presentPregnancy.EDD) : '—'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Gestational Age / LMP
                </span>
                <p className="font-medium text-base-content mt-0.5 flex items-center gap-1.5">
                  <FiActivity className="w-4 h-4 text-accent shrink-0" />
                  {presentPregnancy?.durationOfPregnancyInWeek != null
                    ? `${presentPregnancy.durationOfPregnancyInWeek} weeks`
                    : '—'}
                  {presentPregnancy?.LMP ? ` · LMP: ${formatNigeriaDate(presentPregnancy.LMP)}` : ''}
                </p>
              </div>
            </div>

            {r.specialInstructions && (
              <div className="mt-3 pt-3 border-t border-accent/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-warning-content/80 block mb-1">
                  Special Instructions
                </span>
                <p className="text-sm text-base-content bg-warning/10 border border-warning/30 p-2.5 rounded-lg whitespace-pre-wrap">
                  {r.specialInstructions}
                </p>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-base-content/50">
              <span className="loading loading-spinner loading-xs text-accent" />
              <span>Fetching antenatal prescriptions, lab orders & scan investigations...</span>
            </div>
          )}

          {/* Section 1: Present Pregnancy & Symptoms */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open>
            <SectionHeader title="Present Pregnancy & Symptoms" badgeColor="badge-info" />
            <div className="collapse-content p-4 space-y-4 pt-2 border-t border-base-200">
              {presentPregnancy ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-2.5 rounded-lg bg-base-200/50">
                      <span className="text-xs text-base-content/50 block">EDD</span>
                      <span className="font-bold text-base-content">
                        {presentPregnancy.EDD ? formatNigeriaDate(presentPregnancy.EDD) : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-base-200/50">
                      <span className="text-xs text-base-content/50 block">LMP</span>
                      <span className="font-bold text-base-content">
                        {presentPregnancy.LMP ? formatNigeriaDate(presentPregnancy.LMP) : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-base-200/50">
                      <span className="text-xs text-base-content/50 block">Gestational Age</span>
                      <span className="font-bold text-base-content">
                        {presentPregnancy.durationOfPregnancyInWeek ?? 0} weeks
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { label: 'Bleeding', val: presentPregnancy.bleeding },
                      { label: 'Headache', val: presentPregnancy.headache },
                      { label: 'Vomiting', val: presentPregnancy.vomiting },
                      { label: 'Oedema', val: presentPregnancy.oedema },
                      { label: 'Constipation', val: presentPregnancy.constipation },
                      { label: 'Urinary Symptoms', val: presentPregnancy.urinarySymptoms },
                      { label: 'Jaundice', val: presentPregnancy.jaundice },
                      { label: 'Vaginal Discharge', val: presentPregnancy.vaginalDischarge },
                    ].map((sym) => {
                      const isYes = String(sym.val || '').toLowerCase() === 'yes';
                      return (
                        <div key={sym.label} className="p-2 rounded-lg bg-base-200/40 flex justify-between items-center gap-1">
                          <span className="text-base-content/60">{sym.label}:</span>
                          <span className={`font-semibold capitalize ${isYes ? 'text-error' : 'text-base-content/80'}`}>
                            {sym.val || 'No'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {presentPregnancy.otherSymptoms && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1">
                        Other Symptoms
                      </h4>
                      <p className="text-sm text-base-content/80 bg-base-200/40 p-2.5 rounded-lg whitespace-pre-wrap">
                        {presentPregnancy.otherSymptoms}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <EmptyNote>No present pregnancy details recorded</EmptyNote>
              )}
            </div>
          </details>

          {/* Section 2: Routine Tests */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open={hasRoutineTests}>
            <SectionHeader title="Routine Antenatal Tests" badgeColor="badge-primary" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {hasRoutineTests ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {routineTests.map((t) => (
                    <div key={t.label} className="p-2.5 rounded-lg bg-base-200/50">
                      <span className="text-xs text-base-content/50 block">{t.label}</span>
                      <span className="font-bold text-base-content">{t.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyNote>No routine tests recorded</EmptyNote>
              )}
            </div>
          </details>

          {/* Section 3: Medical, Family & Obstetric Histories */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden">
            <SectionHeader
              title="Medical, Family & Obstetric Histories"
              count={obstetricHistories.length || null}
              badgeColor="badge-neutral"
            />
            <div className="collapse-content p-4 space-y-4 pt-2 border-t border-base-200">
              {/* Previous Medical History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                  Previous Medical History
                </h4>
                {medicalHistory ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Heart Disease', val: medicalHistory.heartDisease },
                      { label: 'Hypertension', val: medicalHistory.hypertension },
                      { label: 'Kidney', val: medicalHistory.kidney },
                      { label: 'Yaws/Syphilis', val: medicalHistory.yawnOrSyphilis },
                      { label: 'Previous Operation', val: medicalHistory.previousOperation },
                      { label: 'Others', val: medicalHistory.other },
                    ]
                      .filter((item) => item.val)
                      .map((item) => (
                        <div key={item.label} className="flex justify-between p-2.5 bg-base-200/50 rounded-lg">
                          <span className="font-medium text-base-content/70">{item.label}:</span>
                          <span className="font-semibold text-base-content">{item.val}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Family History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                  Family History
                </h4>
                {familyHistory ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { label: 'Twins', val: familyHistory.twins },
                      { label: 'Malformation', val: familyHistory.malformation },
                      { label: 'Tuberculosis', val: familyHistory.tuberculosis },
                    ]
                      .filter((item) => item.val)
                      .map((item) => (
                        <div key={item.label} className="flex justify-between p-2.5 bg-base-200/50 rounded-lg">
                          <span className="font-medium text-base-content/70">{item.label}:</span>
                          <span className="font-semibold text-base-content">{item.val}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyNote />
                )}
              </div>

              {/* Previous Obstetric History */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                  Previous Obstetric History
                </h4>
                {hasArray(obstetricHistories) ? (
                  <div className="space-y-2">
                    {obstetricHistories.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-base-200 bg-base-200/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-base-content">
                            {item.Date ? formatNigeriaDate(item.Date) : `Pregnancy #${idx + 1}`}
                          </span>
                          <span className={`badge badge-xs ${item.aliveOrDead === 'Alive' ? 'badge-success' : 'badge-error'}`}>
                            {item.aliveOrDead || '—'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-base-content/70">
                          <div>Duration: <span className="font-medium text-base-content">{item.durationOfPregnancy || '—'}</span></div>
                          <div>Birth Weight: <span className="font-medium text-base-content">{item.birthWeight || '—'}</span></div>
                          <div>Complication: <span className="font-medium text-base-content">{item.complicationInPregnancy || '—'}</span></div>
                          {item.ageAtDeath && (
                            <div>Age at Death: <span className="font-medium text-base-content">{item.ageAtDeath}</span></div>
                          )}
                          {item.causeOfDeath && (
                            <div className="sm:col-span-2">Cause of Death: <span className="font-medium text-base-content">{item.causeOfDeath}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyNote>No previous obstetric history recorded</EmptyNote>
                )}
              </div>
            </div>
          </details>

          {/* Section 4: Antenatal Examinations */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open={examinations.length > 0}>
            <SectionHeader title="Antenatal Examinations" count={examinations.length} badgeColor="badge-accent" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {hasArray(examinations) ? (
                <div className="space-y-3">
                  {examinations.map((exam, idx) => (
                    <div key={idx} className="border border-base-200 rounded-xl overflow-hidden bg-base-100">
                      <div className="flex items-center justify-between px-3 py-2 bg-base-200/40 border-b border-base-200 text-xs">
                        <span className="font-bold text-base-content">Examination #{idx + 1}</span>
                        <span className="text-base-content/60">
                          {exam.Date ? formatNigeriaDate(exam.Date) : 'No date'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 text-xs">
                        <div><span className="text-base-content/50 block">EGA</span><span className="font-medium">{exam.EGA || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Fundal Height</span><span className="font-medium">{exam.heightOfFundus || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Presentation & Lie</span><span className="font-medium">{exam.presentationAndLife || '—'}</span></div>
                        <div><span className="text-base-content/50 block">P.P to Brim</span><span className="font-medium">{exam.relationOfPPToBrim || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Foetal Heart</span><span className="font-medium">{exam.foetalHeart || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Urine</span><span className="font-medium">{exam.urine || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Weight (kg)</span><span className="font-medium">{exam.weight || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Blood Pressure</span><span className="font-medium">{exam.bloodPressure || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Next Visit</span><span className="font-medium">{exam.nextVisit || '—'}</span></div>
                        <div><span className="text-base-content/50 block">Signature</span><span className="font-medium">{exam.signature || exam.recordedByName || '—'}</span></div>
                      </div>
                      {exam.remark && (
                        <div className="px-3 pb-3 pt-2 border-t border-base-200 text-xs">
                          <span className="text-base-content/50 font-semibold uppercase block mb-1">Remark</span>
                          <p className="text-base-content/80 bg-base-200/30 p-2 rounded-lg whitespace-pre-wrap">{exam.remark}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyNote>No antenatal examinations recorded</EmptyNote>
              )}
            </div>
          </details>

          {/* Section 5: Prescriptions */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open>
            <SectionHeader title="Prescriptions" count={prescriptions.length} badgeColor="badge-success" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {prescriptions.length > 0 ? (
                <div className="divide-y divide-base-200 border border-base-200 rounded-xl overflow-hidden">
                  {prescriptions.map((pres, idx) => {
                    const presDoctor = formatStaffName(pres.doctor, pres.doctorName);
                    const presStatus = (pres.status || 'pending').toLowerCase();

                    return (
                      <div key={pres.id || pres._id || idx} className="p-4 bg-base-100">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-base-200 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base-content">Prescription #{idx + 1}</span>
                            {pres.medications?.length > 0 && (
                              <span className="badge badge-ghost badge-sm text-base-content/70 font-normal">
                                {pres.medications.length} {pres.medications.length === 1 ? 'item' : 'items'}
                              </span>
                            )}
                            {(presStatus === 'dispensed' || presStatus === 'completed') && (
                              <span className="badge badge-success text-white badge-sm capitalize font-medium">
                                Dispensed
                              </span>
                            )}
                            {presStatus === 'cancelled' && (
                              <span className="badge badge-error text-white badge-sm capitalize font-medium">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <div className="text-base-content/60 flex items-center gap-2">
                            <span>Ordered {pres.createdAt ? formatNigeriaDateTime(pres.createdAt) : '—'}</span>
                            <span>•</span>
                            <span className="font-medium text-base-content">{presDoctor}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(pres.medications || []).map((med, mIdx) => {
                            const drugForm = med.form || med.dosageForm || med.drugForm || med.medicationType || med.type;
                            const isMedDispensed = med.dispensedStatus === 'dispensed' || med.status === 'dispensed' || presStatus === 'dispensed';
                            return (
                              <div
                                key={mIdx}
                                className="p-3 rounded-lg bg-base-200/50 border-l-4 border-success flex flex-col gap-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-base-content">{med.drugName}</span>
                                    {drugForm && (
                                      <span className="badge badge-secondary/15 text-secondary border-secondary/30 badge-xs capitalize font-medium">
                                        {drugForm}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {hasHmoCoverage ? (
                                      <HmoStatusBadge status={getMedHmoStatus(med, pres)} size="xs" />
                                    ) : (
                                      <span className={`badge ${med.isPaid || med.paymentStatus === 'paid' ? 'badge-success text-white' : 'badge-warning text-warning-content'} badge-xs capitalize font-medium`}>
                                        {med.isPaid || med.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                      </span>
                                    )}
                                    {isMedDispensed && (
                                      <span className="badge badge-success badge-outline badge-xs capitalize font-medium">
                                        Dispensed
                                      </span>
                                    )}
                                    {med.route && (
                                      <span className="badge badge-outline badge-xs uppercase">{med.route}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-base-content/70 mt-1">
                                  <div>
                                    <span className="text-base-content/50">Form: </span>
                                    <span className="font-medium text-base-content capitalize">{drugForm || '—'}</span>
                                  </div>
                                  <div>
                                    <span className="text-base-content/50">Dosage: </span>
                                    <span className="font-medium text-base-content">{med.dosage || (med.dosageAmount ? `${med.dosageAmount} ${med.dosageUnit || ''}`.trim() : '—')}</span>
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
                                  <p className="text-xs text-base-content/80 mt-1 italic">Note: {med.notes}</p>
                                )}
                                {med.instructions && (
                                  <p className="text-xs text-base-content/80 mt-1 italic">Instructions: {med.instructions}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                  <p className="text-sm text-base-content/50">No prescriptions ordered for this antenatal record</p>
                </div>
              )}
            </div>
          </details>

          {/* Section 6: Ordered Labs & Scans */}
          <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden" open>
            <SectionHeader title="Ordered Labs & Scans" count={investigations.length} badgeColor="badge-warning" />
            <div className="collapse-content p-4 pt-2 border-t border-base-200">
              {investigations.length > 0 ? (
                <div className="divide-y divide-base-200 border border-base-200 rounded-xl overflow-hidden">
                  {investigations.map((inv, idx) => {
                    const orderingDoc = formatStaffName(inv.doctor, inv.doctorName);
                    const matchedResult = getLabResultForRequest(inv);
                    const invStatus = (matchedResult ? 'completed' : inv.status || 'requested').toLowerCase();
                    const isScan = String(inv.type || '').toLowerCase() === 'radiology';
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
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-base-200 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base-content">
                              {isScan ? 'Scan / Radiology' : 'Lab Order'} #{idx + 1}
                            </span>
                            <span className={`badge badge-xs ${isScan ? 'badge-secondary' : 'badge-info'}`}>
                              {isScan ? 'Scan' : 'Lab'}
                            </span>
                            {inv.tests?.length > 0 && (
                              <span className="badge badge-ghost badge-sm text-base-content/70 font-normal">
                                {inv.tests.length} {inv.tests.length === 1 ? 'test' : 'tests'}
                              </span>
                            )}
                            <span className={`badge ${statusClass} badge-sm capitalize font-medium`}>
                              {invStatus.replace('_', ' ')}
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
                              <div className="flex items-center gap-2 flex-wrap">
                                {hasHmoCoverage ? (
                                  <HmoStatusBadge status={getTestHmoStatus(t, inv)} size="xs" />
                                ) : (
                                  <span className={`badge ${t.isPaid || t.paymentStatus === 'paid' ? 'badge-success text-white' : 'badge-warning text-warning-content'} badge-xs capitalize font-medium`}>
                                    {t.isPaid || t.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                  </span>
                                )}
                                {t.sampleType && (
                                  <span className="text-xs text-base-content/60">{t.sampleType}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {(hasArray(inv.results) || hasArray(matchedResult?.result)) && (
                          <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                            <h5 className="text-xs font-semibold text-success uppercase mb-1">
                              Recorded Results
                            </h5>
                            <div className="space-y-1 text-xs">
                              {(inv.results || matchedResult?.result || []).map((resItem, rIdx) => (
                                <div key={rIdx} className="flex justify-between border-b border-success/10 py-1">
                                  <span className="font-medium text-base-content">{resItem.code || resItem.name || 'Test'}:</span>
                                  <span className="text-base-content/90 font-mono font-bold">
                                    {resItem.value} {resItem.unit || ''} {resItem.range ? `(Ref: ${resItem.range})` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {(matchedResult?.remarks || matchedResult?.form?.remarks) && (
                              <p className="text-xs text-base-content/80 mt-2 italic">
                                Remarks: {matchedResult.remarks || matchedResult.form.remarks}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-base-200/20 rounded-xl border border-dashed border-base-300">
                  <p className="text-sm text-base-content/50">No lab or scan investigations ordered for this antenatal record</p>
                </div>
              )}
            </div>
          </details>

          {/* Section 7: Delivery Summary (if recorded) */}
          {r.delivery && (
            <details className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-xl overflow-hidden">
              <SectionHeader title="Delivery Information" badgeColor="badge-secondary" />
              <div className="collapse-content p-4 pt-2 border-t border-base-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(r.delivery)
                    .filter(([, val]) => val !== null && val !== undefined && val !== '' && typeof val !== 'object')
                    .map(([key, val]) => (
                      <div key={key} className="flex justify-between p-2.5 bg-base-200/50 rounded-lg">
                        <span className="font-medium text-base-content/70 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-semibold text-base-content">{String(val)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-200 bg-base-100 flex items-center justify-between">
          <div className="text-xs text-base-content/50">
            ID: <span className="font-mono">{recordId || '—'}</span>
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

export default AntenatalDetailModal;
