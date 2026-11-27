import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaUsers,
  FaSignOutAlt,
  FaBoxes,
  FaUserInjured,
  FaBed,
  FaProcedures,
  FaVial,
  FaIdCard,
  FaStethoscope,
} from "react-icons/fa";
import { MdLockOutline, MdPregnantWoman } from "react-icons/md";
import { LogoutModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "AD";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial || "AD";
  };

  const formatRole = (role) => {
    switch (role) {
      case "admin":
        return "Hospital Administrator";
      case "super-admin":
        return "Super Admin";
      default:
        return role || "Administrator";
    }
  };

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/admin",
      active: location.pathname === "/dashboard/admin",
    },
    {
      icon: FaUsers,
      label: "Registered Patients",
      path: "/dashboard/admin/patients",
      active: location.pathname.startsWith("/dashboard/admin/patients"),
    },
    {
      icon: FaUserInjured,
      label: "OPD Patients",
      path: "/dashboard/admin/opd",
      active: location.pathname.startsWith("/dashboard/admin/opd"),
    },
    {
      icon: FaBed,
      label: "Admissions",
      path: "/dashboard/admin/admissions",
      active: location.pathname.startsWith("/dashboard/admin/admissions"),
    },
    {
      icon: FaProcedures,
      label: "Surgeries",
      path: "/dashboard/admin/surgeries",
      active: location.pathname.startsWith("/dashboard/admin/surgeries"),
    },
    {
      icon: FaVial,
      label: "Diagnostics & Scans",
      path: "/dashboard/admin/diagnostics",
      active: location.pathname.startsWith("/dashboard/admin/diagnostics"),
    },
    {
      icon: MdPregnantWoman,
      label: "Antenatal & Neonatal",
      path: "/dashboard/admin/antenatal",
      active:
        location.pathname.startsWith("/dashboard/admin/antenatal") ||
        location.pathname.startsWith("/dashboard/admin/phototherapy"),
    },
    {
      icon: FaIdCard,
      label: "HMO Attendance",
      path: "/dashboard/admin/hmo-attendance",
      active: location.pathname.startsWith("/dashboard/admin/hmo-attendance"),
    },
    {
      icon: FaStethoscope,
      label: "Staff & Rosters",
      path: "/dashboard/admin/staff",
      active:
        location.pathname.startsWith("/dashboard/admin/staff") ||
        location.pathname.startsWith("/dashboard/admin/users"),
    },
    {
      icon: FaBoxes,
      label: "Supplies & Inventory",
      path: "/dashboard/admin/supplies",
      active:
        location.pathname.startsWith("/dashboard/admin/supplies") ||
        location.pathname.startsWith("/dashboard/admin/stocks"),
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-content shadow-xs"
          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <div data-sidebar="true" className="flex flex-col w-64 h-full border-r border-base-200 bg-base-100 pt-16">
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <MenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={item.active}
          />
        ))}
      </nav>

      <div className="p-3 space-y-1.5 border-t border-base-200">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <MdLockOutline className="w-4 h-4 shrink-0" />
          <span>Change Password</span>
        </Link>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg text-error hover:bg-error/10 transition-colors"
        >
          <FaSignOutAlt className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-base-200/60">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs shrink-0">
            {generateInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-base-content truncate">
              {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Administrator"}
            </p>
            <p className="text-[11px] text-base-content/60 truncate">
              {formatRole(user?.role || user?.accountType)}
            </p>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
