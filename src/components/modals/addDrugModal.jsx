import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa6";
import { FaRegIdBadge } from "react-icons/fa6";
import apiClient from "@/services/api/apiClient";
import toast from "react-hot-toast";
import { updatePrescription } from "@/services/api/prescriptionsAPI";
import { createDispense } from "@/services/api/dispensesAPI";
import { getInventories } from "@/services/api/inventoryAPI";
import { batch } from "react-redux";
//fixed Error file name is: AddDrugModal.jsx

const AddDrugModal = ({  setIsSelectModalOpen, prescriptionPatient }) => {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isFullyAdministered, setIsFullyAdministered] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [meds, setMeds] = useState([]);


  const [newMed, setNewMed] = useState({ name: "", quantity: "", batchNumber: "", expiry: "" });

  console.log("Prescription prop:", prescriptionPatient);

  const prescriptionID = prescriptionPatient?._id;

  useEffect(() => {
    if (!prescriptionID) return;

    const fetchInventories = async () => {
      try {
        const res = await getInventories();
        console.log("Fetched inventories:", res.data);
        const list = Array.isArray(res?.data) ? res.data : (res?.data ?? [])
        setInventoryItems(list)
      } catch (error) {
        console.error("Error fetching inventories:", error);
      }
    }
    fetchInventories();
  })

  // Fetch injection & prescription details
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);

        setPrescription(prescriptionPatient);
        setSelectedStatus(res.data.data.status || "");

        // Check if all injection medications are completed
        const allCompleted = prescriptionData.medications
          ?.filter(med => med.medicationType === "injection")
          .every(prescriptionData.status === "completed");
        setIsFullyAdministered(allCompleted);

        console.log({ allCompleted });

      } catch (err) {
        console.log("Error fetching prescription", err);
        console.log("Full error:", err.response);
      } finally {
        setLoading(false);
      }
    };


    fetchPrescription();

  }, [prescriptionID]);

   const addMedication = () => {
    if (!newMed.name) return;
    setMeds((list) => ([...list, { id: Date.now(), ...newMed }]));
    setNewMed({ inventoryId: "", name: "", quantity: "", batchNumber: "", expiry: "", });
  };
  const removeMedication = (id) => setMeds((list) => list.filter((m) => m.id !== id));

  const handleUpdate = async () => {
  try {
    setUpdateLoading(true);

    // Build payload with updated medications
    const payload = {
      items: meds.map((m) => ({
        inventoryId: m.inventoryId,
        drugName: m.name,
        quantity: m.quantity,
        batchNumber: m.batchNumber,
        expiry: m.expiry,
      })),
      status: "dispensed",
    };

    console.log("Payload for create:", payload);

    const res = await toast.promise(
      createDispense(prescription._id, payload),
      {
        loading: "creating dispensation...",
        success: "Dispensation Created successfully",
        error: "Failed to create Dispensation",
      }
    );

    const dispensed = res?.data?.data;
    console.log("Dispensation created:", dispensed);


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
            onClick={() => setIsSelectModalOpen(false)}
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
              Add Dispensation
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
            <h3 className="mb-4 text-lg font-medium text-base-content">Dispense Medication</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-base-300 p-3 bg-base-200/40 text-sm">
                      {meds.length === 0 ? (
                        <div className="text-base-content/70">No medications added</div>
                      ) : (
                        <ul className="list-disc list-inside">
                          {meds.map((m) => (
                            <li key={m.id} className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{m.name}</span>
                                <span className="ml-2 text-base-content/70">{[m.quantity, m.batchNumber, m.expiry].filter(Boolean).join(' • ')}</span>
                              </div>
                              <button className="btn btn-ghost btn-xs" onClick={() => removeMedication(m.id)}>Remove</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Dropdown select */}
                      <select
                        className="select select-bordered w-full"
                        value={newMed.inventoryId || ""}   // bind to inventoryId, not name
                        onChange={(e) => {
                          const selectedItem = inventoryItems.find(
                            (item) => item._id === e.target.value
                          );
                          if (selectedItem) {
                            setNewMed((nm) => ({
                              ...nm,
                              inventoryId: selectedItem._id,
                              name: selectedItem.name,
                              form: selectedItem.form,
                              stock: selectedItem.stock,
                              batchNumber: selectedItem.batchNumber,
                            }));
                          }
                        }}
                      >
                        <option value="">Select drugs</option>
                        {inventoryItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} - {item.form} - Stock Remaining: {item.stock}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input className="input input-bordered w-full" placeholder="Quantity (e.g., 2)" value={newMed.quantity} onChange={(e) => setNewMed((nm) => ({ ...nm, quantity: e.target.value }))} />
                      <input
                        className="input input-bordered w-full"
                        placeholder="Drug name"
                        value={newMed.name}
                        onChange={(e) =>
                          setNewMed((nm) => ({ ...nm, name: e.target.value }))
                        }
                      />
                      <input
                        className="input input-bordered w-full"
                        placeholder="Batch Number (e.g., ABC123)"
                        value={newMed.batchNumber}
                        onChange={(e) =>
                          setNewMed((nm) => ({ ...nm, batchNumber: e.target.value }))
                        }
                      />

                      <input className="input input-bordered w-full" placeholder="Expiry Date (e.g., 2024-12-31`)" value={newMed.expiry} onChange={(e) => setNewMed((nm) => ({ ...nm, expiry: e.target.value }))} />
                    </div>
                    <div>
                      <button className="btn btn-success btn-sm" onClick={addMedication}>+ Add Medication</button>
                    </div>
                  </div>
          </div>


        </div>
        {/* Buttons */}
        <div className="w-[349px] mx-auto justify-center items-center flex gap-[16px] mt-3">
          <button
            onClick={() => setIsSelectModalOpen(false)}
            className="w-[100px] h-[52px] rounded-[6px] border-[1px] border-[#AEAAAE] px-[24px] py-[16px] text-[#111215] text-[18px] font-[600] flex justify-center items-center cursor-pointer"
          >
            Close
          </button>
          <button
          onClick={handleUpdate}
          disabled={updateLoading}
          className="bg-[#00943C] w-[207px] h-[52px] px-[24px] py-[16px] rounded-[6px] text-[#FAFAFA] text-[18px] font-[600] flex justify-center items-center cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
            {updateLoading ? "Processing..." : "Dispense Drug"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDrugModal;
