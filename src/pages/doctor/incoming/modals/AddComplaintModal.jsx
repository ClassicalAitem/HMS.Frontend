import React, { useState } from "react";
import { SearchableInput } from "@/components/common";

const AddComplaintModal = ({ isOpen, onClose, onAdd, data = [] }) => {
  const [symptom, setSymptom] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("Day(s)");

  React.useEffect(() => {
      console.log('AddComplaintModal received data:', data);
  }, [data]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (symptom) {
      // Use default duration of '1' if user hasn't changed the dropdown
      const finalDuration = duration || "1";
      onAdd({ 
        name: symptom, 
        duration: `${finalDuration} ${durationUnit}`,
        value: parseInt(finalDuration),
        unit: durationUnit
      });
      setSymptom("");
      setDuration("");
      setDurationUnit("Day(s)");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add Complaint</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Symptoms</label>
              <SearchableInput 
                data={data}
                onSelect={(item) => setSymptom(item ? item.name : "")}
                placeholder="Search symptoms..."
                displayKey="name"
                className="w-full"
                initialValue={symptom}
              />
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
                  <option value="Day(s)">Day(s)</option>
                  <option value="Week(s)">Week(s)</option>
                  <option value="Month(s)">Month(s)</option>
                  <option value="Year(s)">Year(s)</option>
                </select>
              </div>
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

export default AddComplaintModal;
