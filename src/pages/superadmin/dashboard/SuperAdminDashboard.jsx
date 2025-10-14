import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/common';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { LuUserRoundCheck } from 'react-icons/lu';
import { MdOutlineStore } from 'react-icons/md';
import { FiFileText } from 'react-icons/fi';
import activitiesData from '@/data/activities.json';

const SuperAdminDashboard = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    setActivities(activitiesData);
  }, []);

  const getCurrentDate = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  const StatusBadge = ({ status, color }) => {
    const getBadgeClass = (status) => {
      switch (status) {
        case 'Completed':
          return 'badge badge-success w-full';
        case 'Pending':
          return 'badge badge-warning w-full';
        case 'Failed':
          return 'badge badge-error w-full';
        case 'In progress':
          return 'badge badge-info w-full';
        default:
          return 'badge badge-neutral w-full';
      }
    };
  
    return (
      <span className={getBadgeClass(status)} >
        {status}
      </span>
    );
  };

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      className: 'font-medium text-base-content'
    },
    {
      key: 'description',
      title: 'Description',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'timestamp',
      title: 'Timestamp',
      sortable: true,
      className: 'text-base-content/70'
    }
  ], []);

  return (
    <SuperAdminLayout>
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-lg font-medium text-primary 2xl:text-2xl">Super Admin Dashboard</h1>
            <p className="text-xs text-base-content/70 2xl:text-base">
              Welcome back, Super Admin. Here's a summary of your hospital's current status for {getCurrentDate()}.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Patients */}
            <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-start items-center rounded-lg bg-primary/10">
                  <PiUsersThreeDuotone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Total Patients</p>
                  <p className="mt-1 text-2xl font-semibold text-content">5,234</p>
                </div>
              </div>
            </div>

            {/* Total Staff */}
            <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-start items-center rounded-lg bg-primary/10">
                  <LuUserRoundCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Total Staff</p>
                  <p className="mt-1 text-2xl font-semibold text-content">875</p>
                </div>
              </div>
            </div>

            {/* Total Departments */}
            <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-start items-center rounded-lg bg-primary/10">
                  <MdOutlineStore className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Total Departments</p>
                  <p className="mt-1 text-2xl font-semibold text-content">32</p>
                </div>
              </div>
            </div>

            {/* Pending Reports */}
            <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
              <div className="flex flex-col justify-between items-center">
                <div className="flex justify-start items-center rounded-lg bg-primary/10">
                  <FiFileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p className="text-sm font-medium text-base-content/70">Pending Reports</p>
                  <p className="mt-1 text-2xl font-semibold text-content">5</p>
                </div>
              </div>
            </div>



          </div>
          

          {/* Recent System Activities */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-primary 2xl:text-2xl">Recent System Activities</h2>
              <p className="text-xs 2xl:text-base text-base-content/70">Latest system notifications and critical events.</p>
            </div>
            
            {/* Activities Table */}
            <DataTable
              data={activities}
              columns={columns}
              searchable={true}
              sortable={true}
              paginated={true}
              initialEntriesPerPage={5}
              maxHeight="max-h-96 sm:max-h-80 md:max-h-96 lg:max-h-80 2xl:max-h-96"
              showEntries={true}
              searchPlaceholder="Search activities..."
            />
          </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
