import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import React from "react";
import { useNavigate } from "react-router-dom";

const TestRequestModal = ({ data, setShowModal2, onAcceptFromDetails, existingLabResultId }) => {
  const navigate = useNavigate();

  const getPriorityBgColor = (status) => {
    if (status === "Urgent") return "#FFE2E2";
    if (status === "Normal") return "#DBEAFE";
    return "#F2F2F3";
  };

  const getPriorityTextColor = (status) => {
    if (status === "Urgent") return "#E7000B";
    if (status === "Normal") return "#4680FC";
    return "#111215";
  };

  // Return an array of individual test names instead of one joined string,
  // so each test can render as its own chip and won't collide with layout.
  const getTestList = () => {
    if (!data) return [];
    if (Array.isArray(data?.tests) && data.tests.length) {
      return data.tests.map((t) => t.name || t.code || t).filter(Boolean);
    }
    if (data?.test) {
      // fallback for old comma-joined string format
      return String(data.test).split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const testList = getTestList();

  const getDisplayDate = () => {
    if (data?.createdAt) return formatNigeriaDate(data.createdAt);
    if (data?.date) return data.date;
    return "N/A";
  };

  const getDisplayTime = () => {
    if (data?.createdAt) return formatNigeriaTime(data.createdAt);
    if (data?.time) return data.time;
    return "N/A";
  };

  const handleAcceptClick = () => {
    setShowModal2(false);
    const investigationId = data?.id || data?._id;
    const opdPatientId = data?.opdPatientId;

    if (investigationId) {
      navigate(`/dashboard/laboratory/results/add/${investigationId}`);
    } else if (opdPatientId) {
      navigate(`/dashboard/laboratory/results/add-opd?opdPatientId=${opdPatientId}&patientName=${encodeURIComponent(data?.name || '')}`);
    } else if (onAcceptFromDetails) {
      onAcceptFromDetails(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm flex justify-center items-center overflow-y-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-[440px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h5 className="text-[#00943C] text-2xl font-normal">
            Test Request Details
          </h5>
          <p className="text-[#605D66] text-sm font-normal">
            Complete information about the test request
          </p>
        </div>

        {/* Patient Information */}
        <div className="w-full mt-5">
          <h6 className="text-lg text-[#111215] font-normal">
            Patient Information
          </h6>
          <div className="w-full bg-[#f2f2f3] rounded-md p-3 mt-3">
            <p className="text-[#aeaaae] text-xs">Patient Name</p>
            <p className="text-base text-[#111215] font-normal">
              {data?.name || "Unknown Patient"}
            </p>
          </div>
        </div>

        {/* Test Information */}
        <div className="w-full mt-4">
          <h6 className="text-lg text-[#111215] font-normal">
            Test Information
          </h6>
          <div className="w-full bg-[#f2f2f3] p-3 rounded-md mt-3 flex flex-col gap-4">

            {/* Test type chips + priority — stacked, not squeezed side by side */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2 min-w-0">
                <p className="text-[#AEAAAE] text-xs font-normal">Test Type</p>
                {testList.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {testList.map((name, i) => (
                      <span
                        key={i}
                        className="bg-white border border-[#e0e0e0] text-[#111215] text-xs font-medium px-2 py-1 rounded-md"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#111215] text-sm">N/A</p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <p className="text-[#111215] text-sm">Priority Level</p>
                <span
                  style={{
                    backgroundColor: getPriorityBgColor(data?.status),
                    color: getPriorityTextColor(data?.status),
                  }}
                  className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-normal w-fit"
                >
                  {data?.status || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-[#AEAAAE] text-xs font-normal">Request Date</p>
                <p className="text-[#111215] text-base font-normal">{getDisplayDate()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[#AEAAAE] text-xs font-normal">Request Time</p>
                <p className="text-[#111215] text-base font-normal">{getDisplayTime()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col-reverse sm:flex-row justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setShowModal2(false)}
            className="w-full sm:w-auto sm:flex-1 h-[52px] rounded-md border border-[#AEAAAE] px-6 py-4 text-[#111215] text-base font-semibold flex justify-center items-center cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleAcceptClick}
            className="w-full sm:w-auto sm:flex-[2] bg-[#00943C] h-[52px] px-6 py-4 rounded-md text-[#FAFAFA] text-base font-semibold flex justify-center items-center cursor-pointer"
          >
            Accept & Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRequestModal;