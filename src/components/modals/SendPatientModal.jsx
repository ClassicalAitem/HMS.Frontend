import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { updatePatient, updatePatientStatus } from '@/services/api/patientsAPI';
import { updateDependant, updateDependantStatus } from '@/services/api/dependantAPI';
import { updateOpdPatient } from '@/services/api/opdPatientAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { getInvestigationByPatientId, getInvestigationRequestByOpdPatientId } from '@/services/api/investigationRequestAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';

const STEP = { SUBJECT: 'subject', ROLE: 'role', STATUS: 'status', WARNING: 'warning' };

const roleConfig = {
  nurse: {
    label: 'Nurse',
    status: [PATIENT_STATUS.AWAITING_VITALS, PATIENT_STATUS.AWAITING_SAMPLING, PATIENT_STATUS.AWAITING_NURSE, PATIENT_STATUS.AWAITING_INJECTION],
    icon: '🏥',
    color: 'btn-info',
  },
  doctor: {
    label: 'Doctor',
    status: [PATIENT_STATUS.AWAITING_CONSULTATION, PATIENT_STATUS.AWAITING_SURGERY, PATIENT_STATUS.AWAITING_DOCTOR],
    icon: '👨‍⚕️',
    color: 'btn-primary',
  },
  'medical-director': {
    label: 'Medical Director',
    status: PATIENT_STATUS.AWAITING_MD,
    icon: '👨‍⚕️',
    color: 'btn-primary',
  },
  pharmacist: {
    label: 'Pharmacist',
    status: PATIENT_STATUS.AWAITING_PHARMACY,
    icon: '💊',
    color: 'btn-warning',
  },
  labtechnician: {
    label: 'Lab',
    status: PATIENT_STATUS.AWAITING_LAB,
    icon: '🔬',
    color: 'btn-success',
  },
  cashier: {
    label: 'Cashier',
    status: PATIENT_STATUS.AWAITING_CASHIER,
    icon: '💰',
    color: 'btn-accent',
  },
  hmo: {
    label: 'HMO',
    status: PATIENT_STATUS.AWAITING_HMO,
    icon: '🏢',
    color: 'btn-primary',
  },
  sonographer: {
    label: 'Sonographer',
    status: PATIENT_STATUS.AWAITING_SONOGRAPHER,
    icon: '👩‍⚕️',
    color: 'btn-accent',
  },
};

const initials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

