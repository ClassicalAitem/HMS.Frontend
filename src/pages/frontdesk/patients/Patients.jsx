/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { DataTable } from '@/components/common';
import patientsData from '@/data/patientsExtended.json';

const Patients = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load patients data from JSON file
  useEffect(() => {
    setPatients(patientsData);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const StatusBadge = ({ status, color }) => {
    const getBadgeClass = (status) => {
      switch (status) {
        case 'Active':
          return 'badge badge-success w-full';
        case 'Inactive':
          return 'badge badge-neutral w-full';
        default:
          return 'badge badge-neutral w-full';
      }
    };

    return (
      <div className={getBadgeClass(status)}>
        {status}
      </div>
    );
  };

  // Process patients data with consistent status colors
  const processedPatients = useMemo(() => patients.map(patient => ({
    ...patient
  })), [patients]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'id',
      title: 'S/n',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'name',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/patients/${row.id}`);
          }}
          className="text-primary hover:text-primary/80 hover:underline font-medium bg-transparent border-none cursor-pointer"
        >
          {value}
        </button>
      )
    },
    {
      key: 'gender',
      title: 'Gender',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'age',
      title: 'Age',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'phone',
      title: 'Phone Number',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'address',
      title: 'Address',
      sortable: true,
      className: 'text-base-content/70',
      truncate: true
    },
    {
    key: 'status',
    title: 'Status',
    className: 'text-base-content/70',
    render: (value, row) => <StatusBadge status={value} color={row.statusColor} />
    }
  ], []);

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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Patients</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">Manage and view all patient records</p>
            </div>
            <button className="hidden btn btn-primary btn-sm 2xl:btn-md">
              <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs 2xl:text-sm">Add Patient</span>
            </button>
          </div>

          {/* Patients Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                <DataTable
                  data={processedPatients}
                  columns={columns}
                  searchable={true}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={10}
                  maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
                  showEntries={true}
                  searchPlaceholder="Search patients..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patients;
