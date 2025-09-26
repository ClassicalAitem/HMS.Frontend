/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaFolderOpen, FaPrint, FaDownload, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GenerateReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState('Patient Admissions Report');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [filters, setFilters] = useState('All Departments');
  const [patientId, setPatientId] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Sample data for the chart
  const monthlyData = [
    { month: 'Jan', admissions: 45 },
    { month: 'Feb', admissions: 52 },
    { month: 'Mar', admissions: 38 },
    { month: 'Apr', admissions: 67 },
    { month: 'May', admissions: 73 },
    { month: 'Jun', admissions: 58 },
    { month: 'Jul', admissions: 82 },
    { month: 'Aug', admissions: 69 },
    { month: 'Sep', admissions: 75 }
  ];

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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column - Report Generation */}
            <div className="space-y-6">
              {/* Report Generation Section */}
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                <h2 className="mb-6 text-xl font-bold text-base-content">Report Generation</h2>
                
                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <button className="btn btn-primary">
                    <FaFolderOpen className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button className="btn btn-outline">
                    <FaPrint className="w-4 h-4 mr-2" />
                    Save Report
                  </button>
                </div>

                {/* Report Configuration */}
                <div className="space-y-4">
                  {/* Report Type */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Report Type</label>
                    <select 
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      <option>Patient Admissions Report</option>
                      <option>Financial Report</option>
                      <option>Staff Performance Report</option>
                      <option>Department Statistics</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Date Range</label>
                    <select 
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>Last Year</option>
                      <option>Custom Range</option>
                    </select>
                  </div>

                  {/* Filters */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Filters</label>
                    <select 
                      value={filters}
                      onChange={(e) => setFilters(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      <option>All Departments</option>
                      <option>Cardiology</option>
                      <option>Emergency</option>
                      <option>Pediatrics</option>
                      <option>Surgery</option>
                    </select>
                  </div>

                  {/* Search by Patient ID */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Search by Patient ID</label>
                    <input 
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="Enter Patient ID"
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Reports Overview and Charts */}
            <div className="space-y-6">
              {/* Report Overview */}
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                <h2 className="mb-6 text-xl font-bold text-base-content">Report Overview</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Total Reports Generated</span>
                    <span className="text-2xl font-bold text-primary">1,250</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">Last Export Date</span>
                    <span className="text-lg font-semibold text-base-content">2024-07-29</span>
                  </div>
                </div>
              </div>

              {/* Monthly Patient Admissions Chart */}
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                <h2 className="mb-2 text-xl font-bold text-base-content">Monthly Patient Admissions</h2>
                <p className="mb-6 text-sm text-base-content/70">Overview of patient admissions over the last 8 months.</p>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="admissions" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Reports History */}
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                <h2 className="mb-6 text-xl font-bold text-base-content">Recent Reports History</h2>
                
                <div className="text-center py-8 text-base-content/50">
                  <FaDownload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent reports to display</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReports;
