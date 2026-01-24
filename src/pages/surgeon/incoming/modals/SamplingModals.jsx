import React from "react";
import { FaUser } from "react-icons/fa6";
import { FaRegIdBadge } from "react-icons/fa6";
import apiClient from "@/services/api/apiClient";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const SamplingModals = ({ setIsRecordSampling, patientId, patientData }) => {
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Fetch investigation details
  useEffect(() => {
    const fetchInvestigation = async () => {
      try {
        const res = await apiClient.get(
          `/investigation/getInvestigationRequestByPatientId/${patientId}`
        );
        setInvestigation(res.data.data);
        setSelectedStatus(res.data.data.status || "");
      } catch (err) {
        console.log("Error fetching investigation", err);
      } finally {
        setLoading(false);
      }
    };


    fetchInvestigation();

  }, [patientId]);

  const handleStatusUpdate = async () => {
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
      console.error("Error updating status", err);
      toast.error(err?.response?.data?.message || "Failed to update record");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-center">
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <p className="text-center">Loading investigation details......</p>
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-center">
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <p className="text-center mb-4">No investigation found</p>
          <button
            onClick={() => setIsRecordSampling(false)}
            className="btn btn-primary w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const test = investigation.tests[0];
  const patientName =
    patientData?.fullName ||
    `${patientData?.firstName || ""} ${patientData?.lastName || ""}`.trim() ||
    "Unknown Patient";

  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-start overflow-y-auto">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[600px] w-full mt-10 rounded-lg">

        <div className="w-full">
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
                    <p className="text-[14px] font-medium">
                      {investigation.patientId}
                    </p>
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
                  onClick={(e) => e.stopPropagation()}
                  className="select select-bordered w-full"
                >
                  <option value="">Choose a status</option>
                  <option value="in_progress">In_progress</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="requested">requested</option>
                </select>
              </div>
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
          <button
            onClick={handleStatusUpdate}
            disabled={updateLoading || !selectedStatus}
            className="bg-[#00943C] px-6 py-3 rounded-md text-white font-semibold hover:bg-[#007a32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateLoading ? "Processing..." : "Accept & Process"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SamplingModals;
