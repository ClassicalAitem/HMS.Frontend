import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { updateDependantStatus } from '@/services/api/dependantAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';

const STEP = { SUBJECT: 'subject', ROLE: 'role', STATUS: 'status' };

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
};

const initials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

const SendPatientModal = ({
  patientId,
  patient = null,
  currentStatus = '',
  onUpdated,
  allowedRoles = ['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'cashier', 'hmo'],
  containerClass = 'flex gap-2 flex-nowrap overflow-x-auto',
  isOpdPatient = false,
    defaultDependantId = null,       
  defaultDependantLabel = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(STEP.SUBJECT);
  const [selectedSubject, setSelectedSubject] = useState(null); // { type: 'patient'|'dependant', id, label }
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const dependants = patient?.dependants || [];
  const hasDependants = dependants.length > 0;
  const visibleRoles = Object.keys(roleConfig).filter(r => allowedRoles.includes(r));

    // Resolve the locked subject once, if we're scoped to a dependant
  const lockedSubject = useMemo(() => {
    if (!defaultDependantId) return null;
    const match = dependants.find(d => d.id === defaultDependantId);
    return {
      type: 'dependant',
      id: defaultDependantId,
      label:
        (match ? `${match.firstName || ''} ${match.lastName || ''}`.trim() : '') ||
        defaultDependantLabel ||
        'Dependant',
    };
  }, [defaultDependantId, dependants, defaultDependantLabel]);

  const open = () => {
    if (lockedSubject) {
      setSelectedSubject(lockedSubject);
      setStep(STEP.ROLE);
    } else if (!hasDependants) {
      setSelectedSubject({ type: 'patient', id: patientId, label: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient' });
      setStep(STEP.ROLE);
    } else {
      setStep(STEP.SUBJECT);
      setSelectedSubject(null);
    }
    setSelectedRole(null);
    setSelectedStatus(null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setStep(STEP.SUBJECT);
    setSelectedSubject(null);
    setSelectedRole(null);
    setSelectedStatus(null);
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setStep(STEP.ROLE);
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

  const handleComplete = async (subject) => {
  if (!subject?.id) {
    toast.error('No subject selected');
    return;
  }

  setIsSending(true);
  try {
    const isDependent = subject.type === 'dependant';
    const promise = isDependent
      ? updateDependantStatus(subject.id, { status: PATIENT_STATUS.COMPLETED })
      : updatePatientStatus(subject.id, { status: PATIENT_STATUS.COMPLETED });

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
  const handleSend = async (role, status, subject) => {
    if (!subject?.id) {
      toast.error('No subject selected');
      return;
    }

    setIsSending(true);
    try {
      const isDependent = subject.type === 'dependant';
      const promise = isDependent
        ? updateDependantStatus(subject.id, { status })
        : updatePatientStatus(subject.id, { status });

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
  };

  return (
    <>
      {/* Trigger button(s) — kept same as before for backward compat */}
      <div className={containerClass}>
        <button className="btn btn-sm btn-primary" onClick={open} disabled={isSending}>
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {visibleRoles.map(role => {
                    const config = roleConfig[role];
                    return (
                      <button
                        key={role}
                        className={`btn btn-sm ${config.color} btn-outline`}
                        onClick={() => handleSelectRole(role)}
                        disabled={isSending}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                  <div className="pt-2 border-t border-base-200">
                  <button
                    className="btn btn-sm btn-success w-full"
                    onClick={() => handleComplete(selectedSubject)}
                    disabled={isSending}
                  >
                    ✅ Mark as Completed
                  </button>
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

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SendPatientModal;