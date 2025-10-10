import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaDownload, FaSearch, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleExportLogs = () => {
    toast.success('Audit logs exported successfully!');
  };

  // Sample data for audit logs
  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:45',
      user: 'Dr. Sarah Johnson',
      action: 'Patient Record Access',
      resource: 'Patient ID: 12345',
      status: 'Success',
      description: 'Viewed patient medical record'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:30:45',
      user: 'Nurse Mary Wilson',
      action: 'Medication Administration',
      resource: 'Patient ID: 12346',
      status: 'Success',
      description: 'Administered prescribed medication'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:30:45',
      user: 'Receptionist Lisa Brown',
      action: 'Appointment Scheduling',
      resource: 'Patient ID: 12348',
      status: 'Success',
      description: 'Scheduled appointment for 2024-01-20'
    },
    {
      id: 4,
      timestamp: '2024-01-15 10:30:45',
      user: 'Pharmacy Staff',
      action: 'Prescription Access',
      resource: 'Patient ID: 12348',
      status: 'Success',
      description: 'Dispensed prescribed medication'
    },
    {
      id: 5,
      timestamp: '2024-01-15 10:30:45',
      user: 'Dr. Lisa Anderson',
      action: 'Failed Login Attempt',
      resource: 'Login System',
      status: 'Failed',
      description: 'Invalid password - 3rd attempt'
    }
  ];

  const summaryStats = {
    totalLogs: 1200,
    successfulActions: 1000,
    failedActions: 39,
    users: 50
  };

  const actionTypes = [
    'All',
    'Patient Record Access',
    'Medication Administration',
    'Appointment Scheduling',
    'Prescription Access',
    'Failed Login Attempt',
    'User Management',
    'System Configuration'
  ];

  const users = [
    'All',
    'Dr. Sarah Johnson',
    'Nurse Mary Wilson',
    'Receptionist Lisa Brown',
    'Pharmacy Staff',
    'Dr. Lisa Anderson',
    'Admin User',
    'System Admin'
  ];

  const getStatusBadgeClass = (status) => {
    return status === 'Success' ? 'badge-success' : 'badge-error';
  };

  const totalPages = 5;
  const itemsPerPage = 5;

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
        <div className="flex overflow-y-auto flex-col p-6 h-full">
          {/* Page Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/superadmin/settings')}
              className="flex items-center text-base-content/70 hover:text-primary transition-colors mb-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary">Audit Logs</h1>
                <p className="text-base-content/70">Manage charges and payments</p>
              </div>
              <button
                onClick={handleExportLogs}
                className="btn btn-primary"
              >
                <FaDownload className="w-4 h-4 mr-2" />
                Export Logs
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-primary/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary/70 mb-1">Total Logs</p>
                  <p className="text-2xl font-bold text-primary">{summaryStats.totalLogs.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">📋</span>
                </div>
              </div>
            </div>

            <div className="bg-success/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-success/70 mb-1">Successful Actions</p>
                  <p className="text-2xl font-bold text-success">{summaryStats.successfulActions.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="text-success font-bold">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-error/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-error/70 mb-1">Failed Actions</p>
                  <p className="text-2xl font-bold text-error">{summaryStats.failedActions}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                  <span className="text-error font-bold">❌</span>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warning/70 mb-1">Users</p>
                  <p className="text-2xl font-bold text-warning">{summaryStats.users}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <span className="text-warning font-bold">👥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-base-content mb-4">Filter Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Search users
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 text-base-content/50" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-bordered w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  All Actions
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="select select-bordered w-full"
                >
                  {actionTypes.map((action) => (
                    <option key={action} value={action.toLowerCase().replace(/\s+/g, '-')}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  All users
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="select select-bordered w-full"
                >
                  {users.map((user) => (
                    <option key={user} value={user.toLowerCase().replace(/\s+/g, '-')}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Pick a date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 text-base-content/50" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input input-bordered w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="bg-base-100 rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-base-content">Activity Logs (5)</h3>
              <p className="text-sm text-base-content/70">Detailed system activity and user action tracking</p>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="text-base-content/70">Timestamp</th>
                    <th className="text-base-content/70">User</th>
                    <th className="text-base-content/70">Action</th>
                    <th className="text-base-content/70">Resource</th>
                    <th className="text-base-content/70">Status</th>
                    <th className="text-base-content/70">Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {log.timestamp}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-base-content">
                          {log.user}
                        </div>
                      </td>
                      <td>
                        <div className="text-base-content/70">
                          {log.action}
                        </div>
                      </td>
                      <td>
                        <div className="text-base-content/70">
                          {log.resource}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <div className="text-base-content/70">
                          {log.description}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-base-300">
              <div className="text-sm text-base-content/70">
                Showing Recent Activity Logs (150 Total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-ghost btn-sm"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`btn btn-sm ${
                      currentPage === page ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-ghost btn-sm"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
