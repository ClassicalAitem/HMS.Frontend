import React, { useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";

const AddDiagnosisItemModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState("Average");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name) {
      onAdd({ name, severity });
      setName("");
      setSeverity("Average");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add Diagnosis</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Diagnosis Name</label>
              <input 
                type="text" 
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malaria"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Severity</label>
              <select 
                className="select select-bordered w-full"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Mild">Mild</option>
                <option value="Average">Average</option>
                <option value="Intense">Intense</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              className="btn btn-outline flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn btn-success flex-1 text-white"
              onClick={handleSubmit}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDiagnosisItemModal;