import React, { useState } from 'react';
import { FaSearch, FaBell, FaSync, FaUserPlus } from 'react-icons/fa';
import ThemeSwitcher from './ThemeSwitcher';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddPatient = () => {
    // Handle add patient action
    console.log('Add patient clicked');
  };

  const handleRefresh = () => {
    // Handle refresh action
    console.log('Refresh clicked');
  };

  const handleNotifications = () => {
    // Handle notifications
    console.log('Notifications clicked');
  };

  return (
    <header className="bg-base-100 border-b border-base-300 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Patient"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10 focus:input-primary"
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
            <FaSync className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className="btn btn-ghost btn-circle relative"
            title="Notifications"
          >
            <FaBell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
          </button>

          {/* Add Patient Button */}
          <button
            onClick={handleAddPatient}
            className="btn btn-primary"
          >
            <FaUserPlus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
