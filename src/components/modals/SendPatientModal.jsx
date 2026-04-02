import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';

const SendPatientModal = ({ 
  patientId, 
  currentStatus = '',
  onUpdated,
  allowedRoles = ['nurse', 'doctor', 'pharmacist', 'labtechnician', 'cashier', 'hmo'],
  containerClass = 'flex gap-2 flex-nowrap overflow-x-auto',
}) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Role configuration with display name and default status
  const roleConfig = {
    nurse: {
      label: 'Send to Nurse',
      status: [PATIENT_STATUS.AWAITING_VITALS, PATIENT_STATUS.AWAITING_SAMPLING, PATIENT_STATUS.AWAITING_NURSE, PATIENT_STATUS.AWAITING_INJECTION],
      icon: '🏥',
      color: 'btn-info',
    },
    doctor: {
      label: 'Send to Doctor',
      status: [PATIENT_STATUS.AWAITING_CONSULTATION, PATIENT_STATUS.AWAITING_SURGERY, PATIENT_STATUS.AWAITING_DOCTOR],
      icon: '👨‍⚕️',
      color: 'btn-primary',
    },
    pharmacist: {
      label: 'Send to Pharmacist',
      status: PATIENT_STATUS.AWAITING_PHARMACY,
      icon: '💊',
      color: 'btn-warning',
    },
    labtechnician: {
      label: 'Send to Lab',
      status: PATIENT_STATUS.AWAITING_LAB,
      icon: '🔬',
      color: 'btn-success',
    },
    cashier: {
      label: 'Send to Cashier',
      status: PATIENT_STATUS.AWAITING_CASHIER,
      icon: '💰',
      color: 'btn-accent',
    },
    hmo: {
      label: 'Send to HMO',
      status: PATIENT_STATUS.AWAITING_HMO,
      icon: '🏢',
      color: 'btn-secondary',
    },
  };

  const visibleRoles = Object.keys(roleConfig).filter(role => allowedRoles.includes(role));


  // Handle single status send
  const handleSendDirect = async (role) => {
    if (!patientId) {
      toast.error('Patient ID is missing');
      return;
    }

    try {
      setIsSending(true);
      const config = roleConfig[role];
      const statusToSend = Array.isArray(config.status) ? config.status[0] : config.status;

      const promise = updatePatientStatus(patientId, { status: statusToSend });

      toast.promise(promise, {
        loading: `Sending to ${config.label}...`,
        success: `Patient sent to ${config.label} successfully`,
        error: (err) => err?.response?.data?.message || `Failed to send to ${config.label}`,
      });

      await promise;

      if (onUpdated) onUpdated();

    } catch (e) {
      toast.error(e?.response?.data?.message || 'An error occurred');
    } finally {
      setIsSending(false);
    }
  };

  // Handle multi-status role - show status selector
  const handleMultiStatusRole = (role) => {
    setSelectedRole(role);
    setShowStatusSelector(true);
  };

  // Confirm status selection for multi-status roles
  const handleConfirmStatus = async () => {
    if (!selectedStatus || !selectedRole || !patientId) {
      toast.error('Invalid selection');
      return;
    }

    try {
      setIsSending(true);
      const config = roleConfig[selectedRole];

      const promise = updatePatientStatus(patientId, { status: selectedStatus });

      toast.promise(promise, {
        loading: `Sending to ${config.label}...`,
        success: `Patient sent to ${config.label} successfully`,
        error: (err) => err?.response?.data?.message || `Failed to send to ${config.label}`,
      });

      await promise;

      // Reset
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

  const closeStatusSelector = () => {
    setShowStatusSelector(false);
    setSelectedRole(null);
    setSelectedStatus(null);
  };

  return (
    <>
      {/* Individual Action Buttons */}
      <div className={containerClass}>
        {visibleRoles.map(role => {
          const config = roleConfig[role];
          const isMultiStatus = Array.isArray(config.status);
          
          return (
            <button
              key={role}
              className={`btn btn-sm ${config.color}`}
              onClick={() => isMultiStatus ? handleMultiStatusRole(role) : handleSendDirect(role)}
              disabled={isSending}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Selector Modal (for multi-status roles) */}
      {showStatusSelector && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeStatusSelector} />
          
          <div className="relative z-10 w-full max-w-md shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-base-content">
                  {roleConfig[selectedRole]?.label}
                </h2>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={closeStatusSelector}
                  disabled={isSending}
                >
                  ✕
                </button>
              </div>

              <p className="mb-4 text-sm text-base-content/70">
                Select the task for this patient:
              </p>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {Array.isArray(roleConfig[selectedRole]?.status) && 
                  roleConfig[selectedRole]?.status.map((status) => {
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
                        </div>
                      </label>
                    );
                  })}
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-base-200 pt-4">
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={closeStatusSelector}
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  disabled={isSending || !selectedStatus}
                  onClick={handleConfirmStatus}
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
        </div>
      )}
    </>
  );
};

export default SendPatientModal;
