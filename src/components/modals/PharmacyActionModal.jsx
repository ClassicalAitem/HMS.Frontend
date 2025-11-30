import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';

const PharmacyActionModal = ({
  isOpen,
  onClose,
  patientId,
  defaultStatus = 'awaiting_pharmacy',
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
      const promise = updatePatientStatus(patientId, defaultStatus);
      toast.promise(promise, {
        loading: 'Sending to pharmacy...',
        success: 'Prescription sent to pharmacy successfully',
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

          <p className="mb-4 text-sm text-base-content/70">
            Are you sure you want to send this prescription to the pharmacy? This action will notify the pharmacy to prepare medications{patientLabel ? ` for ${patientLabel}` : ''}.
          </p>

          <div className="rounded-lg border border-base-300 p-4 bg-base-200/30">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-base-content/70">Total Medications</span>
              <span className="font-medium text-base-content">{itemsCount || 0}</span>
            </div>
            <div className="mt-2 text-sm">
              <div className="text-base-content/70 mb-1">Medications</div>
              <div className="rounded bg-base-200 p-3">
                {Array.isArray(medicationNames) && medicationNames.length > 0 ? (
                  <ul className="list-disc list-inside text-base-content">
                    {medicationNames.map((name, i) => (
                      <li key={i} className="text-sm">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-base-content/70">No medications listed</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-success" disabled={isSending} onClick={handleConfirm}>Confirm & Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyActionModal;
