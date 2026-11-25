import React, { useState, useEffect } from "react";
import chatAPI from "@/services/api/chatAPI";
import {
  FaTimes,
  FaSearch,
  FaUsers,
  FaUserPlus,
  FaCheck,
  FaSpinner,
  FaUserTie,
  FaUserMd,
} from "react-icons/fa";

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSearchQuery("");
      setSelectedStaff([]);
      setErrorMsg("");
      return;
    }

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const res = await chatAPI.getStaffDirectory(searchQuery);
        setStaffList(res?.data || []);
      } catch (err) {
        console.error("Failed to load staff for group creation:", err);
      } finally {
        setLoadingStaff(false);
      }
    };

    const timer = setTimeout(fetchStaff, 250);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

  const toggleStaffSelection = (staff) => {
    setErrorMsg("");
    setSelectedStaff((prev) => {
      const exists = prev.some((s) => s.id === staff.id);
      if (exists) {
        return prev.filter((s) => s.id !== staff.id);
      }
      return [...prev, staff];
    });
  };

  const handleRemoveChip = (staffId) => {
    setSelectedStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  const handleCreateGroup = async (e) => {
    e?.preventDefault();
    if (!groupName.trim()) {
      setErrorMsg("Please enter a group name");
      return;
    }
    if (selectedStaff.length === 0) {
      setErrorMsg("Please select at least one staff member to add to the group");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await chatAPI.createGroup({
        name: groupName.trim(),
        memberIds: selectedStaff.map((s) => s.id),
      });

      const newConv = res?.data?.conversation;
      if (onGroupCreated && newConv) {
        onGroupCreated(newConv);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle z-50">
      <div className="modal-box relative bg-base-100 max-w-lg rounded-3xl p-6 shadow-2xl border border-base-300">
        <button
          onClick={onClose}
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60 hover:text-base-content"
          title="Close modal"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xl shadow-xs">
            <FaUsers />
          </div>
          <div>
            <h3 className="text-base font-bold text-base-content">Create New Group Chat</h3>
            <p className="text-xs text-base-content/60">
              Set up a collaborative room and add doctors, nurses, or staff
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-2xl text-xs text-error font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-base-content/80 mb-1">
              Group Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ICU Emergency Team, Maternity Shift A..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input input-sm w-full bg-base-200/80 border border-base-300 rounded-xl text-xs focus:bg-base-100 focus:border-secondary"
              autoFocus
            />
          </div>

          {/* Selected Members Chips */}
          {selectedStaff.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-base-content/70 mb-1.5 flex items-center justify-between">
                <span>Selected Members ({selectedStaff.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedStaff([])}
                  className="text-[10px] text-error hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-base-200/40 rounded-2xl border border-base-300/60">
                {selectedStaff.map((staff) => (
                  <span
                    key={staff.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary/15 border border-secondary/30 text-secondary font-medium text-xs shadow-2xs"
                  >
                    <span>{staff.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChip(staff.id)}
                      className="hover:text-error transition"
                    >
                      <FaTimes className="text-[9px]" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Staff Search */}
          <div>
            <label className="block text-xs font-semibold text-base-content/80 mb-1">
              Add Staff Members
            </label>
            <div className="relative flex items-center">
              <FaSearch className="absolute left-3 text-base-content/40 text-xs" />
              <input
                type="text"
                placeholder="Search staff by name, @username, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm w-full pl-8 text-xs bg-base-200/80 border border-base-300 rounded-xl"
              />
            </div>
          </div>

          {/* Staff List */}
          <div className="max-h-52 overflow-y-auto rounded-2xl border border-base-300 divide-y divide-base-200/60 bg-base-100">
            {loadingStaff ? (
              <div className="flex items-center justify-center py-8 text-xs text-base-content/50 gap-2">
                <FaSpinner className="animate-spin text-secondary" /> Loading staff...
              </div>
            ) : staffList.length === 0 ? (
              <div className="text-center py-8 text-xs text-base-content/50">
                No staff found matching query
              </div>
            ) : (
              staffList.map((staff) => {
                const isSelected = selectedStaff.some((s) => s.id === staff.id);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => toggleStaffSelection(staff)}
                    className={`w-full flex items-center justify-between p-2.5 text-left transition hover:bg-base-200/70 group ${
                      isSelected ? "bg-secondary/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase border ${
                          isSelected
                            ? "bg-secondary text-secondary-content border-secondary"
                            : "bg-base-200 text-base-content/70 border-base-300"
                        }`}
                      >
                        {isSelected ? <FaCheck className="text-[10px]" /> : staff.name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-base-content truncate">
                          {staff.name}
                        </div>
                        <div className="text-[10px] text-base-content/50 truncate">
                          {staff.role ? staff.role.replace(/-/g, " ") : "Staff"} • @{staff.username}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="checkbox checkbox-xs checkbox-secondary rounded-md"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-sm btn-ghost rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || selectedStaff.length === 0 || submitting}
              className="btn btn-sm btn-secondary rounded-xl text-xs gap-1.5 px-4 shadow-sm"
            >
              {submitting ? (
                <FaSpinner className="animate-spin text-xs" />
              ) : (
                <>
                  <FaUserPlus className="text-xs" /> Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
