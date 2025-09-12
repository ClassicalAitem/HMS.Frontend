import React from "react";
import { FaThLarge, FaUsers, FaSignOutAlt } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";
import { MdLockOutline } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import missFolake from "../../../assets/images/missFolake.jpg"

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/nurse",
      active: location.pathname === "/dashboard",
    },
    {
      icon: FaUsers,
      label: "Patients Vitals",
      path: "/patients/nurse",
      active: location.pathname === "/patients",
    },
    {
      icon: IoMenu,
      label: "Assigned Task",
      path: "/appointments/nurse",
      active: location.pathname === "/appointments",
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active }) => (
    <Link
      to={path}
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
    <div className="w-64 bg-base-100 border-r border-base-300 flex flex-col">
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center justify-center">
          <img
            src="/src/assets/images/logo.png"
            alt="Kolak"
            className="w-auto h-10 hidden"
          />

          {/* Kolak logo adaptive*/}
          <div className="flex items-center space-x-2">
            <div className="">
              <img
                src="/src/assets/images/favicon.svg"
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
      <nav className="flex-1 px-4 py-6 space-y-2">
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
      <div className="p-4 border-t border-base-300 space-y-2">
        <Link
          to="/change-password"
          className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content rounded-lg transition-colors"
        >
          <MdLockOutline className="w-5 h-5" />
          <span>Change Password</span>
        </Link>

        <button className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content rounded-lg transition-colors w-full text-left">
          <FaSignOutAlt className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300 ">
        <div className="flex items-center space-x-3 bg-[#EAFFF3] h-[58px]">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <img
              src={missFolake}
              alt="Folake Flakes"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 ">
            <p className="text-sm font-medium text-base-content">
              Folake Flakes
            </p>
            <p className="text-xs text-primary">FrontDesk</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
