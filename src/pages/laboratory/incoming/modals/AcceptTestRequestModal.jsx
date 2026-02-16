import React, { useState } from "react";
import { updateInvestigationRequest } from "@/services/api/investigationRequestAPI";

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

      console.log("Submitting investigation update with:", {
        id: data.id,
        status: "processing",
        processingNote: note,
        estimatedCompletionTime: completionTime,
      });

      // Update the investigation request status to "processing"
      const response = await updateInvestigationRequest(data.id, {
        status: "processing",
        processingNote: note,
        estimatedCompletionTime: completionTime,
      });

      console.log("Investigation updated successfully:", response);
      setSuccess(true);
      
      // Call the callback to refresh the list if provided
      if (onAcceptSuccess) {
        setTimeout(() => {
          onAcceptSuccess();
          setShowModal(false);
        }, 1500);
      } else {
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Error accepting test request:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to accept test request. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-3  bg-black/10 backdrop-blur-sm bg-opacity-40 flex items-center justify-center">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[588px] h-[686px] w-full overflow-y-auto">
        <p className="text-[#00943C] text-[24px]">Accept Test Request</p>
        <p className="mt-5 text-[#605D66] text-[12px]">
          Confirm acceptance and provide initial details for processing
        </p>

        {success && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
            Test request accepted successfully!
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mt-5">
            <label className="block font-semibold">Patient Name</label>
            <input
              type="text"
              value={data?.name || ""}
              disabled
              className="input w-full py-7 mt-3 bg-gray-100"
            />
          </div>
          <div className="mt-5">
            <label className="block font-semibold">Test Type</label>
            <input
              type="text"
              value={data?.test || ""}
              disabled
              className="input py-7 w-full mt-3 bg-gray-100"
            />
          </div>

          <div className="mt-5">
            <label className="block font-semibold">
              Estimated Completion Time
            </label>
            <select
              id="completionTime"
              value={completionTime}
              onChange={(e) => setCompletionTime(e.target.value)}
              disabled={loading}
              className="h-[56px] border border-[#AEAAAE] rounded-[6px] bg-[#F7F7F7] px-3 w-full appearance-auto text-black"
            >
              <option value="">-- Select an option --</option>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="4 hours">4 hours</option>
              <option value="8 hours">8 hours</option>
              <option value="24 hours">24 hours</option>
            </select>
          </div>

          <div className="mt-5">
            <label className="block font-semibold">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any relevant note about this test"
              disabled={loading}
              rows="3"
              className="w-full p-3 border border-[#AEAAAE] rounded-[6px] mt-3"
            />
          </div>
        </form>

        <div className="flex gap-5 mt-10 ">
          <button
            onClick={() => setShowModal(false)}
            disabled={loading}
            className="w-[254px] h-[54px] border rounded-[6px] cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-[254px] h-[52px] text-[#FFFFFF] bg-[#00943C] rounded-[6px] cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm & Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptTestRequestModal;
