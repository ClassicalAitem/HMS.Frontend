import React, { useState, useEffect, useCallback } from "react";
import { FaUser } from "react-icons/fa6";
import { FaRegIdBadge } from "react-icons/fa6";
import apiClient from "@/services/api/apiClient";
import toast from "react-hot-toast";
import { updatePrescription } from "@/services/api/prescriptionsAPI";

// ─── Helper ───────────────────────────────────────────────────────────────────
const checkAllCompleted = (medications = []) =>
  medications
    .filter((med) => med.medicationType === "injection")
    .every((med) => med.injectionStatus === "completed");

// ─── Sub-components ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm bg-opacity-40 flex justify-center items-center">
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <p className="text-center">Loading prescription.......</p>
    </div>
  </div>
);

const EmptyScreen = ({ onClose }) => (
  <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-center">
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <p className="text-center mb-4">No data found</p>
      <button onClick={onClose} className="btn btn-primary w-full">
        Close
      </button>
    </div>
  </div>
);

const MedicationRow = ({ med, index, onDosesChange, onStatusChange }) => (
  <div className="w-full space-y-4">
    <div className="flex items-start gap-8 flex-wrap">
      <div>
        <div className="text-[12px] text-gray-600">Drug Code</div>
        <div className="flex items-center gap-2 mt-1">
          <FaRegIdBadge />
          <p className="text-[14px] font-medium">{med.drugCode}</p>
        </div>
      </div>

      <div>
        <div className="text-[12px] text-gray-600">Drug Name</div>
        <p className="text-[14px] font-medium mt-1">{med.drugName}</p>
      </div>

      <div>
        <div className="text-[12px] text-gray-600">Dosage</div>
        <div className="flex items-center gap-2 mt-1">
          <FaRegIdBadge />
          <p className="text-[14px] font-medium">{med.dosage}</p>
        </div>
      </div>

      <div>
        <div className="text-[12px] text-gray-600">Duration</div>
        <p className="text-[14px] font-medium mt-1">{med.duration}</p>
      </div>

      <div>
        <div className="text-[12px] text-gray-600">Frequency</div>
        <div className="flex items-center gap-2 mt-1">
          <FaRegIdBadge />
          <p className="text-[14px] font-medium">{med.frequency}</p>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-base-content/70">
          Doses Given
        </label>
        <input
          type="number"
          value={med.dosesGiven}
          min={0}
          disabled={med.injectionStatus === "completed"}
          onChange={(e) => onDosesChange(index, Number(e.target.value))}
          className="input input-bordered input-sm w-20"
        />
      </div>

      <div>
        <div className="text-[12px] text-gray-600">Instruction</div>
        <p className="text-[14px] font-medium mt-1">{med.instructions}</p>
      </div>
    </div>

    <div className="bg-[#F0EEF3] p-4 w-full rounded">
      <label className="flex items-center gap-2 mb-3">
        <FaUser color="#00943C" />
        <h5 className="font-[500]">Injection Status:</h5>
      </label>
      <select
        value={med.injectionStatus || ""}
        onChange={(e) => onStatusChange(index, e.target.value)}
        className="select select-bordered select-sm"
      >
        <option value="">Select status</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="skipped">Skipped</option>
      </select>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const InjectionModals = ({ isOpen, setIsRecordInjection, patientId }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isFullyAdministered, setIsFullyAdministered] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const fetchPrescription = async () => {
      try {
        setLoading(true);
        console.log("Fetching prescription for patientId:", patientId);
        const res = await apiClient.get(
          `/prescription/getPrescriptionByPatientId/${patientId}`
        );


        if (cancelled) return;

        const data = res.data.data;
       let prescriptionData;

        if (Array.isArray(data)) {
          prescriptionData = data.find(p => {
            const injectionMeds = (p.medications || []).filter(
              m => m.medicationType === "injection"
            );

            if (!injectionMeds.length) return false;


            const hasPendingInjection = injectionMeds.some(
              m => m.injectionStatus !== "completed"
            );

            return hasPendingInjection;
          }) || null;
        } else {
          prescriptionData = data;
        }

                // console.log(data);
                setPrescription(prescriptionData);
                setSelectedStatus(prescriptionData?.status || "");
        setIsFullyAdministered(
          checkAllCompleted(prescriptionData?.medications || [])
        );

      } catch (err) {
        if (!cancelled) console.error("Error fetching prescription:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrescription();
    return () => { cancelled = true; };
  }, [isOpen, patientId]);

  // console.log(prescription);

  // ─── Medication field handlers ───────────────────────────────────────────────
  const updateMedicationField = useCallback((index, field, value) => {
    setPrescription((prev) => {
      const updated = [...prev.medications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medications: updated };
    });
  }, []);

  const handleDosesChange = useCallback((index, value) => {
    updateMedicationField(index, "dosesGiven", value);
  }, [updateMedicationField]);

  const handleStatusChange = useCallback((index, value) => {
    updateMedicationField(index, "injectionStatus", value);
  }, [updateMedicationField]);

  // ─── Update ──────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);

      const payload = {
        medications: prescription.medications.map((med) => ({
          ...med,
          dosesGiven: med.dosesGiven,
          injectionStatus: med.injectionStatus || "pending",
        })),
      };

      const res = await toast.promise(
        updatePrescription(prescription._id, payload),
        {
          loading: "Updating prescription...",
          success: "Prescription updated successfully",
          error: "Failed to update prescription",
        }
      );

      const updated = res?.data?.data ?? prescription;
      setPrescription(updated);
      setIsFullyAdministered(checkAllCompleted(updated.medications));
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!prescription) return <EmptyScreen onClose={() => setIsRecordInjection(false)} />;
  if (!isOpen) return null;

  const injectionMeds = prescription.medications
  ?.map((med, originalIndex) => ({ ...med, originalIndex }))
  .filter((med) => med.medicationType === "injection");

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm bg-opacity-40 flex justify-center items-start overflow-y-auto">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[600px] w-full mt-10 rounded-lg">
        <div className="w-full">
          {/* Header */}
          <h5 className="text-[#00943C] text-[24px] font-[600]">
            Injection Details
          </h5>

          {/* Patient Info */}
          <div className="bg-[#F0EEF3] p-4 w-full rounded mt-10">
            <div className="flex items-center gap-2 mb-3">
              <FaUser color="#00943C" />
              <h5 className="font-[500]">Patient Information</h5>
            </div>
            <div className="flex justify-between flex-wrap gap-4">
              <div>
                <div className="text-[12px] text-gray-600">Patient ID</div>
                <div className="flex items-center gap-2 mt-1">
                  <FaRegIdBadge />
                  <p className="text-[14px] font-medium">{prescription?.patientId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="bg-[#F0EEF3] p-4 w-full rounded">
            <div className="flex items-center gap-2 mb-3">
              <FaRegIdBadge color="#00943C" />
              <h5 className="font-[500]">Medications</h5>
            </div>
            <h5 className="font-[500] mt-3 mb-2">Prescription Details</h5>
            {injectionMeds?.map((med, index) => (
              <MedicationRow
                key={index}
                med={med}
                index={med.originalIndex}
                onDosesChange={handleDosesChange}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="w-[349px] mx-auto justify-center items-center flex gap-[16px] mt-3">
          <button
            onClick={() => setIsRecordInjection(false)}
            className="w-[100px] h-[52px] rounded-[6px] border-[1px] border-[#AEAAAE] px-[24px] py-[16px] text-[#111215] text-[18px] font-[600] flex justify-center items-center cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleUpdate}
            disabled={updateLoading || !selectedStatus || isFullyAdministered}
            className="bg-[#00943C] w-[207px] h-[52px] px-[24px] py-[16px] rounded-[6px] text-[#FAFAFA] text-[18px] font-[600] flex justify-center items-center cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {updateLoading ? "Processing..." : "Accept & Process"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InjectionModals;