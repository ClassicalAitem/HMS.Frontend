/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaUsers, FaUserMd, FaBuilding, FaFileAlt } from 'react-icons/fa';
import { PiUsersThreeDuotone, PiUsersFourDuotone, PiBuildingDuotone, PiFileDuotone } from 'react-icons/pi';
import { IoDocumentsOutline } from "react-icons/io5"; 

const SuperAdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-lg font-regular text-base-content 2xl:text-2xl">Super Admin Dashboard</h1>
            <p className="text-xs text-base-content/70 2xl:text-base">
              Welcome back, Super Admin. Here's a summary of your hospital's current status for {getCurrentDate()}.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Patients */}
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-center items-center rounded-lg bg-primary/10">
                  <PiUsersThreeDuotone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Total Patients</p>
                  <p className="text-2xl font-regular text-primary">5,234</p>
                </div>
              </div>
            </div>

            {/* Total Staff */}
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-center items-center rounded-lg bg-primary/10">
                  <PiUsersFourDuotone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Total Staff</p>
                  <p className="text-2xl font-regular text-primary">875</p>
                </div>
              </div>
            </div>

            {/* Total Departments */}
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-center items-center rounded-lg bg-primary/10">
                  <PiBuildingDuotone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Total Departments</p>
                  <p className="text-2xl font-regular text-primary">32</p>
                </div>
              </div>
            </div>

            {/* Pending Reports */}
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-center items-center rounded-lg bg-primary/10">
                  <IoDocumentsOutline className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Pending Reports</p>
                  <p className="text-2xl font-regular text-primary">5</p>
                </div>
              </div>
            </div>



          </div>
          

          {/* Recent System Activities */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100">
            <div className="mb-6">
              <h2 className="text-md font-regular text-base-content">Recent System Activities</h2>
              <p className="text-xs 2xl:text-base text-base-content/70">Latest system notifications and critical events.</p>
            </div>
            
            {/* Activities Table */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-base-content/70">Type</th>
                    <th className="text-base-content/70">Description</th>
                    <th className="text-base-content/70">Status</th>
                    <th className="text-base-content/70">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-base-content/50">
                      No recent activities to display
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
