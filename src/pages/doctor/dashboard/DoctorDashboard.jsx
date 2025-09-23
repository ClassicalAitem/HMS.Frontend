/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/doctor/dashboard';

const DoctorDashboard = () => {
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
            <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Doctor Dashboard</h1>
            <p className="text-sm text-base-content/60 2xl:text-base">Welcome, Dr. Michael Chen</p>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Today's Appointments */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Today's Appointments</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">John Doe</p>
                      <p className="text-sm text-base-content/70">9:00 AM - General Checkup</p>
                    </div>
                    <div className="badge badge-primary">Active</div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">Jane Smith</p>
                      <p className="text-sm text-base-content/70">10:30 AM - Follow-up</p>
                    </div>
                    <div className="badge badge-warning">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Queue */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Patient Queue</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">Robert Wilson</p>
                      <p className="text-sm text-base-content/70">Room 101</p>
                    </div>
                    <div className="badge badge-success">Ready</div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">Lisa Brown</p>
                      <p className="text-sm text-base-content/70">Room 102</p>
                    </div>
                    <div className="badge badge-info">Waiting</div>
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
                    New Diagnosis
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Prescribe Medication
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Patient History
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

export default DoctorDashboard;
