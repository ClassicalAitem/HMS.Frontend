/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { FaThLarge, FaUsers, FaUserPlus, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';
import { SlCalender } from "react-icons/sl";
import { MdOutlineDashboard, MdFormatListBulletedAdd } from "react-icons/md";
import { GoPerson } from "react-icons/go";
import { CiLock, CiLogout } from "react-icons/ci";
import { Link, useLocation } from 'react-router-dom';
import { LogoutModal } from '@/components/modals';
import { useAppSelector } from '@/store/hooks';
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
      case 'nurse':
        return 'Nurse';
      case 'frontdesk':
      case 'front-desk':
        return 'Front Desk';
      case 'cashier':
        return 'Cashier';
      default:
        return role || 'User';
    }
  };


  const menuItems = [
    {
      icon: MdOutlineDashboard,
      label: 'Dashboard',
      path: '/frontdesk/dashboard',
      active: location.pathname === '/frontdesk/dashboard'
    },
    {
      icon: GoPerson,
      label: 'Patients',
      path: '/frontdesk/patients',
      active: location.pathname.startsWith('/frontdesk/patients')
    },
    {
      icon: MdFormatListBulletedAdd,
      label: 'Registration',
      path: '/frontdesk/registration',
      active: location.pathname === '/frontdesk/registration'
    },
    {
      icon: SlCalender,
      label: 'Appointments',
      path: '/frontdesk/appointments',
      active: location.pathname === '/frontdesk/appointments'
    }
  ];

  const MenuItem = ({ icon: Icon, label, path, active }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center space-x-3 px-4 2xl:py-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-primary text-primary-content'
          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
      }`}
    >
      <Icon className="w-4 h-4 2xl:w-5 2xl:h-5" />
      <span className="text-xs 2xl:text-sm">{label}</span>
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full border-r-2 bg-base-100 border-neutral/20">
      {/* Logo */}
      <div className="p-3 border-b-4 border-neutral/20 lg:p-1 2xl:p-3">
        <div className="flex justify-center items-center">
          <img src="/src/assets/images/logo.png" alt="Kolak" className="hidden w-auto h-10" />

          {/* Kolak logo adaptive*/}
          <div className="flex items-center space-x-2">
            <div className="">
              <img src={HospitalFavicon} alt="Kolak logo" className="w-auto h-10 lg:h-8 2xl:h-12" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold lg:text-md 2xl:text-3xl">Kolak</span>
              <span className="text-sm text-base-content/70 lg:text-xs 2xl:text-base">- Hospital -</span>
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
            location.pathname === '/change-password'
              ? 'bg-primary text-primary-content'
              : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
          }`}
        >
          <CiLock className="w-4 h-4 2xl:w-5 2xl:h-5" />
          <span className="text-xs 2xl:text-sm">Change Password</span>
        </Link>

        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <CiLogout  className="w-4 h-4 2xl:w-5 2xl:h-5" />
          <span className="text-xs 2xl:text-sm">Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center space-x-3">
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

export default Sidebar;
