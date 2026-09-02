import React, { useState, useRef, useEffect } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { createMedicalRecord } from "@/services/api/medicalRecordAPI";
import toast from "react-hot-toast";

const AddFamilyHistoryModal = ({ isOpen, onClose, onAdd, data = [] }) => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [value, setValue] = useState("");
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
  const queueItem = (titleVal, valueVal) => {
    const trimmedTitle = (titleVal || "").trim();
    const trimmedValue = (valueVal || "").trim();
    if (!trimmedTitle || !trimmedValue) return;

    setQueuedItems(prev => [...prev, { title: trimmedTitle, value: trimmedValue }]);

    // Reset the input fields so the user can add the next one
    setSearch("");
    setValue("");
  };

  const handleAddToQueue = () => {
    if (!search.trim() || !value) {
      toast.error("Select a relation and enter a value first");
      return;
    }
    queueItem(search, value);
  };

  const removeQueuedItem = (idx) => {
    setQueuedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDone = () => {
    queuedItems.forEach(item => onAdd({ title: item.title, value: item.value }));
    setQueuedItems([]);
    setSearch("");
    setValue("");
    onClose();
  };

  const handleCancel = () => {
    setQueuedItems([]);
    setSearch("");
    setValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h3 className="text-xl font-semibold text-success mb-1">Add Family History</h3>
          <p className="text-sm text-base-content/60">
            Add as many as you need, then hit Done.
          </p>
        </div>

        <div className="px-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">Title</label>
            <div ref={wrapperRef} className="relative w-full">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Search family relation..."
                value={search}
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
                    const query = search.trim();
                    const filteredItems = Array.isArray(localData) ? (localData.filter(item =>
                      query
                        ? item.name.toLowerCase().includes(query.toLowerCase())
                        : true
                    )) : [];

                    // Only hide the "add new" option if there's an EXACT match
                    // (case-insensitive). Partial matches shouldn't block adding
                    // a differently-named new relation.
                    const hasExactMatch = query
                      ? filteredItems.some(item => item.name.toLowerCase() === query.toLowerCase())
                      : true;

                    return (
                      <>
                        {query && !hasExactMatch && (
                          <div className={`py-2 px-4 ${filteredItems.length > 0 ? "border-t border-gray-100" : ""}`}>
                            <button
                              onClick={async () => {
                                try {
                                  await createMedicalRecord({
                                    category: getCategoryFromType("Family"),
                                    name: query
                                  });
                                  const newItem = { name: query };
                                  setLocalData(prev => [...prev, newItem]);
                                  setSearch(query);
                                  setDropdownOpen(false);
                                  toast.success(`Added "${newItem.name}" to Family History`);
                                } catch (error) {
                                  console.error("Error adding new item:", error);
                                  toast.error("Failed to add new item");
                                }
                              }}
                              className="flex items-center gap-2 w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 px-2 py-1 rounded"
                            >
                              <MdAdd className="text-lg" />
                              Add "{query}" as new family relation
                            </button>
                          </div>
                        )}
                        {filteredItems.length > 0 ? (
                          <ul className="py-1">
                            {filteredItems.map(item => (
                              <li
                                key={item.id || item._id}
                                onClick={() => {
                                  setSearch(item.name);
                                  setDropdownOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                              >
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          !query && (
                            <div className="py-2 px-4 text-gray-400 text-sm">
                              No matches found
                            </div>
                          )
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content mb-1">Value</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. 3"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary btn-square shrink-0"
                onClick={handleAddToQueue}
              >
                <MdAdd className="text-xl" />
              </button>
            </div>
          </div>

          {/* QUEUED ITEMS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-base-content">Added Family History</span>
              <span className="text-xs text-base-content/50">{queuedItems.length}</span>
            </div>

            {queuedItems.length === 0 ? (
              <div className="text-center py-6 text-sm text-base-content/40 border border-dashed border-base-300 rounded-lg">
                No family history added yet
              </div>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {queuedItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-base-200/50 rounded-lg"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-base-content truncate block">
                        {item.title}
                      </span>
                      <span className="text-xs text-base-content/60">
                        {item.value}
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
            Done {queuedItems.length > 0 ? `(${queuedItems.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFamilyHistoryModal;