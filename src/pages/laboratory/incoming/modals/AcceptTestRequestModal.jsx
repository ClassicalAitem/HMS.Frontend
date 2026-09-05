import React, { useState } from "react";
import { updateInvestigation } from "@/services/api/investigationRequestAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import HmoStatusBadge from "@/components/common/HmoStatusBadge";

const AcceptTestRequestModal = ({ data, setShowModal, onAcceptSuccess }) => {
  const [completionTime, setCompletionTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!completionTime) {
      setError("Please select an estimated completion time");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update the investigation request status to "processing"
      await updateInvestigation(data.id, {
        status: "processing",
        processingNote: note,
        estimatedCompletionTime: completionTime,
      });

      // Update patient status to awaiting_lab if not already
      if (data?.userId) {
        try {
          await updatePatientStatus(data.userId, "awaiting_lab");
        } catch (statusErr) {
          console.error("Error updating patient status:", statusErr);
        }
      }

      setSuccess(true);
      
      if (onAcceptSuccess) {
        setTimeout(() => {
          onAcceptSuccess();
          setShowModal(false);
        }, 1200);
      } else {
        setTimeout(() => {
          setShowModal(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Error accepting test request:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to accept test request. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/40 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
      <div className="bg-base-100 text-base-content border border-base-200 shadow-2xl rounded-2xl p-6 max-w-[520px] w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-base-200 pb-3">
          <div>
            <h3 className="text-primary text-xl font-bold">Accept Test Request</h3>
            <p className="mt-0.5 text-base-content/70 text-xs">
              Confirm acceptance and provide initial details for lab processing
            </p>
          </div>
          {data?.hmoStatus && (
            <HmoStatusBadge
              hmoStatus={data.hmoStatus}
              approvedBy={data.hmoApprovedBy}
              approvedAt={data.hmoApprovedAt}
              size="sm"
            />
          )}
        </div>

        {success && (
          <div className="mt-4 p-3 bg-success/15 border border-success/30 text-success rounded-xl text-sm font-medium">
            Test request accepted successfully!
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-error/15 border border-error/30 text-error rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-base-content/70 mb-1">Patient Name</label>
            <input
              type="text"
              value={data?.name || ""}
              disabled
              className="input input-bordered w-full bg-base-200/50 text-base-content font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-base-content/70 mb-1">Test Type / Requested Tests</label>
            <input
              type="text"
              value={data?.test || ""}
              disabled
              className="input input-bordered w-full bg-base-200/50 text-base-content font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-base-content/70 mb-1">
              Estimated Completion Time <span className="text-error">*</span>
            </label>
            <select
              id="completionTime"
              value={completionTime}
              onChange={(e) => setCompletionTime(e.target.value)}
              disabled={loading}
              className="select select-bordered w-full bg-base-100 text-base-content"
            >
              <option value="">-- Select an estimated time --</option>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="4 hours">4 hours</option>
              <option value="8 hours">8 hours</option>
              <option value="24 hours">24 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-base-content/70 mb-1">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any relevant notes or specimen remarks..."
              disabled={loading}
              rows="3"
              className="textarea textarea-bordered w-full bg-base-100 text-base-content"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-base-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={loading}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs" />
                  Processing...
                </span>
              ) : (
                "Confirm & Process"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptTestRequestModal;
