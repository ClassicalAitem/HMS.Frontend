import React, { useState, useEffect, useRef } from "react";
import { getPatients } from "@/services/api/patientsAPI";
import { FaHospitalUser, FaTimes, FaSearch, FaSpinner } from "react-icons/fa";

export const PatientTagSelector = ({ selectedPatient, onSelectPatient }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await getPatients({ search: query.trim(), limit: 6 });
        const list = Array.isArray(res?.data) ? res.data : [];
        setResults(list);
      } catch (err) {
        console.error("Failed to search patients:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  const handleSelect = (patient) => {
    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    const hospId = patient.hospitalId || patient.id?.slice(0, 8);
    onSelectPatient({
      id: patient.id,
      hospitalId: hospId,
      name: fullName,
      tag: `${fullName} (${hospId})`,
    });
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectPatient(null);
  };

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {selectedPatient ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
          <FaHospitalUser className="text-primary text-xs" />
          <span className="truncate max-w-[220px]">
            {selectedPatient.tag || selectedPatient.name}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-error transition ml-1 cursor-pointer"
            title="Remove patient tag"
          >
            <FaTimes className="text-[10px]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-xs btn-ghost border border-base-300 rounded-xl text-base-content/70 hover:text-primary hover:border-primary gap-1 text-[11px]"
        >
          <FaHospitalUser className="text-xs" />
          Tag Patient
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-2 z-30">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-base-200/70 rounded-xl border border-base-300 mb-2">
            <FaSearch className="text-base-content/40 text-xs shrink-0" />
            <input
              type="text"
              placeholder="Search by name or Hospital ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="bg-transparent border-none outline-hidden text-xs w-full text-base-content"
            />
            {loading && <FaSpinner className="animate-spin text-primary text-xs shrink-0" />}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {results.length === 0 ? (
              <div className="py-4 text-center text-xs text-base-content/50">
                {query.trim() ? "No matching patients found" : "Type to search hospital patients..."}
              </div>
            ) : (
              results.map((p) => {
                const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-base-200/80 transition text-left group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-base-content group-hover:text-primary transition">
                        {fullName}
                      </div>
                      <div className="text-[10px] text-base-content/50 font-mono">
                        ID: {p.hospitalId || "N/A"}
                      </div>
                    </div>
                    <span className="badge badge-xs badge-ghost text-[9px] group-hover:badge-primary transition">
                      Select
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTagSelector;
