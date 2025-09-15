/* eslint-disable no-unused-vars */
import React from 'react';
import { FaThLarge, FaUsers, FaUserPlus, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';
import { SlCalender } from "react-icons/sl";
import { MdOutlineDashboard, MdFormatListBulletedAdd } from "react-icons/md";
import { GoPerson } from "react-icons/go";
import { CiLock, CiLogout } from "react-icons/ci";
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      icon: MdOutlineDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      icon: GoPerson,
      label: 'Patients',
      path: '/patients',
      active: location.pathname === '/patients'
    },
    {
      icon: MdFormatListBulletedAdd,
      label: 'Registration',
      path: '/registration',
      active: location.pathname === '/registration'
    },
    {
      icon: SlCalender,
      label: 'Appointments',
      path: '/appointments',
      active: location.pathname === '/appointments'
    }
  ];

  const MenuItem = ({ icon: Icon, label, path, active }) => (
    <Link
      to={path}
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
    <div className="flex flex-col pb-8 w-52 border-r-2 2xl:w-64 bg-base-100 border-neutral/20">
      {/* Logo */}
      <div className="p-1 border-b-4 2xl:p-3 border-neutral/20">
        <div className="flex justify-center items-center">
          <img src="/src/assets/images/logo.png" alt="Kolak" className="hidden w-auto h-10" />

          {/* Kolak logo adaptive*/}
          <div className="flex items-center space-x-2">
            <div className="">
              <img src="/src/assets/images/favicon.svg" alt="Kolak logo" className="w-auto h-8 2xl:h-12" />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-md 2xl:text-3xl">Kolak</span>
              <span className="text-xs text-base-content/70 2xl:text-base">- Hospital -</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-12 space-y-2">
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
          className="flex items-center px-4 py-3 space-x-3 text-sm font-medium rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <CiLock className="w-4 h-4 2xl:w-5 2xl:h-5" />
          <span className="text-xs 2xl:text-sm">Change Password</span>
        </Link>

        <button className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content">
          <CiLogout  className="w-4 h-4 2xl:w-5 2xl:h-5" />
          <span className="text-xs 2xl:text-sm">Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center space-x-3">
          <div className="flex justify-center items-center w-10 h-10 bg-green-100 rounded-full">
            <img
              src="https://images.unsplash.com/photo-1707303051965-bb814c443aa1?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Folake Flakes"
              className="object-cover w-10 h-10 rounded-full"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-base-content">Folake Flakes</p>
            <p className="text-xs text-primary">FrontDesk</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
