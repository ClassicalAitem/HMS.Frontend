import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaUsers,
  FaSignOutAlt,
  FaBoxes,
  FaClipboardList,
  FaTicketAlt,
} from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
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

  const isReportsActive =
    location.pathname === "/dashboard/admin/reports" ||
    location.pathname.startsWith("/dashboard/admin/patients") ||
    location.pathname.startsWith("/dashboard/admin/opd") ||
    location.pathname.startsWith("/dashboard/admin/admissions") ||
    location.pathname.startsWith("/dashboard/admin/surgeries") ||
    location.pathname.startsWith("/dashboard/admin/diagnostics") ||
    location.pathname.startsWith("/dashboard/admin/antenatal") ||
    location.pathname.startsWith("/dashboard/admin/phototherapy") ||
    location.pathname.startsWith("/dashboard/admin/hmo-attendance");

  const isStaffActive =
    location.pathname.startsWith("/dashboard/admin/staff") ||
    location.pathname.startsWith("/dashboard/admin/users");

  const isFinanceActive =
    location.pathname.startsWith("/dashboard/admin/finance-supplies") ||
    location.pathname.startsWith("/dashboard/admin/stocks") ||
    location.pathname.startsWith("/dashboard/admin/invoice");

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/admin",
      active: location.pathname === "/dashboard/admin",
    },
    {
      icon: FaClipboardList,
      label: "Hospital Reports & Registry",
      path: "/dashboard/admin/reports",
      active: isReportsActive,
    },
    {
      icon: FaUsers,
      label: "Staff & Rosters",
      path: "/dashboard/admin/staff",
      active: isStaffActive,
    },
    {
      icon: FaBoxes,
      label: "Finance & Supplies",
      path: "/dashboard/admin/finance-supplies",
      active: isFinanceActive,
    },
    {
      icon: FaTicketAlt,
      label: "Support & Tickets",
      path: "/tickets",
      active: location.pathname.startsWith("/tickets"),
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-content shadow-xs"
          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full border-r border-base-200 bg-base-100 pt-16">
      {/* Navigation Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={item.active}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-1.5 border-t border-base-200">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content shadow-xs"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <MdLockOutline className="w-5 h-5 shrink-0" />
          <span>Change Password</span>
        </Link>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm font-semibold text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <FaSignOutAlt className="w-5 h-5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-200">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {generateInitials(user?.firstName, user?.lastName)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-base-content truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : "Administrator"}
            </p>
            <p className="text-xs text-primary font-semibold">{formatRole(user?.role)}</p>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
