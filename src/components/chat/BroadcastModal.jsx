import React, { useState, useEffect, useRef } from "react";
import chatAPI from "@/services/api/chatAPI";
import { getPatients } from "@/services/api/patientsAPI";
import {
  FaBullhorn,
  FaTimes,
  FaExclamationTriangle,
  FaPaperPlane,
  FaSpinner,
  FaSearch,
  FaHospitalUser,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const TARGET_ROLE_OPTIONS = [
  { value: "all", label: "Hospital-wide (All Staff)" },
  { value: "doctor", label: "Doctors Department" },
  { value: "nurse", label: "Nurses Department" },
  { value: "pharmacist", label: "Pharmacy Department" },
  { value: "front-desk", label: "Front Desk & Reception" },
  { value: "cashier", label: "Cashier & Accounts" },
  { value: "medical-laboratory", label: "Laboratory Department" },
  { value: "sonographer", label: "Sonography / Radiology" },
  { value: "surgeon", label: "Surgical Team" },
  { value: "hmo", label: "HMO & Insurance Desk" },
  { value: "human-resource", label: "Human Resources" },
  { value: "admin", label: "Hospital Administration" },
];

export const BroadcastModal = ({ isOpen, onClose, onBroadcastSent }) => {
  const [targetRole, setTargetRole] = useState("all");
  const [isUrgent, setIsUrgent] = useState(false);
  const [content, setContent] = useState("");
  const [patientRefId, setPatientRefId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchContainerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced patient search
  useEffect(() => {
    if (!patientSearchQuery.trim() || selectedPatient) {
      setPatientResults([]);
      setIsSearchingPatient(false);
      return;
    }

    setIsSearchingPatient(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await getPatients({ search: patientSearchQuery.trim(), limit: 6 });
        const list = Array.isArray(res?.data) ? res.data : [];
        setPatientResults(list);
      } catch (err) {
        console.error("Failed to search patients for broadcast tag:", err);
        setPatientResults([]);
      } finally {
        setIsSearchingPatient(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [patientSearchQuery, selectedPatient]);

  // Reset state when closing/opening
  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setPatientRefId("");
      setSelectedPatient(null);
      setPatientSearchQuery("");
      setPatientResults([]);
      setIsDropdownOpen(false);
      setIsUrgent(false);
      setTargetRole("all");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPatient = (patient) => {
    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    const hospId = patient.hospitalId || patient.id?.slice(0, 8);
    const tagged = {
      id: patient.id,
      hospitalId: hospId,
      name: fullName,
      tag: `${fullName} (${hospId})`,
    };
    setSelectedPatient(tagged);
    setPatientRefId(tagged.tag);
    setPatientSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleRemovePatientTag = () => {
    setSelectedPatient(null);
    setPatientRefId("");
    setPatientSearchQuery("");
    setPatientResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter announcement text");
      return;
    }

    setLoading(true);
    try {
      const finalPatientTag = selectedPatient?.tag || patientRefId.trim() || undefined;

      await chatAPI.sendMessage({
        targetRole,
        content: content.trim(),
        messageType: isUrgent ? "urgent" : "announcement",
        patientRefId: finalPatientTag,
      });

      toast.success(
        targetRole === "all"
          ? "Global announcement dispatched to all staff"
          : `Announcement sent to ${targetRole} department`
      );

      setContent("");
      setPatientRefId("");
      setSelectedPatient(null);
      setIsUrgent(false);
      onBroadcastSent?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 p-4 bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <FaBullhorn />
            </div>
            <div>
              <h3 className="text-sm font-bold text-base-content">Create Management Broadcast</h3>
              <p className="text-[11px] text-base-content/60">
                Send global announcements or department-targeted directives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-base-content mb-1">Target Audience</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="select select-sm w-full bg-base-200/80 border border-base-300 rounded-xl"
            >
              {TARGET_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-warning/10 border border-warning/20">
            <input
              type="checkbox"
              id="is-urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="checkbox checkbox-sm checkbox-warning"
            />
            <label htmlFor="is-urgent" className="flex items-center gap-1.5 cursor-pointer font-medium text-warning-content text-xs">
              <FaExclamationTriangle className="text-warning text-sm" /> Mark as High Priority / Urgent Alert
            </label>
          </div>

          <div>
            <label className="block font-semibold text-base-content mb-1">
              Announcement Message
            </label>
            <textarea
              rows={4}
              placeholder="Type your official announcement or directive..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="textarea w-full bg-base-200/80 border border-base-300 rounded-xl text-xs p-3 focus:bg-base-100 focus:border-primary"
              required
            />
          </div>

          {/* Patient Reference & Tagging Section */}
          <div ref={searchContainerRef} className="relative">
            <label className="block font-semibold text-base-content mb-1">
              Patient Reference & Tag (Optional)
            </label>

            {selectedPatient ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                    <FaHospitalUser className="text-xs" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">{selectedPatient.name}</div>
                    <div className="text-[10px] text-base-content/70 font-mono">
                      Hospital ID: {selectedPatient.hospitalId || "N/A"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePatientTag}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-error"
                  title="Remove patient tag"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative flex items-center">
                  <FaSearch className="absolute left-3 text-base-content/40 text-xs" />
                  <input
                    type="text"
                    placeholder="Search by name or Hospital ID to tag patient..."
                    value={patientSearchQuery}
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value);
                      setPatientRefId(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (patientSearchQuery.trim()) setIsDropdownOpen(true);
                    }}
                    className="input input-sm w-full pl-8 pr-8 bg-base-200/80 border border-base-300 rounded-xl text-xs focus:bg-base-100 focus:border-primary"
                  />
                  {isSearchingPatient ? (
                    <FaSpinner className="absolute right-3 animate-spin text-primary text-xs" />
                  ) : patientSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientSearchQuery("");
                        setPatientRefId("");
                        setPatientResults([]);
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-2.5 text-base-content/40 hover:text-base-content text-xs"
                    >
                      <FaTimes />
                    </button>
                  ) : null}
                </div>

                {/* Dropdown search results */}
                {isDropdownOpen && patientSearchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-base-100 shadow-xl border border-base-300 p-1.5 z-50 max-h-48 overflow-y-auto space-y-1">
                    {patientResults.length === 0 ? (
                      <div className="py-3 px-2 text-center text-xs text-base-content/50">
                        {isSearchingPatient
                          ? "Searching hospital records..."
                          : `No patient found for "${patientSearchQuery}". Manual reference will be used.`}
                      </div>
                    ) : (
                      patientResults.map((p) => {
                        const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                        const hospId = p.hospitalId || p.id?.slice(0, 8);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPatient(p)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-base-200/80 transition text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs">
                                <FaHospitalUser />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-base-content group-hover:text-primary transition">
                                  {fullName}
                                </div>
                                <div className="text-[10px] text-base-content/50 font-mono">
                                  ID: {hospId}
                                </div>
                              </div>
                            </div>
                            <span className="badge badge-xs badge-ghost text-[9px] group-hover:badge-primary transition">
                              Tag Patient
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-sm btn-ghost rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-sm rounded-xl gap-2 text-white font-bold ${
                isUrgent ? "btn-warning" : "btn-primary"
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Broadcasting...
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" /> Broadcast Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastModal;
