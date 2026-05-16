import React, { useState } from 'react';
import { FaUserMd } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';

const SendToNurseModal = ({
  isOpen,
  onClose,
  patientName,
  patientId,
  onSentSuccessfully
}) => {
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    try {
      setIsSending(true);
      const statusPromise = updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_NURSE });
      
      toast.promise(statusPromise, {
        loading: 'Sending patient to nurse...',
        success: 'Patient sent to nurse successfully!',
        error: (err) => err?.response?.data?.message || 'Failed to send patient to nurse'
      });
      
      await statusPromise;
      
      if (onSentSuccessfully) {
        onSentSuccessfully();
      }
      
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send to nurse');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-info/10 p-2 rounded-full text-info">
            <FaUserMd className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-base-content">Send to Nurse</h2>
        </div>

        {/* Content */}
        <p className="text-sm text-base-content/70 mb-6">
          Send <span className="font-semibold">{patientName}</span> to nurse for more assessment?
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className="btn btn-info flex-1"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendToNurseModal;