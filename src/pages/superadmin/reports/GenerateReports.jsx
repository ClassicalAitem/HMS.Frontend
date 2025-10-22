import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaDownload, FaSave, FaFileAlt, FaCalendarAlt, FaFilter, FaSearch, FaUsers, FaBell } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GenerateReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState('Patient Admissions Report');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [department, setDepartment] = useState('All Departments');
  const [patientId, setPatientId] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Sample data for the chart - matching the image
  const monthlyData = [
    { month: 'Jan', admissions: 50 },
    { month: 'Feb', admissions: 70 },
    { month: 'Mar', admissions: 60 },
    { month: 'Apr', admissions: 90 },
    { month: 'May', admissions: 60 },
    { month: 'Jun', admissions: 80 },
    { month: 'Jul', admissions: 30 },
    { month: 'Aug', admissions: 60 },
    { month: 'Sep', admissions: 90 }
  ];

  // Sample recent reports data
  const recentReports = [
    {
      id: 1,
      name: 'Patient Admissions Report - July 2024',
      date: '2024-07-29',
      size: '2.3 MB',
      status: 'Completed'
    },
    {
      id: 2,
      name: 'Financial Summary Report Q2 2024',
      date: '2024-07-28',
      size: '1.8 MB',
      status: 'Completed'
    },
    {
      id: 3,
      name: 'Department Performance Report',
      date: '2024-07-27',
      size: '3.1 MB',
      status: 'Completed'
    },
    {
      id: 4,
      name: 'Patient Demographics Report',
      date: '2024-07-26',
      size: '2.7 MB',
      status: 'Completed'
    },
    {
      id: 5,
      name: 'Staff Performance Report Q2 2024',
      date: '2024-07-25',
      size: '4.2 MB',
      status: 'Processing'
    },
    {
      id: 6,
      name: 'Patient Discharge Report',
      date: '2024-07-24',
      size: '1.5 MB',
      status: 'Completed'
    },
    {
      id: 7,
      name: 'Quarterly Medical Equipment Audit',
      date: '2024-07-23',
      size: '2.1 MB',
      status: 'Completed'
    },
    {
      id: 8,
      name: 'Monthly Inventory Report',
      date: '2024-07-22',
      size: '2.9 MB',
      status: 'Completed'
    },
    {
      id: 9,
      name: 'Annual Budget Overview',
      date: '2024-07-21',
      size: '3.6 MB',
      status: 'Completed'
    },
    {
      id: 10,
      name: 'Surgery Outcomes Summary',
      date: '2024-07-20',
      size: '2.0 MB',
      status: 'Processing'
    },
    {
      id: 11,
      name: 'Patient Satisfaction Trends',
      date: '2024-07-19',
      size: '2.4 MB',
      status: 'Completed'
    },
    {
      id: 12,
      name: 'Inpatient vs Outpatient Report',
      date: '2024-07-18',
      size: '1.9 MB',
      status: 'Completed'
    },
    {
      id: 13,
      name: 'New Staff Onboarding Logs',
      date: '2024-07-17',
      size: '1.2 MB',
      status: 'Completed'
    }
  ];

  return (
    <div className="flex h-screen bg-base-300/20">
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
      <div className="flex overflow-hidden flex-col flex-1">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col pt-4 pl-6 h-full">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            
            {/* Left Column - Report Generation */}
            <div className="space-y-2 xl:col-span-2">
              
              {/* Report Generation Card */}
              <div className="p-4 rounded-lg shadow-lg bg-base-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-normal text-primary">Report Generation</h2>
                  <div className="flex gap-3">
                    <button className="btn btn-primary">
                      <FaDownload className="mr-2 w-4 h-4" />
                      Export
                    </button>
                    <button className="btn btn-outline">
                      <FaSave className="mr-2 w-4 h-4" />
                      Save Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Section - Report Configuration */}
                  <div className="space-y-4">
                    {/* Report Type */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-base-content/70">Report Type</label>
                      <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full select select-bordered"
                      >
                        <option>Patient Admissions Report</option>
                        <option>Financial Report</option>
                        <option>Staff Performance Report</option>
                        <option>Department Statistics</option>
                      </select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-base-content/70">Date Range</label>
                      <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full select select-bordered"
                      >
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>Last 6 Months</option>
                        <option>Last Year</option>
                        <option>Custom Range</option>
                      </select>
                    </div>

                    {/* Department Filter */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-base-content/70">All Departments</label>
                      <select 
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full select select-bordered"
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
                      <label className="block mb-2 text-sm font-medium text-base-content/70">Search by Patient ID</label>
                      <input 
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="Enter Patient ID"
                        className="w-full input input-bordered"
                      />
                    </div>
                  </div>

                  {/* Right Section - Report Overview */}
                  <div className="p-4 rounded-lg border bg-base-100 border-primary">
                    <h3 className="mb-4 text-lg font-semibold text-base-content">Report Overview</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">Total Reports Generated</span>
                        <span className="text-3xl font-bold text-primary">1,250</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">Last Export Date</span>
                        <span className="text-lg font-semibold text-base-content">2024-07-29</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Patient Admissions Chart */}
              <div className="p-4 rounded-lg shadow-lg bg-base-100">
                <h2 className="mb-2 text-2xl font-normal text-primary">Monthly Patient Admissions</h2>
                <p className="mb-6 text-base-content/70">Overview of patient admissions over the last 9 months</p>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--p))' }}  
                        axisLine={{ stroke: 'hsl(var(--p))', strokeWidth: 1 }}
                        tickLine={{ stroke: 'hsl(var(--p))', strokeWidth: 1 }}
                        stroke="hsl(var(--p))"
                        className="fill-primary"
                      />
                      <YAxis 

                        tick={{ fontSize: 12, fill: 'hsl(var(--p))' }}
                        axisLine={{ stroke: 'hsl(var(--bc) / 0.2)' }}
                        stroke="hsl(var(--p))"
                        className="fill-primary"
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: '#374151',
                          opacity: 1
                        }}
                      />
                      <Bar 
                        dataKey="admissions" 
                        fill="hsl(var(--p))" 
                        radius={[4, 4, 0, 0]}
                        className="fill-primary"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column - Recent Reports History */}
            <div className="xl:col-span-1">
              <div className="flex flex-col p-6 rounded-lg shadow-lg bg-base-100" style={{ height: 'fit-content', maxHeight: 'calc(100vh - 100px)' }}>
                <h2 className="mb-6 text-2xl font-normal text-primary">Recent Reports History</h2>
                
                <div className="overflow-y-auto max-h-[780px]">
                  <div className="pr-2 space-y-4">
                    {recentReports.map((report) => (
                      <div key={report.id} className="flex justify-between items-center p-4 rounded-lg transition-colors bg-base-200 hover:bg-base-300">
                        <div className="flex items-center space-x-3">
                          <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary/10">
                            <FaFileAlt className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-base-content">{report.name}</p>
                            <p className="text-xs text-base-content/50">{report.date} • {report.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'Completed' 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-base-content/20 text-base-content/70'
                          }`}>
                            {report.status}
                          </span>
                          {report.status === 'Completed' && (
                            <button className="p-1 transition-colors text-base-content/40 hover:text-primary">
                              <FaDownload className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
