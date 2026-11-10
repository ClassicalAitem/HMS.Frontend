import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { getPatients } from '@/services/api/patientsAPI';
import { FaSearch, FaUser, FaTimes, FaSpinner, FaHospitalUser, FaPhoneAlt, FaIdCard, FaShieldAlt } from 'react-icons/fa';

const UniversalPatientSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const normalizedRole = (user?.role || user?.accountType || '').toLowerCase().trim().replace(/_/g, '-');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getPatients({ search: trimmed, limit: 12 });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setResults(list);
        setSelectedIndex(0);
      } catch (err) {
        console.error('UniversalPatientSearchModal error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const resolvePatientPath = (patient, action = 'view') => {
    const id = patient.id;
    if (normalizedRole === 'doctor') {
      if (action === 'vitals') return `/dashboard/doctor/view-vitals/${id}`;
      return `/dashboard/doctor/patient/${id}`;
    }
    if (normalizedRole === 'nurse') {
      if (action === 'vitals') return `/dashboard/nurse/view-vitals/${id}`;
      return `/dashboard/nurse/patient/${id}`;
    }
    if (normalizedRole === 'cashier' || normalizedRole === 'account-officer') {
      return `/dashboard/cashier/patients/${id}`;
    }
    if (normalizedRole === 'hmo') {
      return `/hmo/incoming/details/${id}`;
    }
    if (normalizedRole === 'medical-director') {
      return `/dashboard/medical-director/patient/${id}`;
    }
    if (normalizedRole === 'medical-laboratory' || normalizedRole === 'lab-technician') {
      return `/dashboard/laboratory/patients/${id}`;
    }
    if (normalizedRole === 'surgeon') {
      return `/dashboard/surgeon/incoming/${id}`;
    }
    if (normalizedRole === 'pharmacist') {
      return `/dashboard/pharmacist/patients/${id}`;
    }
    // Frontdesk & Admin default
    return `/frontdesk/patients/${id}`;
  };

  const handleSelectPatient = (patient, action = 'view') => {
    if (!patient?.id) return;
    const path = resolvePatientPath(patient, action);
    onClose();
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelectPatient(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-14 sm:pt-20 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="card w-full max-w-2xl bg-base-100 shadow-2xl border border-base-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-base-200 flex items-center gap-3 bg-base-200/50">
          <FaSearch className="w-5 h-5 text-primary shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            className="input input-ghost w-full focus:outline-none focus:bg-transparent text-base sm:text-lg text-base-content placeholder:text-base-content/50"
            placeholder="Search patient by Full Name, Phone, or Hospital ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading && <FaSpinner className="w-4 h-4 animate-spin text-primary shrink-0" />}
          {query && !loading && (
            <button 
              onClick={() => setQuery('')}
              className="btn btn-ghost btn-circle btn-xs text-base-content/60"
              title="Clear search"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          )}
          <kbd className="kbd kbd-sm bg-base-100 text-xs text-base-content/60 hidden sm:inline-flex shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto flex-1 divide-y divide-base-200/70 p-2">
          {!query.trim() && (
            <div className="p-8 text-center text-base-content/60 space-y-2">
              <FaHospitalUser className="w-12 h-12 mx-auto text-base-content/30" />
              <p className="text-sm font-medium">Type any patient's full name to search</p>
              <p className="text-xs text-base-content/50">
                You can search by First Name, Last Name, Phone Number, or Hospital ID (e.g. KOLAK-100001).
              </p>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="p-8 text-center text-base-content/60 space-y-2">
              <p className="text-sm font-medium">No patient found matching "{query}"</p>
              <p className="text-xs text-base-content/50">Verify the spelling or search using phone number or ID.</p>
            </div>
          )}

          {results.map((patient, idx) => {
            const isSelected = idx === selectedIndex;
            const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
            const hmoName = patient.hmos?.[0]?.hmo?.name || patient.insurance || null;
            const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase() || 'P';

            return (
              <div
                key={patient.id || idx}
                onClick={() => handleSelectPatient(patient)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected ? 'bg-primary/10 border-primary/20' : 'hover:bg-base-200/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isSelected ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'
                  }`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-base-content truncate">
                        {fullName}
                      </span>
                      <span className="badge badge-sm badge-outline text-[11px] font-mono">
                        {patient.hospitalId || 'NO-ID'}
                      </span>
                      {patient.gender && (
                        <span className="badge badge-xs text-[10px] capitalize">
                          {patient.gender}
                        </span>
                      )}
                      {hmoName && (
                        <span className="badge badge-xs badge-info text-info-content gap-1 text-[10px]">
                          <FaShieldAlt className="w-2.5 h-2.5" />
                          {hmoName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-base-content/60 mt-0.5">
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <FaPhoneAlt className="w-2.5 h-2.5" />
                          {patient.phone}
                        </span>
                      )}
                      {patient.status && (
                        <span className="capitalize font-medium text-primary">
                          • {patient.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPatient(patient, 'view');
                    }}
                    className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    Open
                  </button>
                  {['doctor', 'nurse'].includes(normalizedRole) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPatient(patient, 'vitals');
                      }}
                      className="btn btn-xs btn-outline hidden sm:inline-flex"
                      title="View vitals & MEWS"
                    >
                      Vitals
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-base-200/50 border-t border-base-200 flex items-center justify-between text-[11px] text-base-content/60">
          <div className="flex items-center gap-3">
            <span><kbd className="kbd kbd-xs">↑</kbd> <kbd className="kbd kbd-xs">↓</kbd> Navigate</span>
            <span><kbd className="kbd kbd-xs">Enter</kbd> Select</span>
            <span><kbd className="kbd kbd-xs">Esc</kbd> Close</span>
          </div>
          <span>Fast Patient Lookup</span>
        </div>
      </div>
    </div>
  );
};

export default UniversalPatientSearchModal;

