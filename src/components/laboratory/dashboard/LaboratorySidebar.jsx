import React, { useState } from "react";
import { FaThLarge, FaSignOutAlt } from "react-icons/fa";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { GiHospitalCross } from "react-icons/gi";
import { CiLock, CiLogout } from "react-icons/ci";
import { LuListChecks } from "react-icons/lu";
import { Link, useLocation } from "react-router-dom";
import { LogoutModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";
import HospitalFavicon from "@/assets/images/favicon.svg";
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/common/NotificationBadge';


const LaboratorySidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
    const { incomingCount } = useNotifications();
  

  // Function to generate initials from first and last name
  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "U";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  // Function to format role for display
  const formatRole = (role) => {
    switch (role) {
      case "super-admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "laboratory":
      case "lab-technician":
      case "lab_technician":
        return "Lab Technician";
      case "doctor":
        return "Doctor";
      case "nurse":
        return "Nurse";
      case "frontdesk":
      case "front-desk":
        return "Front Desk";
      case "cashier":
        return "Cashier";
      case "pharmacist":
        return "Pharmacist";
      default:
        return role || "User";
    }
  };

  const isOnIncoming = location.pathname === '/dashboard/laboratory/incoming' || location.pathname.startsWith('/dashboard/laboratory/patient-details');

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/laboratory",
      active: location.pathname === "/dashboard/laboratory",
    },
    {
      icon: GiHospitalCross,
      label: "Incoming",
      path: "/dashboard/laboratory/incoming",
      active: isOnIncoming,
      badge: incomingCount,
    },
    {
      icon: LuListChecks,
      label: "Ordered Lab",
      path: "/dashboard/laboratory/ordered",
      active: location.pathname === "/dashboard/laboratory/ordered",
    },
    // {
    //   icon: RiCalendarScheduleLine,
    //   label: "Incoming scan",
    //   path: "/dashboard/laboratory/incoming-scan",
    //   active: location.pathname === "/dashboard/laboratory/incoming-scan",
    // },
    {
      icon: RiCalendarScheduleLine,
      label: "Inventory&Stocks",
      path: "/dashboard/laboratory/inventory&stocks",
      active: location.pathname === "/dashboard/laboratory/inventory&stocks",
    },
    {
      icon: LuListChecks,
      label: "Lab Results History",
      path: "/dashboard/laboratory/results/history",
      active: location.pathname === "/dashboard/laboratory/results/history",
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active, badge }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-content"
          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
       <NotificationBadge count={badge} />
    </Link>
  );

  return (
    <div className="flex h-full w-64 flex-col border-r border-base-200 bg-base-100 pt-16">
      {/* Logo */}
  

      {/* Navigation Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={item.active}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-1.5 border-t border-base-200">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <CiLock className="w-5 h-5 shrink-0" />
          <span className="text-sm">Change Password</span>
        </Link>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <CiLogout className="w-5 h-5 shrink-0" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-200">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover w-10 h-10 rounded-full"
              />
            ) : (
              <div className="flex justify-center items-center w-10 h-10 text-sm font-semibold rounded-full bg-primary text-primary-content">
                {generateInitials(user?.firstName, user?.lastName)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-base-content">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </p>
            <p className="text-xs text-primary">
              {formatRole(user?.role)}
            </p>
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

export default LaboratorySidebar;
