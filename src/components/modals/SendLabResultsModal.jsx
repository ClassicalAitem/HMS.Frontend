import React, { useState } from "react";
import { updateInvestigationRequest } from "@/services/api/investigationRequestAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import ConfirmationModal from "./ConfirmationModal";

import { mergePatientStatus } from '@/utils/statusUtils';

const SendLabResultsModal = ({ isOpen, onClose, labResultId, investigationRequestId, patientId, patientName, currentStatus = [], onSuccess }) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendToDoctor = async () => {
    try {
      if (!investigationRequestId) {
        setError("Cannot send results: investigation request not provided.");
        return;
      }

      setSending(true);
      setError(null);

      await updateInvestigationRequest(investigationRequestId, {
        status: "completed",
        labResultId: labResultId,
      });

     try {
        if (patientId) {
          // Merge current status with lab completed (removes lab awaiting status, adds completed)
          const mergedStatus = mergePatientStatus(currentStatus, 'lab',{ status: PATIENT_STATUS.LAB_COMPLETED });
          await updatePatientStatus(patientId, mergedStatus);
        } else {
          console.warn("SendLabResultsModal: patientId not provided, skipping patient status update");
        }
      } catch (err) {
        console.warn("Failed to update patient status:", err);
      }

      setShowConfirm(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error sending lab results:", err);
      setError(
        err.response?.data?.message ||
          "Failed to send lab results to doctor. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-[#00943C] mb-4">Send Lab Results to Doctor</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {!investigationRequestId && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm border border-yellow-300">
              Investigation request ID is missing; results cannot be forwarded to the doctor.
            </div>
          )}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Patient</p>
            <p className="font-semibold text-gray-800">{patientName}</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600">
              ✓ Lab results have been completed and are ready to be sent to the requesting doctor.
            </p>
          </div>

          <p className="text-sm text-gray-700">
            Once sent, the doctor will receive a notification about the completed lab results and the investigation status will be updated to <strong>Processing</strong>.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Not Now
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={sending || !investigationRequestId}
            className={`flex-1 px-4 py-2 font-semibold rounded-lg ${investigationRequestId ? "bg-[#00943C] text-white hover:bg-[#007a31]" : "bg-gray-200 text-gray-500 cursor-not-allowed"} disabled:opacity-50`}
          >
            {sending ? "Sending..." : "Send Now"}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Sending Lab Results"
        message="Are you sure you want to send these lab results to the doctor? This action will update the investigation status to 'Processing'."
        onConfirm={handleSendToDoctor}
        onClose={() => setShowConfirm(false)}
        confirmText="Send Results"
        cancelText="Cancel"
      />
    </>
  );
};

export default SendLabResultsModal;
