import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa6";
import { FaRegIdBadge } from "react-icons/fa6";
import apiClient from "@/services/api/apiClient";

const InjectionModals = ({ setShowModal2, patientId, patientData }) => {
  console.log("Props received:", { patientId, patientData });
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const prescriptionID = patientId;
  // Fetch injection & prescription details
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/prescription/getPrescriptionByPatientId/${prescriptionID}`
        );
        console.log("Full API Response:", res);
        console.log("res.data:", res.data);
        console.log("res.data.data:", res.data.data);
        console.log("Is it an array?", Array.isArray(res.data.data));
        const prescriptionData = res.data.data;

        console.log("API Response:", res.data);
        console.log("Prescription Data:", prescriptionData);

        setPrescription(prescriptionData);
        setSelectedStatus(res.data.data.status || "");
      } catch (err) {
        console.log("Error fetching prescription", err);
        console.log("Full error:", err.response);
      } finally {
        setLoading(false);
      }
    };

    if (prescriptionID) {
      console.log("Fetching with ID:", prescriptionID);
      fetchPrescription();
    } else {
      console.log("No prescription ID found");
      setLoading(false);
    }
  }, [prescriptionID]);

  const medication = prescription?.medications?.[0];

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
            onClick={() => setShowModal2(false)}
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
            <div className="flex items-start gap-8 flex-wrap">
              <div>
                <div className="text-[12px] text-gray-600">Drug Code</div>
                <div className="flex items-center gap-2 mt-1">
                  <FaRegIdBadge />
                  <p className="text-[14px] font-medium">
                    {medication?.drugCode}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[12px] text-gray-600">Drug Name</div>
                <p className="text-[14px] font-medium mt-1">
                  {medication?.drugName}
                </p>
              </div>

              <div>
                <div className="text-[12px] text-gray-600">Dosage</div>
                <div className="flex items-center gap-2 mt-1">
                  <FaRegIdBadge />
                  <p className="text-[14px] font-medium">
                    {medication?.dosage}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[12px] text-gray-600">Duration</div>
                <p className="text-[14px] font-medium mt-1">
                  {medication?.duration}
                </p>
              </div>

              <div>
                <div className="text-[12px] text-gray-600">Frequency</div>
                <div className="flex items-center gap-2 mt-1">
                  <FaRegIdBadge />
                  <p className="text-[14px] font-medium">
                    {medication?.frequency}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-[12px] text-gray-600">Instruction</div>
                <p className="text-[14px] font-medium mt-1">
                  {medication?.instructions}
                </p>
              </div>
            </div>
          </div>

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
                <option value="in_progress">pending</option>
                <option value="completed">completed</option>
              </select>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="w-[349px] mx-auto justify-center items-center flex gap-[16px] mt-3">
          <button
            onClick={() => setShowModal2(false)}
            className="w-[100px] h-[52px] rounded-[6px] border-[1px] border-[#AEAAAE] px-[24px] py-[16px] text-[#111215] text-[18px] font-[600] flex justify-center items-center cursor-pointer"
          >
            Close
          </button>
          <button className="bg-[#00943C] w-[207px] h-[52px] px-[24px] py-[16px] rounded-[6px] text-[#FAFAFA] text-[18px] font-[600] flex justify-center items-center cursor-pointer ">
            Accept & Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default InjectionModals;
