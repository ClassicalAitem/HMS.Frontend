/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { FaThLarge,  FaSignOutAlt } from "react-icons/fa";
import { TbCalendarPlus } from "react-icons/tb";
import { GrTask } from "react-icons/gr";
import { FiUser } from "react-icons/fi";
import { BsArrowDownLeft } from "react-icons/bs";
import { MdLockOutline } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import missFolake from "@/assets/images/missFolake.jpg";
import { LogoutModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";
import HospitalFavicon from "@/assets/images/favicon.svg"

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  // Function to generate initials from first and last name
  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'U';
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Function to format role for display
  const formatRole = (role) => {
    switch (role) {
      case 'super-admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'doctor':
        return 'Doctor';
      case 'surgeon':
        return 'Surgeon';
      case 'frontdesk':
      case 'front-desk':
        return 'Front Desk';
      case 'cashier':
        return 'Cashier';
      default:
        return role || 'User';
    }
  };

  const fromIncoming = location.state && location.state.from === 'incoming';

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/surgeon",
      active: location.pathname === "/dashboard/surgeon",
    },
    {
      icon: BsArrowDownLeft,
      label: "Incoming",
      path: "/dashboard/surgeon/incoming",
      active: fromIncoming || location.pathname.startsWith("/dashboard/surgeon/incoming"),
    },
    {
      icon: GrTask,
      label: "Assigned Task",
      path: "/dashboard/surgeon/assignedTask",
      active: location.pathname.startsWith("/dashboard/surgeon/assignedTask"),
    },
    {
      icon: TbCalendarPlus,
      label: "Appointments",
      path: "/dashboard/surgeon/appointments",
      active: location.pathname.startsWith("/dashboard/surgeon/appointments"),
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-content"
          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full border-r-2 bg-base-100 border-neutral/20">
      <div className="p-6 border-b border-base-300">
        <div className="flex justify-center items-center">
          <img
            src="/src/assets/images/logo.png"
            alt="Kolak"
            className="hidden w-auto h-10"
          />

          {/* Kolak logo adaptive*/}
          <div className="flex items-center space-x-2">
            <div className="">
              <img
                src={HospitalFavicon}
                alt="Kolak logo"
                className="w-auto h-12"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">Kolak</span>
              <span className="text-sm text-base-content/70">- Hospital -</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 lg:py-12">
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
      <div className="p-4 space-y-2 border-t border-base-300">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center px-4 py-3 space-x-3 text-sm font-medium rounded-lg transition-colors ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <MdLockOutline className="w-5 h-5" />
          <span>Change Password</span>
        </Link>

        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center space-x-3 h-[58px]">
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
          <div className="flex-1">
            <p className="text-sm font-medium text-base-content">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-primary">{formatRole(user?.role)}</p>
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
