import React, { useState } from "react";

const AddHistoryModal = ({ isOpen, onClose, onAdd, type }) => {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (value) {
      onAdd(value);
      setValue("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-200/90 bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add {type} History</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">{type}</label>
              <input 
                type="text"
                className="input input-bordered w-full"
                placeholder={`Enter ${type.toLowerCase()}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              className="btn btn-success flex-1 text-white"
              onClick={handleSubmit}
            >
              Add {type} History
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

export default AddHistoryModal;
