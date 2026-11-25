import React, { useState, useEffect, useRef } from "react";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { FaHospitalUser, FaUsers, FaUser, FaTimes, FaSearch, FaSpinner } from "react-icons/fa";

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
        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients({ search: query.trim(), limit: 6 }),
          getDependants({ search: query.trim(), limit: 6 }),
        ]);

        const patientsList =
          patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value?.data)
            ? patientsRes.value.data.map((p) => {
                const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Patient";
                const hospId = p.hospitalId || p.id?.slice(0, 8);
                return {
                  id: p.id,
                  type: "patient",
                  name: fullName,
                  hospitalId: hospId,
                  tag: `${fullName} (${hospId})`,
                  badgeLabel: "Principal Patient",
                  detail: `Hospital ID: ${hospId}`,
                };
              })
            : [];

        const rawDeps =
          dependantsRes.status === "fulfilled"
            ? Array.isArray(dependantsRes.value?.data?.data)
              ? dependantsRes.value.data.data
              : Array.isArray(dependantsRes.value?.data)
              ? dependantsRes.value.data
              : []
            : [];

        const dependantsList = rawDeps.map((d) => {
          const depName = `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Dependant";
          const principal = d.patient;
          const principalName = principal
            ? `${principal.firstName || ""} ${principal.lastName || ""}`.trim()
            : "";
          const principalHospId = principal?.hospitalId || "";
          const relationship = d.relationshipType || "Dependant";
          return {
            id: d.id,
            type: "dependant",
            name: depName,
            relationship,
            principalName,
            hospitalId: principalHospId,
            tag: `${depName} (DEP: ${relationship} of ${principalName || "Principal"}${principalHospId ? ` - ${principalHospId}` : ""})`,
            badgeLabel: `Dependant • ${relationship}`,
            detail: `Principal: ${principalName || "Unknown"} (${principalHospId || "No ID"})`,
          };
        });

        setResults([...patientsList, ...dependantsList]);
      } catch (err) {
        console.error("Failed to search patients and dependants:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  const handleSelect = (item) => {
    onSelectPatient(item);
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
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
          selectedPatient.type === "dependant"
            ? "bg-secondary/15 border-secondary/35 text-secondary"
            : "bg-primary/10 border-primary/30 text-primary"
        }`}>
          {selectedPatient.type === "dependant" ? (
            <FaUsers className="text-secondary text-xs" />
          ) : (
            <FaHospitalUser className="text-primary text-xs" />
          )}
          <span className="truncate max-w-[240px] font-semibold">
            {selectedPatient.tag || selectedPatient.name}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-error transition ml-1 cursor-pointer"
            title="Remove tagged patient / dependant"
          >
            <FaTimes className="text-[10px]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-xs btn-ghost border border-base-300 rounded-xl text-base-content/70 hover:text-primary hover:border-primary gap-1.5 text-[11px]"
        >
          <FaHospitalUser className="text-xs" />
          Tag Patient / Dependant
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-2.5 z-30">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-base-200/80 rounded-xl border border-base-300 mb-2">
            <FaSearch className="text-base-content/40 text-xs shrink-0" />
            <input
              type="text"
              placeholder="Search patient or dependant name, Hospital ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="bg-transparent border-none outline-hidden text-xs w-full text-base-content placeholder:text-base-content/50"
            />
            {loading && <FaSpinner className="animate-spin text-primary text-xs shrink-0" />}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {results.length === 0 ? (
              <div className="py-5 text-center text-xs text-base-content/50">
                {query.trim()
                  ? "No matching patients or dependants found"
                  : "Type to search patients and family dependants..."}
              </div>
            ) : (
              results.map((item) => {
                const isDep = item.type === "dependant";
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-base-200/80 transition text-left group gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        isDep
                          ? "bg-secondary/15 text-secondary border border-secondary/30"
                          : "bg-primary/15 text-primary border border-primary/30"
                      }`}>
                        {isDep ? <FaUsers /> : <FaUser />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-base-content group-hover:text-primary transition truncate">
                            {item.name}
                          </span>
                          <span className={`badge badge-2xs text-[8px] font-semibold tracking-wide uppercase ${
                            isDep ? "badge-secondary badge-outline" : "badge-primary badge-outline"
                          }`}>
                            {item.badgeLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-base-content/60 truncate font-mono mt-0.5">
                          {item.detail}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-xs badge-ghost text-[9px] group-hover:badge-primary transition shrink-0">
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
