import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import React, { useState, useEffect } from "react";
import { getInvestigationByPatientId, getInvestigationRequestByOpdPatientId } from "@/services/api/investigationRequestAPI";
import { useNavigate } from "react-router-dom";
import HmoStatusBadge from "@/components/common/HmoStatusBadge";

const TestRequestModal = ({ data, setShowModal2, onAcceptFromDetails, existingLabResultId }) => {
  const navigate = useNavigate();
  const [pendingRadiologyCount, setPendingRadiologyCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        let invs = [];
        if (data?.opdPatientId) {
          const res = await getInvestigationRequestByOpdPatientId(data.opdPatientId);
          invs = Array.isArray(res) ? res : (res?.data || []);
        } else if (data?.patientId || data?.patient?._id || data?.patient?.id) {
          const pId = data.patientId || data.patient?._id || data.patient?.id;
          const res = await getInvestigationByPatientId(pId);
          invs = Array.isArray(res) ? res : (res?.data || []);
        }
        
        const pendingRad = invs.filter(inv => {
          const isMatch = data?.dependantId 
            ? String(inv.dependantId) === String(data.dependantId)
            : !inv.dependantId;
          const invType = String(inv.type || '').toLowerCase();
          const isRad = invType === 'radiology' || invType === 'imaging';
          const isPending = inv.status !== 'completed' && inv.status !== 'cancelled';
          return isMatch && isRad && isPending;
        });
        setPendingRadiologyCount(pendingRad.length);
      } catch (e) {
        console.warn("Failed to fetch pending radiology", e);
      }
    };
    fetchPending();
  }, [data]);

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

  // Return an array of individual test objects containing name and hmo info
  const getTestList = () => {
    if (!data) return [];
    if (Array.isArray(data?.tests) && data.tests.length) {
      return data.tests.map((t) => {
        if (typeof t === "object") {
          return {
            name: t.name || t.code,
            hmoStatus: t.hmoStatus || data.hmoStatus,
            hmoApprovedBy: t.hmoApprovedBy || data.hmoApprovedBy,
            hmoApprovedAt: t.hmoApprovedAt || data.hmoApprovedAt
          };
        }
        return { 
          name: t, 
          hmoStatus: data.hmoStatus, 
          hmoApprovedBy: data.hmoApprovedBy, 
          hmoApprovedAt: data.hmoApprovedAt 
        };
      }).filter((t) => Boolean(t.name));
    }
    if (data?.test) {
      // fallback for old comma-joined string format
      return String(data.test).split(",").map((s) => ({
        name: s.trim(),
        hmoStatus: data.hmoStatus,
        hmoApprovedBy: data.hmoApprovedBy,
        hmoApprovedAt: data.hmoApprovedAt
      })).filter((t) => Boolean(t.name));
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
    <div className="fixed inset-0 z-50 p-3 bg-black/40 backdrop-blur-xs flex justify-center items-center overflow-y-auto">
      <div className="bg-base-100 text-base-content border border-base-200 shadow-2xl rounded-2xl p-6 w-full max-w-[460px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-base-200 pb-3">
          <div>
            <h5 className="text-primary text-xl font-bold">
              Test Request Details
            </h5>
            <p className="text-base-content/70 text-xs">
              Complete clinical information about the laboratory request
            </p>
          </div>
        </div>

        {pendingRadiologyCount > 0 && (
          <div className="alert alert-warning shadow-sm rounded-xl py-2 px-3 mt-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-xs text-warning-content font-medium">This patient has <strong>{pendingRadiologyCount}</strong> pending radiology (scan) request(s).</span>
          </div>
        )}

        {/* Patient Information */}
        <div className="w-full mt-4">
          <h6 className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
            Patient Information
          </h6>
          <div className="w-full bg-base-200/60 rounded-xl p-3 mt-1.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/60">Patient Name</p>
              <p className="text-base font-semibold text-base-content">
                {data?.name || "Unknown Patient"}
              </p>
            </div>
            {data?.patientType && (
              <span className="badge badge-sm badge-outline uppercase text-[10px] font-bold">
                {data.patientType}
              </span>
            )}
          </div>
        </div>

        {/* Test Information */}
        <div className="w-full mt-4">
          <h6 className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
            Test Information
          </h6>
          <div className="w-full bg-base-200/60 p-3.5 rounded-xl mt-1.5 flex flex-col gap-3.5">

            {/* Test type list + priority */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between w-full gap-4">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-base-content/60">Ordered Tests</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-base-content/60">Priority:</p>
                    <span
                      style={{
                        backgroundColor: getPriorityBgColor(data?.status),
                        color: getPriorityTextColor(data?.status),
                      }}
                      className="inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase w-fit"
                    >
                      {data?.status || "Normal"}
                    </span>
                  </div>
                </div>

                {testList.length ? (
                  <ul className="flex flex-col gap-2 w-full">
                    {testList.map((test, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between bg-base-100 border border-base-300 px-3 py-2.5 rounded-lg shadow-sm"
                      >
                        <span className="text-sm font-medium text-base-content capitalize">{test.name}</span>
                        {test.hmoStatus && (
                           <div className="shrink-0 ml-3">
                             <HmoStatusBadge
                               hmoStatus={test.hmoStatus}
                               approvedBy={test.hmoApprovedBy || data?.hmoApprovedBy}
                               approvedAt={test.hmoApprovedAt || data?.hmoApprovedAt}
                               size="xs"
                             />
                           </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base-content text-sm">N/A</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-2 border-t border-base-200">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-base-content/60">Request Date</p>
                <p className="text-sm font-semibold text-base-content">{getDisplayDate()}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-base-content/60">Request Time</p>
                <p className="text-sm font-semibold text-base-content">{getDisplayTime()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col-reverse sm:flex-row justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setShowModal2(false)}
            className="btn btn-outline sm:flex-1 w-full"
          >
            Close
          </button>

          <button
            onClick={handleAcceptClick}
            className="btn btn-primary sm:flex-[2] w-full"
          >
            Accept & Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRequestModal;