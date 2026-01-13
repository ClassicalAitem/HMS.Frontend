import React, { useState } from "react";
import { SearchableInput } from "@/components/common";

const AddFamilyHistoryModal = ({ isOpen, onClose, onAdd, data = [] }) => {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  React.useEffect(() => {
    console.log('AddFamilyHistoryModal received data:', data);
  }, [data]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add Family History</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Title</label>
              <SearchableInput 
                data={data}
                onSelect={(item) => setTitle(item ? item.name : "")}
                placeholder="Search family relation..."
                displayKey="name"
                className="w-full"
                initialValue={title}
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
              className="btn btn-outline flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn btn-success flex-1 text-white"
              onClick={handleSubmit}
            >
              Add Family History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFamilyHistoryModal;
