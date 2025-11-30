/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch, IoClose } from "react-icons/io5";
import { DataTable } from '@/components/common';
import { getPatients } from '@/services/api/patientsAPI';

const RecentlyAddedPatients = () => {
  const navigate = useNavigate();
  // State for search bar visibility
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load patients data from backend and sort newest-first
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const sorted = (Array.isArray(list) ? list : []).sort((a, b) => {
          const at = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bt = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bt - at;
        });
        if (mounted) setPatients(sorted);
      } catch (e) {
        console.error('RecentlyAddedPatients: failed to fetch patients', e);
        if (mounted) setError('Failed to load patients');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const processedPatients = useMemo(() => patients.map(p => ({
    id: p?.id || p?.patientId || p?.uuid || p?.hospitalId || '',
    name: (`${p?.firstName || ''} ${p?.middleName || ''} ${p?.lastName || ''}`).trim() || p?.fullName || p?.name || 'Unknown',
    gender: (p?.gender || '—').toLowerCase(),
    age: calculateAge(p?.dob),
    phone: p?.phone || p?.phoneNumber || '—',
    address: p?.address || '—',
    status: p?.status || '—',
  })), [patients]);

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return processedPatients;
    
    return processedPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.includes(searchTerm)
    );
  }, [processedPatients, searchTerm]);

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
        case 'Active':
          return 'badge badge-success w-full';
        case 'Inactive':
          return 'badge badge-neutral w-full';
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
      key: 'id',
      title: 'S/n',
      className: 'text-base-content'
    },
    {
      key: 'name',
      title: 'Patient Name',
      className: 'font-medium text-base-content',
      render: (value, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/frontdesk/patients/${row.id}`);
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
    <div className="h-[--webkit-fill-available] bg-base-100  shadow-xl card flex w-full 2xl:pb-2 pb-8">
      {/* Header */}
      <div className="flex pb-8 h-full card-body 2xl:pb-0">
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
        {isLoading ? (
          <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
            <div className="overflow-auto max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110 p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            data={filteredPatients}
            columns={columns}
            searchable={false}
            sortable={true}
            paginated={true}
            initialEntriesPerPage={5}
            maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
            showEntries={true}
            className="flex flex-col justify-between h-[-webkit-fill-available]"
          />
        )}
      </div>
    </div>
  );
};

export default RecentlyAddedPatients;

// Helper: calculate age from date of birth
function calculateAge(dob) {
  if (!dob) return '—';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
