import React, { useEffect, useState, useCallback } from "react";
import { FaUser } from "react-icons/fa6";
import { FaRegIdBadge } from "react-icons/fa6";
import apiClient from "@/services/api/apiClient";
import toast from "react-hot-toast";

// ─── Sub-components ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-center">
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <p className="text-center">Loading investigation details......</p>
    </div>
  </div>
);

const EmptyScreen = ({ onClose }) => (
  <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-center">
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <p className="text-center mb-4">No investigation found</p>
      <button onClick={onClose} className="btn btn-primary w-full">
        Close
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const SamplingModals = ({ setIsRecordSampling, patientId, patientData }) => {
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchInvestigation = async () => {
      try {
        const res = await apiClient.get(
          `/investigation/getInvestigationRequestByPatientId/${patientId}`
        );

        if (cancelled) return;

        const data = res.data.data;

        // Handle array response
        const investigationData = Array.isArray(data) ? data[0] : data;

        setInvestigation(investigationData);
        setSelectedStatus(investigationData?.status || "");
      } catch (err) {
        if (!cancelled) console.error("Error fetching investigation:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInvestigation();
    return () => { cancelled = true; };
  }, [patientId]);

  console.log('investigation', investigation);

  // ─── Update ──────────────────────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async () => {
    try {
      setUpdateLoading(true);
      const res = await apiClient.patch(`/investigation/${investigation._id}`, {
        status: selectedStatus,
      });

      if (res.status === 200) {
        toast.success("Record Updated Successfully");
        setIsRecordSampling(false);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err?.response?.data?.message || "Failed to update record");
    } finally {
      setUpdateLoading(false);
    }
  }, [investigation, selectedStatus, setIsRecordSampling]);

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!investigation) return <EmptyScreen onClose={() => setIsRecordSampling(false)} />;

  const test = investigation.tests?.[0];
  const patientName =
    patientData?.fullName ||
    `${patientData?.firstName || ""} ${patientData?.lastName || ""}`.trim() ||
    "Unknown Patient";

  const isTerminalStatus = ["completed", "cancelled"].includes(selectedStatus);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-start overflow-y-auto">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[600px] w-full mt-10 rounded-lg">
        <div className="w-full flex flex-col gap-3">

          <h5 className="text-[#00943C] text-[24px] font-[600]">
            Sampling Details
          </h5>

          {/* Patient Information */}
          <div className="bg-[#F0EEF3] p-4 w-full rounded">
            <div className="flex items-center gap-2 mb-3">
              <FaUser color="#00943C" />
              <h5 className="font-[500]">Patient Information</h5>
            </div>
            <div className="flex justify-between flex-wrap gap-4">
              <div>
                <div className="text-[12px] text-gray-600">Patient ID</div>
                <div className="flex items-center gap-2 mt-1">
                  <FaRegIdBadge />
                  <p className="text-[14px] font-medium">{investigation.patientId}</p>
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-600">Patient Name</div>
                <p className="text-[14px] font-medium mt-1">{patientName}</p>
              </div>
            </div>
          </div>

          {/* Sampling Type */}
          <div className="bg-[#F0EEF3] p-4 w-full rounded">
            <div className="flex items-center gap-2 mb-3">
              <FaRegIdBadge color="#00943C" />
              <h5 className="font-[500]">Sampling Type:</h5>
              <h5 className="font-[500] uppercase">{investigation.type}</h5>
            </div>

            <h5 className="font-[500] mt-3 mb-2">Test Details</h5>
            {test ? (
              <div className="flex items-start gap-8 flex-wrap">
                <div>
                  <div className="text-[12px] text-gray-600">Code</div>
                  <div className="flex items-center gap-2 mt-1">
                    <FaRegIdBadge />
                    <p className="text-[14px] font-medium">{test.code}</p>
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-gray-600">Name</div>
                  <p className="text-[14px] font-medium mt-1">{test.name}</p>
                </div>
                {test.notes && (
                  <div>
                    <div className="text-[12px] text-gray-600">Note</div>
                    <p className="text-[13px] mt-1">{test.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No test details available</p>
            )}

            <p className="font-[500] mt-3">
              Priority:{" "}
              <span className="text-red-500 uppercase font-semibold">
                {investigation.priority}
              </span>
            </p>
          </div>

          {/* Sampling Status */}
          <div className="bg-[#F0EEF3] p-4 w-full rounded">
            <div className="flex items-center gap-2 mb-3">
              <FaUser color="#00943C" />
              <h5 className="font-[500]">Sampling Status</h5>
            </div>

            <div className="w-full">
              <label className="block mb-2 text-sm text-gray-600">
                Test Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={isTerminalStatus} // ← disable when completed or cancelled
                className="select select-bordered w-full"
              >
                <option value="">Choose a status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="requested">Requested</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex gap-4 mt-6 justify-end">
          <button
            onClick={() => setIsRecordSampling(false)}
            className="px-6 py-3 rounded-md border border-gray-400 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {!isTerminalStatus && (
            <button
              onClick={handleStatusUpdate}
              disabled={updateLoading || !selectedStatus}
              className="bg-[#00943C] px-6 py-3 rounded-md text-white font-semibold hover:bg-[#007a32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? "Processing..." : "Accept & Process"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SamplingModals;