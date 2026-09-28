import React from "react";
import { TbCalendarPlus } from "react-icons/tb";
import { TiDocumentText } from "react-icons/ti";
import { MdOutlineInventory2, MdOutlineDashboard, MdLockOutline, MdStorage } from "react-icons/md";
import { FaThLarge, FaSignOutAlt } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { LogoutModal } from "@/components/modals";
import HospitalFavicon from "@/assets/images/favicon.svg";
import missFolake from "@/assets/images/missFolake.jpg";

const SideBar = () => {
  const location = useLocation();

  const menuItems = [
    {
      icon: MdOutlineDashboard,
      label: "Dashboard",
      path: "/dashboard/admin",
      active:
        location.pathname.startsWith("/dashboard/admin") &&
        location.pathname === "/dashboard/admin",
    },
    {
      icon: TbCalendarPlus,
      label: "Schedule",
      path: "/dashboard/admin/schedule",
      active: location.pathname.startsWith("/dashboard/admin/schedule"),
    },
    {
      icon: MdStorage,
      label: "Stocks",
      path: "/dashboard/admin/stocks",
      active: location.pathname.startsWith("/dashboard/admin/stocks"),
    },
    {
      icon: TiDocumentText,
      label: "Invoice",
      path: "/dashboard/admin/invoice",
      active: location.pathname.startsWith("/dashboard/admin/invoice"),
    },
    {
      icon: FiUser,
      label: "Users",
      path: "/dashboard/admin/users",
      active: location.pathname.startsWith("/dashboard/admin/users"),
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
    <div className="flex flex-col w-64 h-full border-r-2 bg-base-100 border-neutral/20 pt-16">
      {/* Logo */}
      <div className="hidden p-3 border-b-4 border-neutral/20 lg:p-1 2xl:p-3">
        <div className="flex justify-center items-center">
        

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 lg:py-12 overflow-y-auto min-h-0">
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
      </div>
    </div>
  );
};

export default SideBar;
