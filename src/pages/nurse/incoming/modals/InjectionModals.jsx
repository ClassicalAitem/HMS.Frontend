import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa6";
import { FaRegIdBadge } from "react-icons/fa6";
import apiClient from "@/services/api/apiClient";
import toast from "react-hot-toast";
import { updatePrescription } from "@/services/api/prescriptionsAPI";

const InjectionModals = ({ setIsRecordInjection, patientId, patientData }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isFullyAdministered, setIsFullyAdministered] = useState(false);

  const prescriptionID = patientId;
  // Fetch injection & prescription details
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/prescription/getPrescriptionByPatientId/${prescriptionID}`
        );
        console.log("res.data.data:", res.data.data);
        const prescriptionData = res.data.data;

        setPrescription(prescriptionData);
        setSelectedStatus(res.data.data.status || "");
        
        // Check if all injection medications are completed
        const allCompleted = prescriptionData.medications
          ?.filter(med => med.medicationType === "injection")
          .every(med => med.injectionStatus === "completed");
        setIsFullyAdministered(allCompleted);

      } catch (err) {
        console.log("Error fetching prescription", err);
        console.log("Full error:", err.response);
      } finally {
        setLoading(false);
      }
    };


    fetchPrescription();

  }, [prescriptionID]);

  const handleUpdate = async () => {
  try {
    setUpdateLoading(true);

    // Build payload with updated medications
    const payload = {
      medications: prescription.medications.map((med) => ({
        ...med,
        dosesGiven: med.dosesGiven,
        injectionStatus: med.injectionStatus || "pending",
      })),
    };

    console.log("Payload for update:", payload);
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
    
    // Update the fully administered state based on the new data
    const allCompleted = updated.medications
      ?.filter(med => med.medicationType === "injection")
      .every(med => med.injectionStatus === "completed");
    setIsFullyAdministered(allCompleted);

  } catch (err) {
    console.error("Update failed:", err);
  } finally {
    setUpdateLoading(false);
  }
};

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm bg-opacity-40 flex justify-center items-center">
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <p className="text-center">Loading prescription.......</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-center">
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <p className="text-center mb-4">No data found</p>
          <button
            onClick={() => setIsRecordInjection(false)}
            className="btn btn-primary w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm bg-opacity-40 flex justify-center items-start overflow-y-auto">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[600px] w-full mt-10 rounded-lg">
        <div className="w-full">
          <div className="w-full flex flex-col gap-3">
            <h5 className="text-[#00943C] text-[24px] font-[600]">
              Injection Details
            </h5>
          </div>
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
                  <p className="text-[14px] font-medium">
                    {prescription?.patientId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F0EEF3] p-4 w-full rounded">
            <div className="flex items-center gap-2 mb-3">
              <FaRegIdBadge color="#00943C" />
              <h5 className="font-[500]">Medications</h5>
            </div>

            <h5 className="font-[500] mt-3 mb-2">Prescription Details</h5>
            {prescription?.medications
              ?.filter((med) => med.medicationType === "injection")
              .map((med, index) => (
                <div key={index} className="w-full space-y-4">
                  {/* Medication details row */}
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
                        onChange={(e) => {
                          const updated = [...prescription.medications];
                          updated[index].dosesGiven = Number(e.target.value);
                          setPrescription({ ...prescription, medications: updated });
                        }}
                        className="input input-bordered input-sm w-20"
                      />
                    </div>

                    <div>
                      <div className="text-[12px] text-gray-600">Instruction</div>
                      <p className="text-[14px] font-medium mt-1">{med.instructions}</p>
                    </div>
                  </div>

                  {/* Injection status block */}
                  <div className="bg-[#F0EEF3] p-4 w-full rounded">
                    <label className="flex items-center gap-2 mb-3">
                      <FaUser color="#00943C" />
                      <h5 className="font-[500]">Injection Status:</h5>
                    </label>

                    <select
                      value={med.injectionStatus || ""}
                      onChange={(e) => {
                        const updated = [...prescription.medications];
                        updated[index].injectionStatus = e.target.value;
                        setPrescription({ ...prescription, medications: updated });
                      }}
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
          className="bg-[#00943C] w-[207px] h-[52px] px-[24px] py-[16px] rounded-[6px] text-[#FAFAFA] text-[18px] font-[600] flex justify-center items-center cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
            {updateLoading ? "Processing..." : "Accept & Process"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InjectionModals;
