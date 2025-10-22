import React from 'react';
import { FaSearch, FaSync } from 'react-icons/fa';

const FilterUsers = ({
  searchTerm,
  selectedRole,
  selectedStatus,
  isLoading,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onRefresh
}) => {
  return (
    <div className="p-4 mb-6 rounded-lg border shadow-sm bg-base-100 border-base-300">
      <h3 className="mb-4 text-lg font-semibold text-base-content">Filter Users</h3>
      <div className="flex flex-col gap-4 items-end sm:flex-row">
        {/* Search Input */}
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-base-content/70">
            Search Users
          </label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={onSearchChange}
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-base-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Role Dropdown */}
        <div className="sm:w-48">
          <label className="block mb-2 text-sm font-medium text-base-content/70">
            Role
          </label>
          <select
            value={selectedRole}
            onChange={onRoleChange}
            className="px-3 py-2 w-full rounded-lg border bg-base-100 border-base-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="front-desk">Front Desk</option>
            <option value="pharmacist">Pharmacist</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="sm:w-48">
          <label className="block mb-2 text-sm font-medium text-base-content/70">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={onStatusChange}
            className="px-3 py-2 w-full rounded-lg border bg-base-100 border-base-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Refresh Button */}
        <div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-outline btn-sm"
            title="Refresh users data"
          >
            <FaSync className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterUsers;

