import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';

const PharmacyActionModal2 = ({ isOpen, onClose, patientId, defaultAction = 'awaiting_pharmacy', onUpdated }) => {
  const [selectedAction, setSelectedAction] = useState(defaultAction);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSending(true);
      const promise = updatePatientStatus(patientId, selectedAction);
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
            <h2 className="text-xl font-bold text-base-content">Send to Pharmacy</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
          <p className="mb-3 text-sm text-base-content/70">Select the action for this patient:</p>
          <div className="space-y-2">
            {['awaiting_pharmacy'].map(action => (
              <label key={action} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pharmacyAction"
                  className="radio radio-primary"
                  checked={selectedAction === action}
                  onChange={() => setSelectedAction(action)}
                />
                <span className="capitalize">{action.replace('awaiting_', 'Awaiting ')}</span>
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

export default PharmacyActionModal2;