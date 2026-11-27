import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaMoneyBillWave,
  FaReceipt,
  FaBoxes,
  FaBook,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { LogoutModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "AC";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial || "AC";
  };

  const formatRole = (role) => {
    switch ((role || "").toLowerCase()) {
      case "accountant":
        return "Accountant";
      case "account-officer":
        return "Account Officer";
      case "super-admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      default:
        return role || "Accountant";
    }
  };

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/accountant/dashboard",
      active: location.pathname === "/accountant/dashboard",
    },
    {
      icon: FaMoneyBillWave,
      label: "Revenue & Channels",
      path: "/accountant/revenue",
      active: location.pathname === "/accountant/revenue",
    },
    {
      icon: FaReceipt,
      label: "Expenses",
      path: "/accountant/expenses",
      active: location.pathname === "/accountant/expenses",
    },
    {
      icon: FaBook,
      label: "Account Ledger",
      path: "/accountant/ledger",
      active: location.pathname === "/accountant/ledger",
    },
    {
      icon: FaUsers,
      label: "Patients & Dependants",
      path: "/accountant/patients",
      active: location.pathname.startsWith("/accountant/patients"),
    },
    {
      icon: FaBoxes,
      label: "Drugs & Consumables",
      path: "/accountant/inventory-balance",
      active: location.pathname === "/accountant/inventory-balance",
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
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <div data-sidebar="true" className="flex flex-col w-64 h-full border-r border-base-200 bg-base-100 pt-16">
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5">
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
          className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <MdLockOutline className="w-5 h-5 shrink-0" />
          <span>Change Password</span>
        </Link>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg text-error hover:bg-error/10 transition-colors"
        >
          <FaSignOutAlt className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-base-200/60">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs shrink-0">
            {generateInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-base-content truncate">
              {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Accountant"}
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
