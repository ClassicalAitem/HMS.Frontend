import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { useNavigate } from 'react-router-dom';

const SendPatientModal = ({ 
  patientId, 
  currentStatus = '',
  onUpdated,
  buttonLabel = 'Send',
  buttonClass = 'btn btn-outline btn-sm',
  allowedRoles = ['nurse', 'doctor', 'pharmacy', 'lab', 'cashier'], // customize which roles show up
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  // Role configuration with display name and default status
  const roleConfig = {
    nurse: {
      label: 'Nurse',
      status: [PATIENT_STATUS.AWAITING_VITALS, PATIENT_STATUS.AWAITING_SAMPLING, PATIENT_STATUS.AWAITING_NURSE, PATIENT_STATUS.AWAITING_INJECTION], // nurse can have multiple possible statuses
      icon: '🏥',
      description: 'Send for vitals and initial assessment',
    },
    doctor: {
      label: 'Doctor',
      status: [PATIENT_STATUS.AWAITING_CONSULTATION, PATIENT_STATUS.AWAITING_SURGERY, PATIENT_STATUS.AWAITING_DOCTOR], // doctor can have multiple possible statuses
      icon: '👨‍⚕️',
      description: 'Send for consultation',
    },
    pharmacist: {
      label: 'Pharmacist',
      status: PATIENT_STATUS.AWAITING_PHARMACY,
      icon: '💊',
      description: 'Send for medication pickup',
    },
    labtechnician: {
      label: 'Lab-technician',
      status: PATIENT_STATUS.AWAITING_LAB,
      icon: '🔬',
      description: 'Send for lab tests',
    },
    cashier: {
      label: 'Cashier',
      status: PATIENT_STATUS.AWAITING_CASHIER,
      icon: '💰',
      description: 'Send for billing',
    },
    hmo: {
      label: 'HMO',
      status: PATIENT_STATUS.AWAITING_HMO,
      icon: '🏢',
      description: 'Send for HMO processing',
    },
  };

  const visibleRoles = Object.keys(roleConfig).filter(role => allowedRoles.includes(role));

  // Handle role selection - check if multi-status or single
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    const config = roleConfig[role];
    
    // If role has multiple statuses, show status selector
    if (Array.isArray(config.status)) {
      setShowStatusSelector(true);
    } else {
      // Single status, send directly - pass role directly to avoid async state issues
      setSelectedStatus(config.status);
      handleConfirm(config.status, role);
    }
  };

  // Send with selected status
const handleConfirm = async (statusToSend, roleToSend = selectedRole) => {
  if (!roleToSend || !patientId || !statusToSend) {
    toast.error('Invalid selection');
    return;
  }

  try {
    setIsSending(true);
    const config = roleConfig[roleToSend];



    const promise = updatePatientStatus(patientId, { status: statusToSend });

    toast.promise(promise, {
      loading: `Sending to ${config.label}...`,
      success: `Patient sent to ${config.label} successfully`,
      error: (err) => err?.response?.data?.message || `Failed to send to ${config.label}`,
    });

    await promise;

    // Reset
    setIsModalOpen(false);
    setSelectedRole(null);
    setSelectedStatus(null);
    setShowStatusSelector(false);

    if (onUpdated) onUpdated();

  } catch (e) {
    toast.error(e?.response?.data?.message || 'An error occurred');
  } finally {
    setIsSending(false);
  }
};

  return (
    <>
      {/* Send Button */}
      <button 
        className={buttonClass}
        onClick={() => setIsModalOpen(true)}
      >
        {buttonLabel}
      </button>

      {/* Role Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !showStatusSelector && setIsModalOpen(false)} />
          
          {showStatusSelector && selectedRole ? (
            /* Status Selector Modal */
            <div className="relative z-10 w-full max-w-md shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-base-content">
                    Select Task for {roleConfig[selectedRole]?.label}
                  </h2>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => {
                      setShowStatusSelector(false);
                      setSelectedRole(null);
                    }}
                    disabled={isSending}
                  >
                    ✕
                  </button>
                </div>

                <p className="mb-4 text-sm text-base-content/70">
                  Pick what task to assign:
                </p>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {Array.isArray(roleConfig[selectedRole]?.status) && roleConfig[selectedRole]?.status.map((status) => {
                    const statusLabel = status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                    return (
                      <label
                        key={status}
                        className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedStatus === status ? '#7c3aed' : '#e5e7eb',
                          backgroundColor: selectedStatus === status ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name="sendStatus"
                          className="radio radio-primary mt-1"
                          checked={selectedStatus === status}
                          onChange={() => setSelectedStatus(status)}
                          disabled={isSending}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-base-content">{statusLabel}</div>
                          <p className="text-xs text-base-content/50 mt-1">
                            Send patient to {roleConfig[selectedRole]?.label.toLowerCase()} for {statusLabel.toLowerCase()}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-base-200 pt-4">
                  <button 
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowStatusSelector(false);
                      setSelectedRole(null);
                      setSelectedStatus(null);
                    }}
                    disabled={isSending}
                  >
                    Back
                  </button>
                  <button 
                    className="btn btn-primary"
                    disabled={isSending || !selectedStatus}
                    onClick={() => handleConfirm(selectedStatus, selectedRole)}
                  >
                    {isSending ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Role Selection Modal */
            <div className="relative z-10 w-full max-w-md shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-base-content">Send to Department</h2>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSending}
                  >
                    ✕
                  </button>
                </div>

                <p className="mb-4 text-sm text-base-content/70">
                  Choose where to send this patient:
                </p>

                {/* Role Options Grid */}
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {visibleRoles.map(role => {
                    const config = roleConfig[role];
                    const isMultiStatus = Array.isArray(config.status);
                    return (
                      <label
                        key={role}
                        className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedRole === role ? '#7c3aed' : '#e5e7eb',
                          backgroundColor: selectedRole === role ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name="sendRole"
                          className="radio radio-primary mt-1"
                          checked={selectedRole === role}
                          onChange={() => handleRoleSelect(role)}
                          disabled={isSending}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{config.icon}</span>
                            <span className="font-semibold text-base-content">{config.label}</span>
                            {isMultiStatus && <span className="badge badge-xs badge-info">Select Task</span>}
                          </div>
                          <p className="text-xs text-base-content/50 mt-1">
                            {config.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Action Buttons - Only show for single status roles */}
                {!showStatusSelector && (
                  <div className="flex justify-end gap-3 mt-6 border-t border-base-200 pt-4">
                    <button 
                      className="btn btn-ghost"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedRole(null);
                      }}
                      disabled={isSending}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SendPatientModal;
