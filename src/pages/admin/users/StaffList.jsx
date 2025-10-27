import React, { useEffect, useMemo, useState } from "react";
import { FiUser } from "react-icons/fi";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import icon from "../../../assets/images/doctorIcon.png";
import { usersAPI } from "../../../services/api/usersAPI";
import toast from "react-hot-toast";

const StaffList = ({ refreshKey = 0 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

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
    if (roleFilter === "all") return users;
    return users.filter((u) => u.accountType === roleFilter);
  }, [users, roleFilter]);

  return (
    <div className=" p-8 rounded-[20px] shadow mt-8">
      <div className="w-[483px] flex gap-2">
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
          <p>{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-5 shadow ">
        {loading && (
          <div className="w-full text-center py-8 text-base-content/70">Loading staff...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="w-full text-center py-8 text-base-content/70">No staff found</div>
        )}
        {!loading && filtered.map((staffInfo, index) => {
          return (
            <div key={index} className="w-full">
              <div className="flex items-center justify-between rounded-[10px] bg-base-100 h-[258px] px-20 bolder bolder-black bolder-2">
                <div className="p-1 border-4 border-primary rounded-full">
                  <div className="w-[90px] h-[90px] rounded-full border-[3px] border-primary flex items-center justify-center bg-primary text-white text-xl font-semibold">
                    {staffInfo.firstName?.[0] || "S"}
                  </div>
                </div>

                <div className="w-[222px]">
                  <div className="flex gap-5">
                    <p>Name:</p>
                    <span>{`${staffInfo.firstName || ""} ${staffInfo.lastName || ""}`}</span>
                  </div>

                  <div className="flex gap-9">
                    <p>Role:</p>
                    <span>{staffInfo.accountType?.replace(/\b\w/g, c => c.toUpperCase()).replace('-', ' ') || "—"}</span>
                  </div>

                  <div className="flex gap-3">
                    <p>Gender:</p>
                    <span>{staffInfo.gender || "—"}</span>
                  </div>

                  <div className="flex gap-9">
                    <p>DOB:</p>
                    <span>{staffInfo.dateOfBirth ? new Date(staffInfo.dateOfBirth).toLocaleDateString() : "—"}</span>
                  </div>
                </div>

                <div className="w-[512px]">
                  <div className="flex gap-9">
                    <p>Address:</p>
                    <span>{staffInfo.address || "—"}</span>
                  </div>
                  <div className="flex gap-5">
                    <p>Email Address:</p>
                    <span>{staffInfo.email || "—"}</span>
                  </div>
                  <div className="flex gap-6">
                    <p>Marital Status:</p>
                    <span>{staffInfo.maritalStatus || "—"}</span>
                  </div>
                  <div className="flex gap-5">
                    <p>State Of Origin:</p>
                    <span>{staffInfo.stateOfOrigin || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffList;