/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { SlCalender } from "react-icons/sl";
import { IoReceiptOutline } from "react-icons/io5";
import { MdOutlineDashboard, MdFormatListBulletedAdd } from "react-icons/md";
import { GoPerson } from "react-icons/go";
import { CiLock, CiLogout } from "react-icons/ci";
import { Link, useLocation } from 'react-router-dom';
import { LogoutModal } from '@/components/modals';
import { useAppSelector } from '@/store/hooks';
import HospitalFavicon from "@/assets/images/favicon.svg"
import { FaClipboardCheck, FaThLarge, FaBed } from 'react-icons/fa';
import { FaSuitcaseMedical, FaVials } from 'react-icons/fa6';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/common/NotificationBadge';

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { incomingCount, labReadyCount } = useNotifications();

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
      case 'hmo':
        return 'Hmo';
      default:
        return role || 'User';
    }
  };

  const isOnIncoming = location.pathname.startsWith('/dashboard/hmo/incoming');

  const menuItems = [
    { icon: FaThLarge, label: "Dashboard", path: "/dashboard/hmo",  active: location.pathname === '/dashboard/hmo' },
    { icon: FaSuitcaseMedical, label: "Incoming", path: "/dashboard/hmo/incoming", active: isOnIncoming, badge: incomingCount },
    { icon: FaBed, label: "Admissions", path: '/dashboard/hmo/admissions', active: location.pathname.startsWith('/dashboard/hmo/admissions') },
    { icon: FaClipboardCheck, label: "Hmo Patients", path: '/dashboard/hmo/patients', active: location.pathname === '/dashboard/hmo/patients' },
    { icon: FaVials, label: "Lab Results", path: '/dashboard/hmo/lab-results', active: location.pathname.startsWith('/dashboard/hmo/lab-results'), badge: labReadyCount }
  ];
  const MenuItem = ({ icon: Icon, label, path, active, badge }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-primary text-primary-content'
          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
      <NotificationBadge count={badge} />
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full bg-base-100 border-r border-base-200 pt-16">
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
            location.pathname === '/change-password'
              ? 'bg-primary text-primary-content'
              : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
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