const SendPatientModal = ({
  patientId,
  patient = null,
  currentStatus = '',
  onUpdated,
  allowedRoles = ['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'cashier', 'hmo' , 'sonographer', 'radiologist'],
  containerClass = 'flex gap-2 flex-nowrap overflow-x-auto',
  isOpdPatient = false,
    defaultDependantId = null,       
  defaultDependantLabel = null,
  lockSubject = false,
}) => {
  const location = useLocation();
  const isFrontDesk = location.pathname.includes('/frontdesk/');
  const isCashier = location.pathname.includes('/cashier/');
  const isNurse = location.pathname.includes('/nurse/');

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(STEP.SUBJECT);
  const [selectedSubject, setSelectedSubject] = useState(null); // { type: 'patient'|'dependant', id, label }
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const [notForConsultation, setNotForConsultation] = useState(false);
  const [consultationType, setConsultationType] = useState('Doctor');
  const [pendingInvestigationsList, setPendingInvestigationsList] = useState([]);
  const [pendingActionParams, setPendingActionParams] = useState(null);

  const dependants = patient?.dependants || [];
  const hasDependants = dependants.length > 0;
  
  const activeConsultationType = useMemo(() => {
    const activeSubjectEntity = hasDependants && defaultDependantId 
      ? dependants.find(d => d.id === defaultDependantId) 
      : patient;
    return activeSubjectEntity?.consultationType;
  }, [dependants, defaultDependantId, patient, hasDependants]);
  
  const visibleRoles = useMemo(() => {
    let roles = Object.keys(roleConfig).filter(r => allowedRoles.includes(r));
    if (isFrontDesk && !notForConsultation) {
      // Restrict frontdesk to Cashier or HMO if they are here for consultation
      roles = roles.filter(r => r === 'cashier' || r === 'hmo');
    }
    
    if (isNurse && activeConsultationType) {
      if (activeConsultationType === 'Medical Director') {
        roles = roles.filter(r => r !== 'doctor');
      } else if (activeConsultationType === 'Doctor') {
        roles = roles.filter(r => r !== 'medical-director');
      }
    }
    return roles;
  }, [allowedRoles, isFrontDesk, notForConsultation, isNurse, activeConsultationType]);

    // Resolve the locked subject once, if we're scoped to a dependant
const lockedSubject = useMemo(() => {
  if (defaultDependantId) {
    const match = dependants.find(d => d.id === defaultDependantId);
    return {
      type: 'dependant',
      id: defaultDependantId,
      label:
        (match ? `${match.firstName || ''} ${match.lastName || ''}`.trim() : '') ||
        defaultDependantLabel ||
        'Dependant',
    };
  }

  // Not viewing a dependant, but this page still shouldn't show the picker
  if (lockSubject) {
    return {
      type: 'patient',
      id: patientId,
      label: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient',
    };
  }

  return null;
}, [defaultDependantId, dependants, defaultDependantLabel, lockSubject, patientId, patient]);
  const shouldCheckInvestigationWarnings = () => {
    const currentPath = (location.pathname || '').toLowerCase();
    return currentPath.includes('/cashier/') || currentPath.includes('/hmo/') || currentPath.includes('/laboratory/') || currentPath.includes('/sonographer/');
  };

  const fetchPendingInvestigationWarnings = async (subject) => {
    if (!subject?.id || !shouldCheckInvestigationWarnings()) return [];

    try {
      let list = [];

      if (isOpdPatient) {
        const res = await getInvestigationRequestByOpdPatientId(patientId);
        list = Array.isArray(res) ? res : (res?.data ?? []);
      } else {
        const res = await getInvestigationByPatientId(patientId);
        list = Array.isArray(res) ? res : (res?.data ?? []);
      }

      const normalized = (value = '') => String(value).trim().toLowerCase();
      const pendingStatuses = new Set(['pending', 'in_progress', 'in progress', 'processing']);
      
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return list.filter((inv) => {
        const isMatch = subject.type === 'dependant'
          ? String(inv.dependantId) === String(subject.id)
          : !inv.dependantId && (!inv.patientId || String(inv.patientId) === String(patientId));

        if (!isMatch) return false;
        
        const invDate = new Date(inv.createdAt || inv.date);
        if (isNaN(invDate.getTime()) || invDate < twentyFourHoursAgo) return false;

        const status = normalized(inv.status);
        return pendingStatuses.has(status);
      });
    } catch (err) {
      console.warn('Failed to check pending investigations for send modal:', err);
      return [];
    }
  };

  const open = async () => {
    setNotForConsultation(false);
    setConsultationType('Doctor');
    setPendingInvestigationsList([]);
    setPendingActionParams(null);

    let initialSubject = null;
    if (lockedSubject) {
      initialSubject = lockedSubject;
    } else if (!hasDependants) {
      initialSubject = {
        type: 'patient',
        id: patientId,
        label: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient',
      };
    }

    if (initialSubject) {
      setIsSending(true);
      setSelectedSubject(initialSubject);
      
      const warnings = await fetchPendingInvestigationWarnings(initialSubject);
      
      if (warnings.length > 0) {
        setPendingInvestigationsList(warnings);
        setStep(STEP.WARNING);
      } else {
        setStep(STEP.ROLE);
      }
      setIsSending(false);
      setIsOpen(true);
      return;
    }

    setSelectedSubject(null);
    setStep(STEP.SUBJECT);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setStep(STEP.SUBJECT);
    setSelectedSubject(null);
    setSelectedRole(null);
    setSelectedStatus(null);
    setPendingActionParams(null);
  };

  const handleSelectSubject = async (subject) => {
    setIsSending(true);
    setSelectedSubject(subject);
    setPendingInvestigationsList([]);
    setPendingActionParams(null);

    if (shouldCheckInvestigationWarnings()) {
      const warnings = await fetchPendingInvestigationWarnings(subject);
      if (warnings.length > 0) {
        setPendingInvestigationsList(warnings);
        setStep(STEP.WARNING);
        setIsSending(false);
        return;
      }
    }

    setStep(STEP.ROLE);
    setIsSending(false);
  };

  const handleSelectRole = (role) => {
    const config = roleConfig[role];
    setSelectedRole(role);
    if (Array.isArray(config.status)) {
      setSelectedStatus(null);
      setStep(STEP.STATUS);
    } else {
      setSelectedStatus(config.status);
      handleSend(role, config.status, selectedSubject);
    }
  };

  const verifyNoPending = async (subject, targetRole) => {
    const isLab = location.pathname.includes('/laboratory');
    const isSonographer = location.pathname.includes('/sonographer');
    const isCashierRoute = location.pathname.includes('/cashier');
    const isHmo = location.pathname.includes('/hmo');

    if (!(isLab || isSonographer || isCashierRoute || isHmo)) return true;
    if (targetRole !== 'doctor' && targetRole !== 'medical-director' && targetRole !== 'completed') return true;

    setIsSending(true);
    try {
      const pendingInvestigations = await fetchPendingInvestigationWarnings(subject);
      if (pendingInvestigations.length > 0) {
        setPendingInvestigationsList(pendingInvestigations);
        setStep(STEP.WARNING);
        setIsSending(false);
        return false;
      }
    } catch (err) {
      console.warn("Failed to check pending investigations:", err);
    }
    setIsSending(false);
    return true;
  };

  const handleComplete = async (subject, force = false) => {
  if (!subject?.id) {
    toast.error('No subject selected');
    return;
  }

  if (!force) {
    const canProceed = await verifyNoPending(subject, 'completed');
    if (!canProceed) {
      setPendingActionParams({ type: 'complete', subject });
      return;
    }
  }

  setIsSending(true);
  try {
    const isDependent = subject.type === 'dependant';
    
    let promise;
    if (isOpdPatient) {
      promise = updateOpdPatient(subject.id, { status: PATIENT_STATUS.COMPLETED });
    } else if (isDependent) {
      promise = updateDependantStatus(subject.id, { status: PATIENT_STATUS.COMPLETED });
    } else {
      promise = updatePatientStatus(subject.id, { status: PATIENT_STATUS.COMPLETED });
    }

    toast.promise(promise, {
      loading: `Marking ${subject.label} as completed...`,
      success: `${subject.label} marked as completed`,
      error: (err) => err?.response?.data?.message || `Failed to mark ${subject.label} as completed`,
    });

    await promise;
    close();
    if (onUpdated) onUpdated();
  } catch {
    toast.error(`Failed to mark ${subject.label} as completed`);
  } finally {
    setIsSending(false);
  }
};
  const handleSend = async (role, status, subject, force = false) => {
    if (!subject?.id) {
      toast.error('No subject selected');
      return;
    }

    if (!force) {
      const canProceed = await verifyNoPending(subject, role);
      if (!canProceed) {
        setPendingActionParams({ type: 'send', role, status, subject });
        return;
      }
    }

    setIsSending(true);
    try {
      const isDependent = subject.type === 'dependant';

      if (isCashier && role === 'nurse') {
        let updatePromise;
        if (isOpdPatient) {
          updatePromise = updateOpdPatient(subject.id, { consultationType });
        } else if (isDependent) {
          updatePromise = updateDependant(subject.id, { consultationType });
        } else {
          updatePromise = updatePatient(subject.id, { consultationType });
        }
        await updatePromise;
      }

      let promise;
      if (isOpdPatient) {
        promise = updateOpdPatient(subject.id, { status });
      } else if (isDependent) {
        promise = updateDependantStatus(subject.id, { status });
      } else {
        promise = updatePatientStatus(subject.id, { status });
      }

      toast.promise(promise, {
        loading: `Sending ${subject.label} to ${roleConfig[role].label}...`,
        success: `${subject.label} sent to ${roleConfig[role].label}`,
        error: (err) => err?.response?.data?.message || `Failed to send to ${roleConfig[role].label}`,
      });

      await promise;
      close();
      if (onUpdated) onUpdated();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmStatus = () => {
    if (!selectedStatus || !selectedRole || !selectedSubject) return;
    handleSend(selectedRole, selectedStatus, selectedSubject);
  };

  const stepTitle = {
    [STEP.SUBJECT]: 'Who are you sending?',
    [STEP.ROLE]: `Send ${selectedSubject?.label || ''} to...`,
    [STEP.STATUS]: `Select task for ${roleConfig[selectedRole]?.label || ''}`,
    [STEP.WARNING]: '⚠️ Pending Investigations Found',
  };

  return (
    <>
      {/* Trigger button(s) — kept same as before for backward compat */}
      <div className={containerClass}>
        <button className="btn btn-primary m-3 flex items-center gap-2" onClick={open} disabled={isSending}>
          {isSending && !isOpen && <span className="loading loading-spinner loading-sm" />}
          {lockedSubject ? `Send ${lockedSubject.label}` : 'Send Patient'}
        </button>
      </div>

      {!isOpen ? null : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={close} />

          <div className="relative z-10 w-full max-w-md shadow-xl card bg-base-100">
            <div className="p-6 card-body">

              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {step !== STEP.SUBJECT && (
                    <button
                      className="btn btn-ghost btn-xs btn-circle"
                      onClick={() => {
                        if (step === STEP.STATUS) setStep(STEP.ROLE);
                        else if (step === STEP.ROLE) {
                          if (lockedSubject) close();
                          else if (hasDependants) setStep(STEP.SUBJECT);
                          else close();
                        }
                      }}
                      disabled={isSending}
                      aria-label="Back"
                    >
                      ←
                    </button>
                  )}
                  <h2 className="text-lg font-bold text-base-content">{stepTitle[step]}</h2>
                </div>
                <button className="btn btn-ghost btn-xs btn-circle" onClick={close} disabled={isSending}>✕</button>
              </div>

              {/* Step indicator */}
              {hasDependants && !lockedSubject && (
                <div className="flex gap-1 mb-4">
                  {[STEP.SUBJECT, STEP.ROLE, STEP.STATUS].map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        [STEP.SUBJECT, STEP.ROLE, STEP.STATUS].indexOf(step) >= i
                          ? 'bg-primary'
                          : 'bg-base-300'
                      }`}
                    />
                  ))}
                </div>
              )}

            

              {/* STEP 1 — Subject selection */}
              {step === STEP.SUBJECT && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {/* Patient option */}
                  <button
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                    onClick={() => handleSelectSubject({
                      type: 'patient',
                      id: patientId,
                      label: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient',
                    })}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(patient?.firstName, patient?.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}
                      </div>
                      <div className="text-xs text-base-content/50">{patient?.hospitalId || 'Patient'}</div>
                    </div>
                    <span className="badge badge-ghost badge-sm shrink-0">Patient</span>
                  </button>

                  {/* Dependant options */}
                  {dependants.map(dep => (
                    <button
                      key={dep.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                      onClick={() => handleSelectSubject({
                        type: 'dependant',
                        id: dep.id,
                        label: `${dep.firstName || ''} ${dep.lastName || ''}`.trim(),
                      })}
                    >
                      <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                        {initials(dep.firstName, dep.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {`${dep.firstName || ''} ${dep.lastName || ''}`.trim()}
                        </div>
                        <div className="text-xs text-base-content/50 capitalize">{dep.relationshipType || 'Dependant'}</div>
                      </div>
                      <span className="badge badge-ghost badge-sm shrink-0">Dependant</span>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 2 — Role selection */}
              {step === STEP.ROLE && (
                <div className="space-y-4 mt-2">
                  {isFrontDesk && (
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-base-200 rounded-lg">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={notForConsultation}
                        onChange={(e) => setNotForConsultation(e.target.checked)}
                      />
                      <span className="text-sm font-medium">Patient is NOT here for consultation</span>
                    </label>
                  )}
                  {isCashier && (
                    <div className="form-control w-full bg-base-200 p-3 rounded-lg">
                      <label className="label pt-0">
                        <span className="label-text font-medium text-base">Select Consultation Type</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={consultationType}
                        onChange={(e) => setConsultationType(e.target.value)}
                      >
                        <option value="Doctor">Doctor (₦3,000)</option>
                        <option value="Medical Director">Medical Director (₦5,000)</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {visibleRoles.map(role => {
                    const config = roleConfig[role];
                    const isDoctorRole = role === 'doctor' || role === 'medical-director';
                    const isBlocked = isDoctorRole && pendingInvestigationsList.length > 0;
                    return (
                      <div key={role} className={isBlocked ? "tooltip tooltip-bottom z-50 w-full" : "w-full"} data-tip={isBlocked ? "Pending tests must be completed first" : ""}>
                        <button
                          className={`btn btn-sm w-full ${config.color} ${isBlocked ? 'btn-disabled opacity-50' : 'btn-outline'}`}
                          onClick={() => handleSelectRole(role)}
                          disabled={isSending || isBlocked}
                        >
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </button>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-base-200 col-span-2">
                    <div className={pendingInvestigationsList.length > 0 ? "tooltip tooltip-bottom z-50 w-full" : "w-full"} data-tip={pendingInvestigationsList.length > 0 ? "Pending tests must be completed first" : ""}>
                      <button
                        className={`btn btn-sm btn-success w-full ${pendingInvestigationsList.length > 0 ? 'btn-disabled opacity-50' : ''}`}
                        onClick={() => handleComplete(selectedSubject)}
                        disabled={isSending || pendingInvestigationsList.length > 0}
                      >
                        ✅ Mark as Completed
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Status selection (multi-status roles only) */}
              {step === STEP.STATUS && selectedRole && (
                <div className="space-y-2 mt-2 max-h-72 overflow-y-auto">
                  {Array.isArray(roleConfig[selectedRole]?.status) &&
                    roleConfig[selectedRole].status.map(status => {
                      const label = status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                      return (
                        <label
                          key={status}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedStatus === status
                              ? 'border-primary bg-primary/5'
                              : 'border-base-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="sendStatus"
                            className="radio radio-primary radio-sm"
                            checked={selectedStatus === status}
                            onChange={() => setSelectedStatus(status)}
                            disabled={isSending}
                          />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      );
                    })}

                  <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={isSending || !selectedStatus}
                      onClick={handleConfirmStatus}
                    >
                      {isSending ? <span className="loading loading-spinner loading-sm" /> : 'Send'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 — Warning for Pending Investigations */}
              {step === STEP.WARNING && (
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-base-content/80">
                    This patient still has the following pending or in-progress investigations requested today. Are you sure you want to proceed?
                  </p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {pendingInvestigationsList.map(inv => (
                      <div key={inv._id || inv.id} className="p-3 bg-base-200/50 rounded-lg border border-base-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="badge badge-primary badge-sm uppercase text-[10px] font-bold">
                            {inv.type || 'Unknown Type'}
                          </span>
                          <span className="text-xs text-base-content/50">
                            {inv.createdAt ? formatNigeriaDateTime(inv.createdAt) : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(inv.tests || []).map((t, idx) => (
                            <span key={idx} className="badge badge-ghost badge-sm bg-base-100">
                              {typeof t === 'object' ? (t.name || t.code) : t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (pendingActionParams) {
                          setStep(pendingActionParams.role ? STEP.ROLE : STEP.SUBJECT);
                          setPendingActionParams(null);
                        } else {
                          close();
                        }
                      }}
                      disabled={isSending}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => {
                        if (pendingActionParams?.type === 'complete') {
                          handleComplete(pendingActionParams.subject, true);
                        } else if (pendingActionParams?.type === 'send') {
                          handleSend(pendingActionParams.role, pendingActionParams.status, pendingActionParams.subject, true);
                        } else {
                          // Warning was shown proactively on open — just proceed to role selection
                          setStep(STEP.ROLE);
                        }
                      }}
                      disabled={isSending}
                    >
                      {isSending ? <span className="loading loading-spinner loading-sm" /> : (!pendingActionParams ? 'Continue to Roles' : 'Proceed Anyway')}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SendPatientModal;