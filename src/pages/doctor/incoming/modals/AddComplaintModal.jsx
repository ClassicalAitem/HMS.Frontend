import React, { useState, useRef, useEffect } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { createMedicalRecord } from "@/services/api/medicalRecordAPI";
import toast from "react-hot-toast";

const AddComplaintModal = ({ isOpen, onClose, onAdd, data = [] }) => {
  const [symptom, setSymptom] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("Hour(s)");
  const [localData, setLocalData] = useState(data);
  const [queuedComplaints, setQueuedComplaints] = useState([]);

  // Map display type to API category enum
  const getCategoryFromType = (typeStr) => {
    const categoryMap = {
      "Symptoms": "symptoms",
      "Surgical": "surgical",
      "Family": "family",
      "Social": "social",
      "Allergic": "allergic",
      "Medical History": "medical_history",
      "Diagnosis": "diagnosis",
    };
    return categoryMap[typeStr] || typeStr.toLowerCase().replace(/\s+/g, "_");
  };

  useEffect(() => {
    setSearch("");
    setSymptom("");
    setDuration("");
    setDurationUnit("Hour(s)");
    setQueuedComplaints([]);
    setLocalData(data);
  }, [isOpen, data]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  if (!isOpen) return null;

  // Pushes a complaint into the local queue (does NOT close the modal)
  const queueComplaint = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;

    const finalDuration = duration || "1";
    setQueuedComplaints(prev => [
      ...prev,
      {
        name: trimmed,
        duration: `${finalDuration} ${durationUnit}`,
        value: parseInt(finalDuration),
        unit: durationUnit,
      },
    ]);

    // Reset the input fields so the user can add the next one
    setSymptom("");
    setSearch("");
    setDuration("");
    setDurationUnit("Hour(s)");
  };

  const handleAddToQueue = () => {
    if (!symptom) {
      toast.error("Select or enter a symptom first");
      return;
    }
    queueComplaint(symptom);
  };

  const removeQueuedItem = (idx) => {
    setQueuedComplaints(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDone = () => {
    queuedComplaints.forEach(item => onAdd(item));
    setQueuedComplaints([]);
    setSymptom("");
    setSearch("");
    setDuration("");
    setDurationUnit("Hour(s)");
    onClose();
  };

  const handleCancel = () => {
    setQueuedComplaints([]);
    setSymptom("");
    setSearch("");
    setDuration("");
    setDurationUnit("Hour(s)");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h3 className="text-xl font-semibold text-success mb-1">Add Complaint</h3>
          <p className="text-sm text-base-content/60">
            Add as many as you need, then hit Done.
          </p>
        </div>

        <div className="px-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">Symptoms</label>
            <div ref={wrapperRef} className="relative w-full">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Search symptoms..."
                value={search || symptom}
                onChange={e => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                autoComplete="off"
              />
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {(() => {
                    const filteredItems = Array.isArray(localData) ? (localData.filter(item =>
                      (search || symptom)
                        ? item.name.toLowerCase().includes((search || symptom).toLowerCase())
                        : true
                    )) : [];

                    if (filteredItems.length > 0) {
                      return (
                        <ul className="py-1">
                          {filteredItems.map(item => (
                            <li
                              key={item.id || item._id}
                              onClick={() => {
                                setSymptom(item.name);
                                setSearch(item.name);
                                setDropdownOpen(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                            >
                              {item.name}
                            </li>
                          ))}
                        </ul>
                      );
                    } else if (search && search.trim()) {
                      return (
                        <div className="py-2 px-4">
                          <button
                            onClick={async () => {
                              try {
                                await createMedicalRecord({
                                  category: getCategoryFromType("Symptoms"),
                                  name: search.trim()
                                });
                                const newItem = { name: search.trim() };
                                setLocalData(prev => [...prev, newItem]);
                                queueComplaint(search.trim());
                                setDropdownOpen(false);
                                toast.success(`Added "${newItem.name}" to Symptoms`);
                              } catch (error) {
                                console.error("Error adding new item:", error);
                                toast.error("Failed to add new item");
                              }
                            }}
                            className="flex items-center gap-2 w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 px-2 py-1 rounded"
                          >
                            <MdAdd className="text-lg" />
                            Add "{search.trim()}" as new symptom
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="py-2 px-4 text-gray-400 text-sm">
                          No matches found
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content mb-1">Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                className="input input-bordered w-24"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1"
              />
              <select
                className="select select-bordered flex-1"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
              >
                <option value="Hour(s)">Hour(s)</option>
                <option value="Day(s)">Day(s)</option>
                <option value="Week(s)">Week(s)</option>
                <option value="Month(s)">Month(s)</option>
                <option value="Year(s)">Year(s)</option>
              </select>
              <button
                type="button"
                className="btn btn-primary btn-square shrink-0"
                onClick={handleAddToQueue}
              >
                <MdAdd className="text-xl" />
              </button>
            </div>
          </div>

          {/* QUEUED COMPLAINTS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-base-content">Added Complaints</span>
              <span className="text-xs text-base-content/50">{queuedComplaints.length}</span>
            </div>

            {queuedComplaints.length === 0 ? (
              <div className="text-center py-6 text-sm text-base-content/40 border border-dashed border-base-300 rounded-lg">
                No complaints added yet
              </div>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {queuedComplaints.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-base-200/50 rounded-lg"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-base-content truncate block">
                        {item.name}
                      </span>
                      <span className="text-xs text-base-content/60">
                        {item.duration}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQueuedItem(idx)}
                      className="btn btn-ghost btn-xs btn-circle text-error shrink-0"
                    >
                      <MdClose />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-4 p-6 pt-4">
          <button
            className="btn btn-outline flex-1"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-success flex-1 text-white"
            onClick={handleDone}
          >
            Done {queuedComplaints.length > 0 ? `(${queuedComplaints.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddComplaintModal;