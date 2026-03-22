import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { mergePatientStatus } from '@/utils/statusUtils';

const LabActionModal = ({ isOpen, onClose, patientId, currentStatus = [], defaultAction = { status: PATIENT_STATUS.AWAITING_LAB }, onUpdated }) => {
  const [selectedAction, setSelectedAction] = useState(defaultAction);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

const handleConfirm = async () => {
  try {
    setIsSending(true);
    // ✅ Single string status
    const promise = updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_LAB });
    toast.promise(promise, {
      loading: 'Sending to lab...',
      success: 'Patient sent to lab successfully',
      error: (err) => err?.response?.data?.message || 'Failed to send to lab',
    });
    await promise;
    onClose();
    if (onUpdated) onUpdated();
  } catch (e) {
    toast.error(e?.response?.data?.message || 'An error occurred while sending to lab');
  } finally {
    setIsSending(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Send to Lab</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
          <p className="mb-3 text-sm text-base-content/70">Select the action for this patient:</p>
          <div className="space-y-2">
            {{ status: PATIENT_STATUS.AWAITING_LAB }.map(action => (
              <label key={action.status} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="labAction"
                  className="radio radio-primary"
                  checked={selectedAction === action || (Array.isArray(selectedAction) && selectedAction[0] === action)}
                  onChange={() => setSelectedAction(action)}
                />
                <span className="capitalize">{action.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={isSending} onClick={handleConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabActionModal;