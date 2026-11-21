import React, { useEffect, useMemo, useState } from "react";
import { FiUser } from "react-icons/fi";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { FaEye } from "react-icons/fa";
import icon from "../../../assets/images/doctorIcon.png";
import { usersAPI } from "../../../services/api/usersAPI";
import toast from "react-hot-toast";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";
import { StaffProfileModal } from "@/components/modals";

const StaffList = ({ refreshKey = 0 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);

  const roleLabels = useMemo(() => ({
    "doctor": "Doctors",
    "nurse": "Nurses",
    "front-desk": "Frontdesk",
    "cashier": "Cashiers",
    "pharmacist": "Pharmacists",
  }), []);

  const allowedRoles = useMemo(
    () => ["doctor", "nurse", "front-desk", "cashier", "pharmacist"],
    []
  );

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getUsers();
        const all = res?.data?.data || [];
        const staffOnly = all.filter((u) => allowedRoles.includes(u.accountType));
        setUsers(staffOnly);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load staff");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey, allowedRoles]);

  const filtered = useMemo(() => {
    const byRole = roleFilter === "all" ? users : users.filter((u) => u.accountType === roleFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byRole;
    return byRole.filter((u) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.accountType || "").toLowerCase();
      const address = (u.address || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        address.includes(q)
      );
    });
  }, [users, roleFilter, searchQuery]);

  return (
    <div className=" py-4 rounded-[20px] shadow mt-2">
      <div className="w-full flex gap-2 items-center">
        {/* Search Input */}
        <div className="mt-4 w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, role, or address"
            className="block w-full py-[10px] px-[12px] rounded-[6px] border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div
          className={`hidden flex gap-2 justify-center text-base-content/70 items-center w-[155px] h-[32px] bg-base-200 cursor-pointer ${roleFilter === 'all' ? 'ring-1 ring-primary' : ''}`}
          onClick={() => { setRoleFilter('all'); setIsRoleMenuOpen(false); }}
        >
          <FiUser size={20} color="#AEAAAE" />
          <p>All Staff</p>
          <button>
            <MdOutlineKeyboardArrowDown size={18} />
          </button>
        </div>

        <div className="relative flex gap-2 justify-center text-base-content/70 items-center w-[157px] h-[32px] bg-base-200">
          <img src={icon} alt="" />
          <p>{roleFilter === 'all' ? 'All Staff' : (roleLabels[roleFilter] || 'All Staff')}</p>
          <button onClick={() => setIsRoleMenuOpen((v) => !v)}>
            <MdOutlineKeyboardArrowDown size={18} />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-[180px] bg-base-100 border border-base-300 rounded-md shadow-md z-10">
              <button
                className={`block w-full text-left px-3 py-2 hover:bg-base-200 ${roleFilter === 'all' ? 'bg-primary/10' : ''}`}
                onClick={() => { setRoleFilter('all'); setIsRoleMenuOpen(false); }}
              >
                All Staff
              </button>
              <button
                className={`block w-full text-left px-3 py-2 hover:bg-base-200 ${roleFilter === 'doctor' ? 'bg-primary/10' : ''}`}
                onClick={() => { setRoleFilter('doctor'); setIsRoleMenuOpen(false); }}
              >
                Doctors
              </button>
              <button
                className={`block w-full text-left px-3 py-2 hover:bg-base-200 ${roleFilter === 'nurse' ? 'bg-primary/10' : ''}`}
                onClick={() => { setRoleFilter('nurse'); setIsRoleMenuOpen(false); }}
              >
                Nurses
              </button>
              <button
                className={`block w-full text-left px-3 py-2 hover:bg-base-200 ${roleFilter === 'front-desk' ? 'bg-primary/10' : ''}`}
                onClick={() => { setRoleFilter('front-desk'); setIsRoleMenuOpen(false); }}
              >
                Frontdesk
              </button>
              <button
                className={`block w-full text-left px-3 py-2 hover:bg-base-200 ${roleFilter === 'cashier' ? 'bg-primary/10' : ''}`}
                onClick={() => { setRoleFilter('cashier'); setIsRoleMenuOpen(false); }}
              >
                Cashiers
              </button>
              <button
                className={`block w-full text-left px-3 py-2 hover:bg-base-200 ${roleFilter === 'pharmacist' ? 'bg-primary/10' : ''}`}
                onClick={() => { setRoleFilter('pharmacist'); setIsRoleMenuOpen(false); }}
              >
                Pharmacists
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-center text-base-content/70  items-center w-[157px] h-[32px] bg-base-200">
          <SlCalender />
          <p>{formatNigeriaDate()}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-5 shadow max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh] overflow-y-auto p-1">
        {loading && (
          <div className="w-full py-12 flex justify-center">
            <KolakLoader text="Loading staff directory..." />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="w-full text-center py-8 text-base-content/70">No staff found</div>
        )}
        {!loading && filtered.map((staffInfo, index) => {
          return (
            <div
              key={index}
              onClick={() => setSelectedStaff(staffInfo)}
              className="w-full border border-base-300 rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer group shadow-xs"
              title="Click to view full staff profile"
            >
              <div className="flex flex-col md:flex-row items-center justify-between rounded-[10px] bg-base-100 py-5 px-6 sm:px-10 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-1 border-2 border-primary rounded-2xl shrink-0">
                    <div className="w-16 h-16 rounded-xl border-2 border-primary flex items-center justify-center bg-primary text-white text-xl font-bold">
                      {staffInfo.firstName?.[0] || "S"}{staffInfo.lastName?.[0] || ""}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-primary group-hover:underline">
                      {`${staffInfo.firstName || ""} ${staffInfo.lastName || ""}`}
                    </h3>
                    <p className="text-xs text-base-content/60 capitalize mt-0.5">
                      {staffInfo.accountType?.replace(/-/g, ' ') || "Staff"}
                    </p>
                    <span className="badge badge-sm badge-ghost font-mono text-[10px] mt-1">
                      ID: {staffInfo.id?.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs text-base-content/80 flex-1 max-w-xl">
                  <div>
                    <span className="text-base-content/50 block font-medium">Email:</span>
                    <span className="font-semibold truncate block">{staffInfo.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Phone:</span>
                    <span className="font-semibold">{staffInfo.phoneNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Shift:</span>
                    <span className="font-semibold capitalize">{staffInfo.shift || "Flexible"}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Status:</span>
                    <span className={`badge badge-xs font-semibold ${staffInfo.isDisabled ? 'badge-error' : 'badge-success text-white'}`}>
                      {staffInfo.isDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Leave:</span>
                    <span className={`badge badge-xs font-semibold ${staffInfo.isOnLeave ? 'badge-warning' : 'badge-ghost'}`}>
                      {staffInfo.isOnLeave ? 'On Leave' : 'On Duty'}
                    </span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block font-medium">Profile:</span>
                    <span className={`badge badge-xs font-semibold ${staffInfo.isProfileCompleted ? 'badge-success text-white' : 'badge-warning'}`}>
                      {staffInfo.isProfileCompleted ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaff(staffInfo);
                    }}
                    className="btn btn-sm btn-outline btn-primary gap-1.5 font-semibold text-xs"
                  >
                    <FaEye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Profile Modal */}
      <StaffProfileModal
        isOpen={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        user={selectedStaff}
      />
    </div>
  );
};

export default StaffList;