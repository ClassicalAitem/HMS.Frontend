import React, { useState } from "react";

const AddComplaintModal = ({ isOpen, onClose, onAdd }) => {
  const [symptom, setSymptom] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("Day(s)");

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
              <select 
                className="select select-bordered w-full"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
              >
                <option value="">Select symptoms</option>
                <option value="Headache">Headache</option>
                <option value="Fever">Fever</option>
                <option value="Cough">Cough</option>
                <option value="Stomach Ache">Stomach Ache</option>
                <option value="Fatigue">Fatigue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Duration</label>
              <div className="flex gap-2">
                <select 
                  className="select select-bordered w-24"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="" disabled>--</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
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
              className="btn btn-success flex-1 text-white"
              onClick={handleSubmit}
            >
              Add Complaint
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

export default AddComplaintModal;
