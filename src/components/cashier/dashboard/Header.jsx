import React, { useState } from "react";
import { FaSearch, FaBell, FaSync, FaUserPlus, FaBars } from "react-icons/fa";
import { SlRefresh } from "react-icons/sl";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { BsBell } from "react-icons/bs";

const Header = ({ onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddPatient = () => {
    // Handle add patient action
    console.log("Add patient clicked");
  };

  const handleRefresh = () => {
    // Refresh the page
    window.location.reload();
  };

  const handleNotifications = () => {
    // Handle notifications
    console.log("Notifications clicked");
  };

  return (
    <header className="px-3 py-2 w-[-webkit-fill-available] border-b sm:px-6 lg:px-4 2xl:px-6 2xl:py-4 bg-base-100 border-base-300">
      <div className="flex justify-between items-center">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-circle lg:hidden"
          title="Toggle Menu"
        >
          <FaBars className="w-4 h-4" />
        </button>

        {/* Search Bar */}
        <div className="flex flex-1 justify-center lg:w-full">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 z-10 w-3 h-3 transform -translate-y-1/2 text-base-content/40 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search Patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full border-b input focus:input-primary input-xs sm:input-sm sm:pl-10 2xl:input-md"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 2xl:space-x-4">
          {/* Theme Switcher */}
          <ThemeSwitcher className="2xl:w-5 2xl:h-5" />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn btn-ghost btn-circle btn-xs sm:btn-sm lg:btn-md"
            title="Refresh"
          >
            <SlRefresh className="w-3 h-3 sm:w-4 sm:h-4 2xl:w-5 2xl:h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className="relative btn btn-ghost btn-circle btn-xs sm:btn-sm lg:btn-md"
            title="Notifications"
          >
            <BsBell className="w-3 h-3 sm:w-4 sm:h-4 2xl:w-5 2xl:h-5" />
            {/* Notification badge */}
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full sm:w-2.5 sm:h-2.5 2xl:w-3 2xl:h-3 bg-error"></span>
          </button>

          {/* Add Patient Button - Hidden on mobile, visible on larger screens */}
          <button 
            onClick={handleAddPatient} 
            className="hidden btn btn-primary btn-xs sm:flex sm:btn-sm lg:btn-base 2xl:btn-md"
          >
            <FaUserPlus className="w-3 h-3 sm:w-3 sm:h-3 2xl:w-4 2xl:h-4" />
            <span className="hidden text-xs sm:inline lg:text-xs 2xl:text-sm">Add Patient</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
