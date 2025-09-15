import React, { useState } from "react";
import { FaSearch, FaBell, FaSync, FaUserPlus } from "react-icons/fa";
import { SlRefresh } from "react-icons/sl";
import ThemeSwitcher from "./ThemeSwitcher";
import { BsBell } from "react-icons/bs";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddPatient = () => {
    // Handle add patient action
    console.log("Add patient clicked");
  };

  const handleRefresh = () => {
    // Handle refresh action
    console.log("Refresh clicked");
  };

  const handleNotifications = () => {
    // Handle notifications
    console.log("Notifications clicked");
  };

  return (
    <header className="px-12 py-1 border-b 2xl:px-16 2xl:py-4 bg-base-100 border-base-300">
      <div className="flex justify-between items-center">
        {/* Search Bar */}
        <div className="flex justify-center w-full">
          <div className="relative w-md">
            <FaSearch className="absolute left-3 top-1/2 z-10 w-4 h-4 transform -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search Patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full input input-bordered focus:input-primary input-sm 2xl:input-md"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 2xl:space-x-4">
          {/* Theme Switcher */}
          <ThemeSwitcher className="2xl:w-5 2xl:h-5" />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn btn-ghost btn-circle"
            title="Refresh"
          >
            <SlRefresh className="2xl:w-5 2xl:h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className="relative btn btn-ghost btn-circle"
            title="Notifications"
          >
            <BsBell className="2xl:w-5 2xl:h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full 2xl:top-0 2xl:right-0 2xl:w-3 2xl:h-3 bg-error"></span>
          </button>

          <span className="mr-4"></span>

          {/* Add Patient Button */}
          <button onClick={handleAddPatient} className="btn btn-primary btn-sm 2xl:btn-md">
            <FaUserPlus className="2xl:w-4 2xl:h-4" />
            <span className="text-xs 2xl:text-sm">Add Patient</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
