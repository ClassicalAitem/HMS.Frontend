import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch, IoClose } from "react-icons/io5";
import { DataTable } from '@/components/common';
import { getPatients } from '@/services/api/patientsAPI';
import { getDependants } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import { FaEye } from 'react-icons/fa';
import PatientStatusBadge from '@/components/common/PatientStatusBadge';

const RecentlyAttendedPatients = () => {
  const navigate = useNavigate();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients(),
          getDependants()
        ]);
        
        const patients = patientsRes.status === 'fulfilled' 
          ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : []) 
          : [];
          
        const dependants = dependantsRes.status === 'fulfilled'
          ? (() => {
              const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
              return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
            })()
          : [];

        const allRecords = [...patients, ...dependants];

        // Filter and sort by latest
        const sorted = allRecords.sort((a, b) => {
          const at = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bt = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bt - at;
        });

        if (mounted) setRecords(sorted);
      } catch (e) {
        console.error('RecentlyAttendedPatients: failed to fetch patients', e);
        if (mounted) setError('Failed to load attended patients');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const processedRecords = useMemo(() => {
    return records.map(r => {
      const isDependant = !!r?.patientId; // Dependants have patientId pointing to guardian
      const pId = isDependant ? r.patientId : r.id; // The main patient ID
      
      const name = (`${r?.firstName || ''} ${r?.lastName || ''}`).trim() || 'Unknown';
      
      return {
        id: r?.id || r?._id,
        patientId: pId, // original patient ID to route to
        patientName: name,
        universalId: r?.universalPatientId || r?.patientId || pId,
        phone: r?.phone || r?.phoneNumber || 'N/A',
        type: isDependant ? 'Dependant' : 'Primary',
        status: r?.status || 'N/A',
        dateTime: formatNigeriaDateTime(r?.updatedAt || r?.createdAt),
        isDependant: isDependant,
        raw: r
      };
    });
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return processedRecords;
    const lower = searchTerm.toLowerCase();
    return processedRecords.filter(record =>
      record.patientName.toLowerCase().includes(lower) ||
      String(record.phone).toLowerCase().includes(lower) ||
      record.universalId.toLowerCase().includes(lower)
    );
  }, [processedRecords, searchTerm]);

  const handleSearchToggle = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchTerm('');
    }
  };

  const columns = useMemo(() => [
    {
      key: 'universalId',
      title: 'ID',
      className: 'text-base-content'
    },
    {
      key: 'patientName',
      title: 'Name',
      className: 'font-medium text-base-content',
    },
    {
      key: 'phone',
      title: 'Phone',
      className: 'text-base-content/70'
    },
    {
      key: 'type',
      title: 'Type',
      className: 'text-base-content/70 capitalize'
    },
    {
      key: 'dateTime',
      title: 'Last Updated',
      className: 'text-base-content/70'
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value, row) => (
        <PatientStatusBadge 
          status={value} 
          statusSenderName={row.raw?.statusSenderName}
          updatedAt={row.raw?.updatedAt}
        />
      )
    },
    {
      key: 'actions',
      title: 'Action',
      className: 'text-center',
      render: (_, row) => (
        <button
          onClick={() => navigate(`/frontdesk/patients/${row.patientId}`)}
          className="btn btn-ghost btn-xs text-primary"
        >
          <FaEye className="mr-1" /> View Details
        </button>
      )
    }
  ], [navigate]);

  return (
    <div className="h-[--webkit-fill-available] bg-base-100 shadow-sm border border-base-200 card flex w-full 2xl:pb-2 pb-8">
      <div className="flex pb-8 h-full card-body 2xl:pb-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold 2xl:text-lg text-base-content">Recently Attended To</h3>
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
          </div>
        </div>

        {showSearchBar && (
          <div className="mb-4 transition-all duration-300 ease-in-out">
            <div className="flex relative items-center max-w-md">
              <div className="flex absolute inset-y-0 left-0 z-10 items-center pl-3 pointer-events-none">
                <IoSearch className="w-4 h-4 text-base-content/80" />
              </div>
              <input
                type="text"
                placeholder="Search..."
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
            data={filteredRecords}
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

export default RecentlyAttendedPatients;
