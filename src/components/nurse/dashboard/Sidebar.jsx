/* eslint-disable no-unused-vars */
import React from "react";
import { FaThLarge,  FaSignOutAlt } from "react-icons/fa";
import { TbCalendarPlus } from "react-icons/tb";
import { GrTask } from "react-icons/gr";
import { FiUser } from "react-icons/fi";
import { BsArrowDownLeft } from "react-icons/bs";
import { MdLockOutline } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import missFolake from "@/assets/images/missFolake.jpg";

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
      icon: BsArrowDownLeft,
      label: "Incoming",
      path: "/dashboard/nurse/incoming",
      active: location.pathname === "/incoming",
    },
    {
      icon: FiUser,
      label: "Patients",
      path: "/dashboard/nurse/patient",
      active: location.pathname === "/patients",
    },
    {
      icon: GrTask,
      label: "Assigned Task",
      path: "/dashboard/nurse/assignedTask",
      active: location.pathname === "/appointments",
    },
    {
      icon: TbCalendarPlus,
      label: "Appointments",
      path: "/dashboard/nurse/appointments",
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
    <div className="flex flex-col w-64 h-full bg-base-100 border-r-2 border-neutral/20">
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
          className="flex items-center px-4 py-3 space-x-3 text-sm font-medium rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <MdLockOutline className="w-5 h-5" />
          <span>Change Password</span>
        </Link>

        <button className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content">
          <FaSignOutAlt className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300 ">
        <div className="flex items-center space-x-3 h-[58px]">
          <div className="flex justify-center items-center w-10 h-10 rounded-full">
            <img
              src={missFolake}
              alt="Folake Flakes"
              className="object-cover w-10 h-10 rounded-full"
            />
          </div>
          <div className="flex-1">
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
