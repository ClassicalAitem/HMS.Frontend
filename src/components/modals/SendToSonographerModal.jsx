import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaTimes, FaCheck } from "react-icons/fa";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { GiUltrasound } from "react-icons/gi";

const SendToSonographerModal = ({ isOpen, onClose, patientId, patientName, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!patientId) {
      toast.error("Patient information is missing");
      return;
    }

    setIsLoading(true);
    try {
      // Update patient status to awaiting_radiology/sonography
      await updatePatientStatus(patientId, "awaiting_radiology");
      toast.success(`${patientName} has been sent to Sonographer for ultrasound scanning`);
      
      setReason("");
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error sending to sonographer:", error);
      toast.error(error?.response?.data?.message || "Failed to send patient to sonographer");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-base-100 rounded-xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-info/10 p-2 rounded-full text-info">
                <GiUltrasound className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-base-content">Send to Sonographer</h2>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Patient Info */}
          <div className="mb-5 p-4 bg-base-200/50 rounded-lg">
            <p className="text-sm text-base-content/70">Patient</p>
            <p className="text-lg font-semibold text-base-content">{patientName}</p>
          </div>

          {/* Message */}
          <p className="text-sm text-base-content/70 mb-4">
            This patient will be routed to the Sonographer for ultrasound scanning. 
            The sonographer will upload scan files and send them for lab review.
          </p>

          {/* Optional Reason/Notes */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text text-sm">Scan Reason (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-sm h-20"
              placeholder="e.g., Abdominal ultrasound, Pregnancy scan, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="btn btn-outline flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={`btn btn-primary flex-1 gap-2 ${isLoading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              <FaCheck className="w-4 h-4" />
              Send to Sonographer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendToSonographerModal;
