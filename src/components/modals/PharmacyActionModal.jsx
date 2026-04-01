import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { mergePatientStatus } from '@/utils/statusUtils';

const PharmacyActionModal = ({
  isOpen,
  onClose,
  patientId,
  currentStatus = '',
  defaultStatus = PATIENT_STATUS.AWAITING_PHARMACY,
  onUpdated,
  itemsCount,
  medicationNames = [],
  patientLabel,
}) => {
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

const handleConfirm = async () => {
  try {
    setIsSending(true);
    // ✅ Status is now a single string — just send it directly
    const promise = updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_PHARMACY });
    toast.promise(promise, {
      loading: 'Sending to pharmacy...',
      success: 'Patient sent to pharmacy successfully',
      error: (err) => err?.response?.data?.message || 'Failed to send to pharmacy',
    });
    await promise;
    onClose();
    if (onUpdated) onUpdated();
  } catch (e) {
    // handled by toast
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
            <h2 className="text-xl font-bold text-base-content">Confirm Send to Pharmacy</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          

          <div className="flex justify-end gap-3 mt-6">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={isSending} onClick={handleConfirm}>Confirm & Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyActionModal;
