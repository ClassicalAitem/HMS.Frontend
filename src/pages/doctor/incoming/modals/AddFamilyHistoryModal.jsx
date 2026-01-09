import React, { useState } from "react";

const AddFamilyHistoryModal = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (title && value) {
      onAdd({ title, value });
      setTitle("");
      setValue("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-200/90 bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add Family History</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Title</label>
              <input 
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Wife"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Value</label>
              <input 
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. 3"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              className="btn btn-success flex-1 text-base-content"
              onClick={handleSubmit}
            >
              Add Family History
            </button>
            <button 
              className="btn btn-outline flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFamilyHistoryModal;
