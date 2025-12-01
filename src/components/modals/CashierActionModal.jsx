import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';

const CashierActionModal = ({
  isOpen,
  onClose,
  patientId,
  defaultStatus = 'awaiting_cashier',
  onUpdated,
  mode = 'confirm',
  totalAmount,
  itemsCount,
  patientLabel,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(defaultStatus);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSending(true);
      const statusToSend = selectedStatus || defaultStatus;
      const promise = updatePatientStatus(patientId, statusToSend);
      toast.promise(promise, {
        loading: 'Sending to cashier...',
        success: 'Patient sent to cashier successfully',
        error: (err) => err?.response?.data?.message || 'Failed to send to cashier',
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
            <h2 className="text-xl font-bold text-base-content">{mode === 'confirm' ? 'Confirm Send to Cashier' : 'Send to Cashier'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          {mode === 'confirm' ? (
            <>
              <p className="mb-4 text-sm text-base-content/70">
                Are you sure you want to send this billing information to the cashier? This action will notify the cashier to process payment{patientLabel ? ` for ${patientLabel}` : ''}.
              </p>
              {(totalAmount !== undefined || itemsCount !== undefined) && (
                <div className="rounded-lg border border-base-300 p-4 bg-base-200/30">
                  {totalAmount !== undefined && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-base-content/70">Total Amount</span>
                      <span className="font-medium text-base-content">{typeof totalAmount === 'number' ? `₦${totalAmount.toLocaleString()}` : String(totalAmount)}</span>
                    </div>
                  )}
                  {itemsCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/70">Number of Items</span>
                      <span className="font-medium text-base-content">{itemsCount}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-base-content/70">Select the status for this patient:</p>
              <div className="space-y-2">
                {['awaiting_cashier','awaiting_payment'].map(status => (
                  <label key={status} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="cashierStatus"
                      className="radio radio-primary"
                      checked={selectedStatus === status}
                      onChange={() => setSelectedStatus(status)}
                    />
                    <span className="capitalize">{status.replace('awaiting_', 'Awaiting ')}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-success" disabled={isSending} onClick={handleConfirm}>{mode === 'confirm' ? 'Confirm & Send' : 'Confirm'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierActionModal;