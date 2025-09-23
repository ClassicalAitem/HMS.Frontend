/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/admin/dashboard';

const AdminDashboard = () => {
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
            <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Admin Dashboard</h1>
            <p className="text-sm text-base-content/60 2xl:text-base">Welcome, Jennifer Martinez</p>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* System Overview */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">System Overview</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Total Users</span>
                    <span className="font-semibold text-primary">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Active Sessions</span>
                    <span className="font-semibold text-success">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">System Status</span>
                    <span className="badge badge-success">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Management */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Departments</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">General Medicine</p>
                      <p className="text-sm text-base-content/70">12 doctors</p>
                    </div>
                    <div className="badge badge-primary">Active</div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">Nursing</p>
                      <p className="text-sm text-base-content/70">25 nurses</p>
                    </div>
                    <div className="badge badge-primary">Active</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full btn btn-primary btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add User
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Reports
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

export default AdminDashboard;
