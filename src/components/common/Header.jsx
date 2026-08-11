import React, { useState } from "react";
import { FaSearch, FaBell, FaSync, FaUserPlus, FaBars } from "react-icons/fa";
import { SlRefresh } from "react-icons/sl";
import ThemeSwitcher from "./ThemeSwitcher";
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
    <header className="w-full border-b border-base-300 bg-base-100 px-3 py-2 sm:px-4 lg:px-4 2xl:px-6 2xl:py-[22px]">
      <div className="flex justify-between gap-2 sm:gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-circle shrink-0 lg:hidden"
          title="Toggle Menu"
        >
          <FaBars className="h-4 w-4" />
        </button>

        {/* Search Bar */}
        {/* <div className="flex min-w-0 flex-1 justify-center">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 z-10 h-3 w-3 -translate-y-1/2 text-base-content/40 sm:h-4 sm:w-4" />
            <input
              type="text"
              placeholder="Search Patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-xs w-full border-b pl-8 focus:input-primary sm:input-sm sm:pl-10 2xl:input-md"
            />
          </div>
        </div> */}

        {/* Right Side Actions */}
       {/* Right Side Actions */}
<div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 2xl:gap-4">
  <ThemeSwitcher className="2xl:h-5 2xl:w-5" />

  <button
    onClick={handleRefresh}
    className="btn btn-ghost btn-circle btn-xs sm:btn-sm lg:btn-md"
    title="Refresh"
  >
    <SlRefresh className="h-3 w-3 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
  </button>

  <button
    onClick={handleNotifications}
    className="relative btn btn-ghost btn-circle btn-xs sm:btn-sm lg:btn-md"
    title="Notifications"
  >
    <BsBell className="h-3 w-3 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
    <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-error sm:h-2.5 sm:w-2.5 2xl:h-3 2xl:w-3"></span>
  </button>
</div>
      </div>
    </header>
  );
};

export default Header;
