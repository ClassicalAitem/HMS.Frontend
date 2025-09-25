/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaFileInvoice, FaFileInvoiceDollar } from 'react-icons/fa';
import cashierData from '@/data/cashierData.json';

const CashierDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    setDashboardData(cashierData.dashboard);
  }, []);

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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content 2xl:text-4xl">Welcome, Cashier John!</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">Manage hospital finances, process payments, and track transactions.</p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
            {/* Total Payments Today */}
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-base-content/70">Total Payments Today</p>
                  <p className="text-3xl font-bold text-base-content">{dashboardData?.totalPaymentsToday}</p>
                  <button className="text-sm text-primary hover:underline mt-2">See All</button>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <FaFileInvoice className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Pending Invoices */}
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-base-content/70">Pending Invoices</p>
                  <p className="text-3xl font-bold text-base-content">{dashboardData?.pendingInvoices}</p>
                  <p className="text-sm text-base-content/50 mt-1">{dashboardData?.overdueInvoices} overdue</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <FaFileInvoiceDollar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-base-content">Recent Activity</h2>
              <p className="text-sm text-base-content/50">Last Updated 1/1/01 12:00AM</p>
            </div>
            
            {/* Activity Cards */}
            <div className="space-y-4">
              {dashboardData?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center p-4 rounded-lg bg-base-50 border border-base-200">
                  {/* Patient Photo */}
                  <div className="flex-shrink-0 mr-4">
                    <img
                      src={activity.patientPhoto}
                      alt={activity.patientName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  
                  {/* Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base-content">{activity.patientName}</h3>
                        <p className="text-sm text-base-content/70">Received {activity.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-base-content/70">{activity.service}</p>
                        <p className="text-sm text-base-content/70">Status: {activity.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-base-content/70">{activity.hmo}</p>
                        <p className="text-sm text-base-content/70">{activity.hmo}</p>
                        <p className="text-lg font-bold text-primary">{activity.amount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
