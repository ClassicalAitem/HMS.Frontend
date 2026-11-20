import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaUsers,
  FaUserMd,
  FaUserNurse,
  FaIdBadge,
  FaSignOutAlt,
  FaUserFriends,
} from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { LogoutModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "HR";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial || "HR";
  };

  const formatRole = (role) => {
    switch (role) {
      case "human-resource":
      case "hr":
        return "Human Resources";
      case "super-admin":
        return "Super Admin";
      default:
        return role || "HR Officer";
    }
  };

  const menuItems = [
    {
      icon: FaThLarge,
      label: "HR Dashboard",
      path: "/dashboard/hr",
      active: location.pathname === "/dashboard/hr",
    },
    {
      icon: FaUserMd,
      label: "Doctor Queue",
      path: "/dashboard/hr/doctor-queue",
      active: location.pathname === "/dashboard/hr/doctor-queue",
    },
    {
      icon: FaUserNurse,
      label: "Nurse / Vitals Queue",
      path: "/dashboard/hr/nurse-queue",
      active: location.pathname === "/dashboard/hr/nurse-queue",
    },
    {
      icon: FaUserFriends,
      label: "Patient Directory",
      path: "/dashboard/hr/patients",
      active: location.pathname.startsWith("/dashboard/hr/patients"),
    },
    {
      icon: FaUsers,
      label: "Staff & Leave Management",
      path: "/dashboard/hr/staff",
      active: location.pathname.startsWith("/dashboard/hr/staff"),
    },
    {
      icon: FaIdBadge,
      label: "Staff Attendance Logs",
      path: "/dashboard/hr/attendance",
      active: location.pathname === "/dashboard/hr/attendance",
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
    <div data-sidebar="true" className="flex flex-col w-64 h-full border-r border-base-200 bg-base-100 pt-16">
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
      <div className="p-3 border-t border-base-200">
        <Link
          to="/profile"
          onClick={onCloseSidebar}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200/80 transition-colors group cursor-pointer"
          title="View profile"
        >
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10 shrink-0 group-hover:scale-105 transition-transform">
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
            <p className="text-sm font-bold text-base-content truncate group-hover:text-primary transition-colors">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : "HR Officer"}
            </p>
            <p className="text-xs text-primary font-semibold">{formatRole(user?.role || user?.accountType)}</p>
          </div>
        </Link>
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
