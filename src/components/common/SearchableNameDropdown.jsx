import React, { useState, useEffect, useRef } from 'react';

const SearchableNameDropdown = ({ 
  items = [], 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Search or type name',
  label = 'Name',
  loading = false,
  allowNew = true
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Update filtered items when search or items change
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(items);
      setIsNewEntry(false);
      return;
    }

    const query = search.toLowerCase();
    const matches = items.filter(item => 
      item.toLowerCase().includes(query)
    );
    
    // Check if search value matches any existing item exactly
    const exactMatch = items.some(item => item.toLowerCase() === query);
    
    // If allowNew and no exact match, show option to create new
    if (allowNew && !exactMatch && search.trim()) {
      setIsNewEntry(true);
      setFiltered([...matches]);
    } else {
      setIsNewEntry(false);
      setFiltered(matches);
    }
  }, [search, items, allowNew]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange(item);
    setSearch(item);
    setIsOpen(false);
    setIsNewEntry(false);
  };

  const handleNewEntry = () => {
    if (search.trim()) {
      onChange(search.trim());
      setSearch(search.trim());
      setIsOpen(false);
      setIsNewEntry(false);
    }
  };

  const handleInputChange = (e) => {
    const nextValue = e.target.value;
    setSearch(nextValue);
    setIsOpen(true);
    if (nextValue === '') {
      onChange('');
      setIsNewEntry(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    if (isNewEntry) {
      handleNewEntry();
    } else if (filtered.length > 0) {
      handleSelect(filtered[0]);
    }
  };

  const displayValue = search !== '' ? search : value;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block mb-1 text-sm text-base-content/70">{label} *</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full input input-bordered"
          autoComplete="off"
          required={!value}
        />

          {displayValue && !loading && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                onChange('');
                setIsOpen(true);
                setIsNewEntry(false);
                inputRef.current?.focus();
              }}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              aria-label="Clear"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : filtered.length === 0 && !isNewEntry ? (
            <div className="p-4 text-center text-sm text-base-content/50">
              No matches found
            </div>
          ) : (
            <>
              {/* Existing Items */}
              {filtered.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-2 hover:bg-base-200 transition-colors text-sm border-b border-base-200 last:border-b-0"
                >
                  <span className="text-base-content">{item}</span>
                </button>
              ))}

              {/* New Entry Option */}
              {isNewEntry && (
                <button
                  type="button"
                  onClick={handleNewEntry}
                  className="w-full text-left px-4 py-3 bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium text-primary border-t border-base-200"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    Add New: <span className="font-semibold">{search.trim()}</span>
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  </div>
  );
};

export default SearchableNameDropdown;
