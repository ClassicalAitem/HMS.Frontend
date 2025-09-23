/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';

const CashierDashboard = () => {
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
            <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Cashier Dashboard</h1>
            <p className="text-sm text-base-content/60 2xl:text-base">Welcome, Maria Rodriguez</p>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Today's Transactions */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Today's Transactions</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">John Doe</p>
                      <p className="text-sm text-base-content/70">Consultation Fee</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">$150.00</p>
                      <p className="text-xs text-base-content/70">Paid</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                    <div>
                      <p className="font-medium text-base-content">Jane Smith</p>
                      <p className="text-sm text-base-content/70">Lab Test</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">$75.00</p>
                      <p className="text-xs text-base-content/70">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Payment Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Total Collected</span>
                    <span className="font-semibold text-success">$2,450.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Pending Payments</span>
                    <span className="font-semibold text-warning">$325.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Cash Payments</span>
                    <span className="font-semibold text-info">$1,200.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Card Payments</span>
                    <span className="font-semibold text-primary">$1,250.00</span>
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
                    New Payment
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Invoice
                  </button>
                  <button className="w-full btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Reports
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

export default CashierDashboard;
