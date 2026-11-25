import React, { useState, useEffect } from "react";
import chatAPI from "@/services/api/chatAPI";
import { FaSearch, FaTimes, FaUser, FaComments, FaSpinner } from "react-icons/fa";

export const StaffDirectoryModal = ({ isOpen, onClose, onSelectStaff }) => {
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    fetchStaff("");
  }, [isOpen]);

  const fetchStaff = async (q) => {
    setLoading(true);
    try {
      const res = await chatAPI.getStaffDirectory(q);
      setStaffList(res?.data || []);
    } catch (err) {
      console.error("Failed to load staff directory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    const timeout = setTimeout(() => fetchStaff(val), 300);
    return () => clearTimeout(timeout);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-base-100 shadow-2xl border border-base-300 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 p-4">
          <div className="flex items-center gap-2">
            <FaComments className="text-primary text-lg" />
            <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
              Start Direct Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-base-200">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-3 text-base-content/40 text-xs" />
            <input
              type="text"
              placeholder="Search by name, role, or tag (e.g. @olas)..."
              value={search}
              onChange={handleSearchChange}
              autoFocus
              className="input input-sm w-full pl-8 text-xs bg-base-200/70 border border-base-300 rounded-xl focus:bg-base-100 focus:border-primary"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-base-content/50 gap-2 text-xs">
              <FaSpinner className="animate-spin text-primary" /> Loading staff directory...
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-xs text-base-content/50">
              No staff members found matching "{search}"
            </div>
          ) : (
            staffList.map((staff) => (
              <button
                key={staff.id}
                onClick={() => {
                  onSelectStaff(staff);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-base-200/80 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/20">
                    {staff.name ? staff.name.charAt(0) : <FaUser />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-base-content group-hover:text-primary transition">
                        {staff.name}
                      </span>
                      <span className="text-[10px] text-primary font-mono opacity-80">
                        @{staff.username || (staff.name ? staff.name.toLowerCase().split(' ')[0] : 'user')}
                      </span>
                    </div>
                    <div className="text-[11px] text-base-content/50 capitalize">
                      {staff.role ? staff.role.replace(/-/g, " ") : "Staff"}
                    </div>
                  </div>
                </div>
                <span className="badge badge-sm badge-ghost text-[10px] group-hover:badge-primary transition">
                  Message
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDirectoryModal;
