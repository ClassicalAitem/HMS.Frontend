import React, { useState, useRef, useEffect } from "react";

const AddHistoryModal = ({ isOpen, onClose, onAdd, type, data = [] }) => {
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearch("");
    setValue("");
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
              <div ref={wrapperRef} className="relative w-full">
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
                {dropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    <ul className="py-1">
                      {Array.isArray(data) && data.filter(item =>
                        (search || value)
                          ? item.name.toLowerCase().includes((search || value).toLowerCase())
                          : true
                      ).map(item => (
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
                      {Array.isArray(data) && data.filter(item =>
                        (search || value)
                          ? item.name.toLowerCase().includes((search || value).toLowerCase())
                          : true
                      ).length === 0 && (
                        <li className="px-4 py-2 text-gray-400 text-sm">No matches found</li>
                      )}
                    </ul>
                  </div>
                )}
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

export default AddHistoryModal;
