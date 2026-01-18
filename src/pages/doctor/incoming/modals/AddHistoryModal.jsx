import React, { useState } from "react";
import { SearchableInput } from "@/components/common";

const AddHistoryModal = ({ isOpen, onClose, onAdd, type, data = [] }) => {
  const [value, setValue] = useState("");

  React.useEffect(() => {
    console.log(`AddHistoryModal (${type}) received data:`, data);
  }, [data, type]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (value) {
      onAdd(value);
      setValue("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add {type} History</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">{type}</label>
              <SearchableInput 
                data={data}
                onSelect={(item) => setValue(item ? item.name : "")}
                placeholder={`Search ${type.toLowerCase()}...`}
                displayKey="name"
                className="w-full"
                initialValue={value}
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
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHistoryModal;
