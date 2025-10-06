/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { DataTable } from '@/components/common';
import { BookAppointmentModal } from '@/components/modals';
import appointmentsData from '@/data/appointments.json';
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa';
import { PiSlidersLight } from 'react-icons/pi';

const Appointments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('7/18/17');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Load appointments data from JSON file
  useEffect(() => {
    setAppointments(appointmentsData);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const StatusBadge = ({ status }) => {
    const getBadgeClass = (status) => {
      switch (status) {
        case 'Active':
          return 'badge badge-success text-white';
        case 'Not Active':
          return 'badge badge-neutral text-white';
        case 'Not Urgent':
          return 'badge badge-success text-white';
        default:
          return 'badge badge-neutral text-white';
      }
    };

    return (
      <div className={getBadgeClass(status)}>
        {status}
      </div>
    );
  };

  // Process appointments data
  const processedAppointments = useMemo(() => appointments.map(appointment => ({
    ...appointment
  })), [appointments]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'id',
      title: 'S/n',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'patientName',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'time',
      title: 'Time',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'appointmentType',
      title: 'Appointment type',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value, row) => <StatusBadge status={value} />
    }
  ], []);

  // Get current date for display
  const getCurrentDate = () => {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const handleBookAppointment = (appointmentData) => {
    console.log('New appointment:', appointmentData);
    // Add logic to save appointment
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
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Appointments</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">{getCurrentDate()}</p>
            </div>
             <button 
               className="btn btn-primary btn-sm 2xl:btn-md"
               onClick={() => setIsBookModalOpen(true)}
             >
               <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
               <span className="text-xs 2xl:text-sm">Book Appointment</span>
             </button>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-4 justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <button 
                className="flex gap-2 items-center btn btn-sm"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <PiSlidersLight className="w-4 h-4 rotate-90" />
                <span className="text-xs">Filter</span>
              </button>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="flex gap-2 items-center btn btn-outline btn-sm">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span className="text-xs">{selectedDate}</span>
                  <FaChevronDown className="w-3 h-3" />
                </label>
                <ul tabIndex={0} className="p-2 mt-1 w-52 shadow dropdown-content menu bg-base-100 rounded-box">
                  <li><a onClick={() => setSelectedDate('7/18/17')}>7/18/17</a></li>
                  <li><a onClick={() => setSelectedDate('7/19/17')}>7/19/17</a></li>
                  <li><a onClick={() => setSelectedDate('7/20/17')}>7/20/17</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                <DataTable
                  data={processedAppointments}
                  columns={columns}
                  searchable={false}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={10}
                  maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
                  showEntries={true}
                  searchPlaceholder="Search appointments..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSubmit={handleBookAppointment}
      />
    </div>
  );
};

export default Appointments;

