/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { MdOutlineDashboard, MdPeople, MdBusiness, MdAssessment, MdSettings, MdSupervisorAccount } from "react-icons/md";
import { Link, useLocation } from 'react-router-dom';
import { LogoutModal } from '@/components/modals';

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuItems = [
    {
      icon: MdOutlineDashboard,
      label: 'Dashboard',
      path: '/dashboard/admin',
      active: location.pathname === '/dashboard/admin'
    },
    {
      icon: MdPeople,
      label: 'User Management',
      path: '/admin/users',
      active: location.pathname === '/admin/users'
    },
    {
      icon: MdBusiness,
      label: 'Departments',
      path: '/admin/departments',
      active: location.pathname === '/admin/departments'
    },
    {
      icon: MdAssessment,
      label: 'Reports',
      path: '/admin/reports',
      active: location.pathname === '/admin/reports'
    },
    {
      icon: MdSettings,
      label: 'System Settings',
      path: '/admin/settings',
      active: location.pathname === '/admin/settings'
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
    <div className="flex flex-col h-full w-64 bg-base-100 border-r-2 border-neutral/20">
      {/* Logo */}
      <div className="p-3 border-b-4 border-neutral/20 lg:p-1 2xl:p-3">
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <div className="">
              <img src="/src/assets/images/favicon.svg" alt="Kolak logo" className="w-auto h-10 lg:h-8 2xl:h-12" />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg lg:text-md 2xl:text-3xl">Kolak</span>
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
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs 2xl:text-sm">Change Password</span>
        </Link>

        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs 2xl:text-sm">Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center space-x-3">
          <div className="flex justify-center items-center w-10 h-10 bg-purple-100 rounded-full">
            <img
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Jennifer Martinez"
              className="object-cover w-10 h-10 rounded-full"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-base-content">Jennifer Martinez</p>
            <p className="text-xs text-primary">Administration</p>
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
