import React, { useState, useRef, useEffect } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { createMedicalRecord } from "@/services/api/medicalRecordAPI";
import toast from "react-hot-toast";

const AddHistoryModal = ({ isOpen, onClose, onAdd, type, data = [] }) => {
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [localData, setLocalData] = useState(data);
  const [queuedItems, setQueuedItems] = useState([]);

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
    setValue("");
    setQueuedItems([]);
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

  // Pushes an item into the local queue (does NOT close the modal)
  const queueItem = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;

    setQueuedItems(prev => [...prev, { name: trimmed }]);

    // Reset the input fields so the user can add the next one
    setValue("");
    setSearch("");
  };

  const handleAddToQueue = () => {
    if (!value) {
      toast.error(`Select or enter a ${type.toLowerCase()} first`);
      return;
    }
    queueItem(value);
  };

  const removeQueuedItem = (idx) => {
    setQueuedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDone = () => {
    queuedItems.forEach(item => onAdd(item.name));
    setQueuedItems([]);
    setValue("");
    setSearch("");
    onClose();
  };

  const handleCancel = () => {
    setQueuedItems([]);
    setValue("");
    setSearch("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h3 className="text-xl font-semibold text-success mb-1">Add {type} History</h3>
          <p className="text-sm text-base-content/60">
            Add as many as you need, then hit Done.
          </p>
        </div>

        <div className="px-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">{type}</label>
            <div ref={wrapperRef} className="relative w-full">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder={`Search ${type.toLowerCase()}...`}
                  value={search || value}
                  onChange={e => {
                    setSearch(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-square shrink-0"
                  onClick={handleAddToQueue}
                >
                  <MdAdd className="text-xl" />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {(() => {
                    const filteredItems = Array.isArray(localData) ? (localData.filter(item =>
                      (search || value)
                        ? item.name.toLowerCase().includes((search || value).toLowerCase())
                        : true
                    )) : [];

                    if (filteredItems.length > 0) {
                      return (
                        <ul className="py-1">
                          {filteredItems.map(item => (
                            <li
                              key={item.id || item._id}
                              onClick={() => {
                                setValue(item.name);
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
                                  category: getCategoryFromType(type),
                                  name: search.trim()
                                });
                                const newItem = { name: search.trim() };
                                setLocalData(prev => [...prev, newItem]);
                                queueItem(search.trim());
                                setDropdownOpen(false);
                                toast.success(`Added "${newItem.name}" to ${type}`);
                              } catch (error) {
                                console.error("Error adding new item:", error);
                                toast.error("Failed to add new item");
                              }
                            }}
                            className="flex items-center gap-2 w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 px-2 py-1 rounded"
                          >
                            <MdAdd className="text-lg" />
                            Add "{search.trim()}" as new {type.toLowerCase()}
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

          {/* QUEUED ITEMS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-base-content">Added {type}</span>
              <span className="text-xs text-base-content/50">{queuedItems.length}</span>
            </div>

            {queuedItems.length === 0 ? (
              <div className="text-center py-6 text-sm text-base-content/40 border border-dashed border-base-300 rounded-lg">
                No {type.toLowerCase()} added yet
              </div>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {queuedItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-base-200/50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-base-content truncate">
                      {item.name}
                    </span>
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
            Done {queuedItems.length > 0 ? `(${queuedItems.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHistoryModal;