import React from "react";
import { useState } from "react";
import { FaSearch, FaBell, FaSync, FaUserPlus } from "react-icons/fa";
import ThemeSwitcher from "./ThemeSwitcher";
import { SlRefresh } from "react-icons/sl";
import { BsBell } from "react-icons/bs";

const Topbar = () => {
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
    <header className="px-6 py-4 w-full border-b bg-base-100 border-base-300">
      <div className="flex justify-between items-center mt-3">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 pointer-events-none text-base-content/50" />
            <input
              type="text"
              placeholder="Search Patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full input input-bordered focus:input-primary"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn btn-ghost btn-circle"
            title="Refresh"
          >
            <SlRefresh className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className="relative btn btn-ghost btn-circle"
            title="Notifications"
          >
            <BsBell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-error"></span>
          </button>

          {/* Add Patient Button */}
          <button onClick={handleAddPatient} className="btn btn-primary">
            <FaUserPlus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
