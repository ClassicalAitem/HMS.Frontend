import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchableInput = ({ 
  data = [], 
  onSelect, 
  placeholder = "Search...", 
  displayKey = "name", // Key to display in dropdown
  valueKey = "name",   // Key to return on selection
  className = "",
  initialValue = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm && isOpen) {
      const filtered = data.filter(item => {
        const itemValue = typeof item === 'object' ? item[displayKey] : item;
        return String(itemValue).toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [searchTerm, data, displayKey, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const displayValue = typeof item === 'object' ? item[displayKey] : item;
    setSearchTerm(displayValue);
    onSelect(item);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSelect(null);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          className="input input-bordered w-full pr-10"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {searchTerm ? (
            <button 
              type="button" 
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          ) : (
            <FaSearch className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredData.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {filteredData.map((item, index) => {
              const displayValue = typeof item === 'object' ? item[displayKey] : item;
              return (
                <li
                  key={index}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                >
                  {displayValue}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      {/* No Results Message */}
      {isOpen && searchTerm && filteredData.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-500 text-center">
          No matches found
        </div>
      )}
    </div>
  );
};

export default SearchableInput;