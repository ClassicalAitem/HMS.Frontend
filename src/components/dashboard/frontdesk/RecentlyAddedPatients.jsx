/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react';
import { IoSearch, IoClose } from "react-icons/io5";
import { DataTable } from '../../common';

const RecentlyAddedPatients = () => {
  // State for search bar visibility
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const patients = useMemo(() => [
    {
      id: '01',
      name: 'Jane Cooper',
      gender: 'F',
      age: 36,
      phone: '(217) 555-0113',
      address: '6391 Elgin St. Celina, Delaware 10299',
      status: 'Urgent',
      statusColor: 'bg-orange-500'
    },
    {
      id: '02',
      name: 'Theresa Webb',
      gender: 'F',
      age: 36,
      phone: '(207) 555-0119',
      address: '2118 Thornridge Syracuse, 35624',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '03',
      name: 'Albert Flores',
      gender: 'F',
      age: 36,
      phone: '(217) 555-0113',
      address: '3891 Ranchview Richardson,California',
      status: 'Emergency',
      statusColor: 'bg-red-500'
    },
    {
      id: '04',
      name: 'Robert Fox',
      gender: 'M',
      age: 36,
      phone: '(480) 555-0103',
      address: '3891 Ranchview Richardson,California',
      status: 'Passaway',
      statusColor: 'bg-gray-500'
    },
    {
      id: '05',
      name: 'Savannah Nguyen',
      gender: 'F',
      age: 36,
      phone: '(209) 555-0104',
      address: '6391 Elgin St. Celina, Delaware 10299',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '06',
      name: 'Annette Black',
      gender: 'F',
      age: 36,
      phone: '(225) 555-0118',
      address: '2118 Thornridge Syracuse, 35624',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '07',
      name: 'Robert Fox',
      gender: 'M',
      age: 36,
      phone: '(270) 555-0117',
      address: '3891 Ranchview Richardson,California',
      status: 'Emergency',
      statusColor: 'bg-red-500'
    },
    {
      id: '08',
      name: 'Brooklyn Simmons',
      gender: 'M',
      age: 36,
      phone: '(316) 555-0116',
      address: '3891 Ranchview Richardson,California',
      status: 'Passaway',
      statusColor: 'bg-gray-500'
    },
    {
      id: '09',
      name: 'Jacob Jones',
      gender: 'M',
      age: 36,
      phone: '(702) 555-0122',
      address: '3891 Ranchview Richardson,California',
      status: 'Urgent',
      statusColor: 'bg-orange-500'
    },
    {
      id: '10',
      name: 'Annette Black',
      gender: 'F',
      age: 36,
      phone: '(319) 555-0115',
      address: '3891 Ranchview Richardson,California',
      status: 'Not Urgent',
      statusColor: 'bg-green-500'
    },
    {
      id: '11',
      name: 'Savannah Nguyen',
      gender: 'F',
      age: 36,
      phone: '(316) 555-0116',
      address: '3891 Ranchview Richardson,California',
      status: 'Emergency',
      statusColor: 'bg-red-500'
    }
  ], []);

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  // Handle search icon click
  const handleSearchToggle = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchTerm(''); // Clear search when hiding
    }
  };

  const StatusBadge = ({ status, color }) => {
    const getBadgeClass = (status) => {
      switch (status) {
        case 'Urgent':
          return 'badge badge-warning w-full';
        case 'Emergency':
          return 'badge badge-error w-full';
        case 'Not Urgent':
          return 'badge badge-success w-full';
        case 'Passaway':
          return 'badge badge-neutral w-full';
        default:
          return 'badge badge-info w-full';
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
      key: 'id',
      title: 'S/n',
      className: 'text-base-content'
    },
    {
      key: 'name',
      title: 'Patient Name',
      className: 'font-medium text-base-content'
    },
    {
      key: 'gender',
      title: 'Gender',
      className: 'text-base-content/70'
    },
    {
      key: 'age',
      title: 'Age',
      className: 'text-base-content/70'
    },
    {
      key: 'phone',
      title: 'Phone Number',
      className: 'text-base-content/70'
    },
    {
      key: 'address',
      title: 'Address',
      className: 'text-base-content/70',
      truncate: true,
      render: (value) => (
        <span className="block max-w-xs truncate" title={value}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value, row) => <StatusBadge status={value} color={row.statusColor} />
    }
  ], []);

  return (
    <div className="h-[--webkit-fill-available] bg-base-100  shadow-xl card flex w-full pb-2">
      {/* Header */}
      <div className="flex pb-0 h-full card-body">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold 2xl:text-lg text-base-content">Recently Added Patients</h3>
          <div className="flex gap-4 items-center">
            <button
              onClick={handleSearchToggle}
              className="transition-colors text-primary hover:text-primary/80"
            >
              {showSearchBar ? (
                <IoClose className="w-4 h-4 cursor-pointer" />
              ) : (
                <IoSearch className="w-4 h-4 cursor-pointer" />
              )}
            </button>
            <button className="text-sm font-medium transition-colors cursor-pointer text-primary hover:text-primary/80">
              See All
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearchBar && (
          <div className="mb-4 transition-all duration-300 ease-in-out">
            <div className="flex relative items-center max-w-md">
              <div className="flex absolute inset-y-0 left-0 z-10 items-center pl-3 pointer-events-none">
                <IoSearch className="w-4 h-4 text-base-content/80" />
              </div>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full input input-bordered input-sm"
                autoFocus
              />
               <IoClose 
                 onClick={handleSearchToggle}
                 className="ml-2 w-8 h-auto text-xl font-bold text-red-500 rounded-full cursor-pointer hover:bg-secondary/70" 
               />
            </div>
          </div>
        )}

        {/* DataTable Component */}
        <DataTable
          data={filteredPatients}
          columns={columns}
          searchable={false}
          sortable={true}
          paginated={true}
          initialEntriesPerPage={5}
          maxHeight="max-h-48 sm:max-h-56 md:max-h-64 lg:max-h-72 xl:max-h-110"
          showEntries={true}
          className="flex flex-col justify-between h-[-webkit-fill-available]"
        />
      </div>
    </div>
  );
};

export default RecentlyAddedPatients;
