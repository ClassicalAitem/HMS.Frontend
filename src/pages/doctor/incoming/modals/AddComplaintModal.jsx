import React, { useState, useRef, useEffect } from "react";

const AddComplaintModal = ({ isOpen, onClose, onAdd, data = [] }) => {
  const [symptom, setSymptom] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("Day(s)");

  useEffect(() => {
    setSearch("");
    setSymptom("");
  }, [isOpen]);

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
                    <ul className="py-1">
                      {Array.isArray(data) && data.filter(item =>
                        (search || symptom)
                          ? item.name.toLowerCase().includes((search || symptom).toLowerCase())
                          : true
                      ).map(item => (
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
                      {Array.isArray(data) && data.filter(item =>
                        (search || symptom)
                          ? item.name.toLowerCase().includes((search || symptom).toLowerCase())
                          : true
                      ).length === 0 && (
                        <li className="px-4 py-2 text-gray-400 text-sm">No matches found</li>
                      )}
                    </ul>
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
