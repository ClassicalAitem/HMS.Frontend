/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';

const SuperAdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Super Admin Dashboard</h1>
            <p className="text-sm text-base-content/60 2xl:text-base">Welcome, Robert Thompson</p>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* System Status */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">System Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Database</span>
                    <span className="badge badge-success">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">API Services</span>
                    <span className="badge badge-success">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Backup Status</span>
                    <span className="badge badge-warning">Pending</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Security</span>
                    <span className="badge badge-success">Protected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Analytics */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">User Analytics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Total Users</span>
                    <span className="font-semibold text-primary">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Active Today</span>
                    <span className="font-semibold text-success">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">New This Week</span>
                    <span className="font-semibold text-info">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">System Admins</span>
                    <span className="font-semibold text-warning">5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Actions */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">System Actions</h2>
                <div className="space-y-3">
                  <button className="w-full btn btn-primary btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Backup System
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    System Health Check
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    System Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
