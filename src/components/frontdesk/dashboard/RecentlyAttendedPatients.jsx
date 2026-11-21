import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch, IoClose } from "react-icons/io5";
import { FaCalendarAlt, FaEye } from 'react-icons/fa';
import { DataTable } from '@/components/common';
import { getPatients } from '@/services/api/patientsAPI';
import { getDependants } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import PatientStatusBadge from '@/components/common/PatientStatusBadge';
import KolakLoader from '@/components/common/KolakLoader';

const RecentlyAttendedPatients = () => {
  const navigate = useNavigate();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [rawPatients, setRawPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Date filter state: 'all' | 'today' | 'week' | 'month' | 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

        if (mounted) setRawPatients(patients);

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

  const patientMap = useMemo(() => {
    return new Map(rawPatients.map(p => [String(p.id || p._id), p]));
  }, [rawPatients]);

  const processedRecords = useMemo(() => {
    return records.map(r => {
      const isDependant = !!r?.patientId; // Dependants have patientId pointing to guardian
      const guardian = isDependant ? patientMap.get(String(r.patientId)) : null;
      const pId = isDependant ? r.patientId : (r.id || r._id); // The main patient ID
      
      const name = (`${r?.firstName || ''} ${r?.lastName || ''}`).trim() || 'Unknown';
      
      // Resolve hospital ID: prioritize KOLAK- hospitalId from record or guardian
      const hospitalId = r?.hospitalId || r?.dependantHospitalId || guardian?.hospitalId || r?.universalPatientId || (isDependant ? `DEP-${String(r?.id || '').slice(0, 8)}` : `KOLAK-${String(r?.id || '').slice(0, 8)}`);
      const rawDate = new Date(r?.updatedAt || r?.createdAt || 0);

      return {
        id: r?.id || r?._id,
        patientId: pId, // original patient ID to route to
        patientName: name,
        hospitalId,
        phone: r?.phone || r?.phoneNumber || guardian?.phone || 'N/A',
        type: isDependant ? 'Dependant' : 'Primary',
        status: r?.status || 'N/A',
        dateTime: formatNigeriaDateTime(r?.updatedAt || r?.createdAt),
        rawDate,
        isDependant,
        raw: r
      };
    });
  }, [records, patientMap]);

  const filteredRecords = useMemo(() => {
    return processedRecords.filter(record => {
      // 1. Text Search Filter
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const matchesSearch =
          record.patientName.toLowerCase().includes(lower) ||
          String(record.phone).toLowerCase().includes(lower) ||
          String(record.hospitalId).toLowerCase().includes(lower);
        if (!matchesSearch) return false;
      }

      // 2. Date Filter
      if (dateFilter === 'all') return true;
      const recDate = record.rawDate;
      if (!recDate || isNaN(recDate.getTime())) return false;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (dateFilter === 'today') {
        return recDate >= startOfToday && recDate <= endOfToday;
      }
      if (dateFilter === 'week') {
        const dayOfWeek = (startOfToday.getDay() + 6) % 7; // Monday = 0
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - dayOfWeek);
        return recDate >= startOfWeek && recDate <= endOfToday;
      }
      if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return recDate >= startOfMonth && recDate <= endOfToday;
      }
      if (dateFilter === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const s = customStartDate ? new Date(`${customStartDate}T00:00:00`) : new Date(0);
        const e = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : new Date();
        return recDate >= s && recDate <= e;
      }
      return true;
    });
  }, [processedRecords, searchTerm, dateFilter, customStartDate, customEndDate]);

  const handleSearchToggle = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchTerm('');
    }
  };

  const columns = useMemo(() => [
    {
      key: 'hospitalId',
      title: 'ID',
      className: 'text-base-content font-mono font-semibold text-xs',
      render: (value) => (
        <span className="font-mono text-primary font-bold">
          {value || '—'}
        </span>
      )
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold 2xl:text-lg text-base-content">Recently Attended To</h3>
            <span className="badge badge-primary badge-sm font-semibold">
              {filteredRecords.length} Patients
            </span>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleSearchToggle}
              className="btn btn-ghost btn-xs btn-circle text-primary"
              title="Toggle search"
            >
              {showSearchBar ? (
                <IoClose className="w-4 h-4 cursor-pointer" />
              ) : (
                <IoSearch className="w-4 h-4 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 p-2.5 bg-base-200/60 rounded-xl mb-3">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === f.id
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'bg-base-100 text-base-content/70 hover:text-base-content hover:bg-base-300/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers (day range) */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap text-xs w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-base-100 px-2.5 py-1 rounded-lg border border-base-300">
                <span className="text-base-content/60 font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-base-100 px-2.5 py-1 rounded-lg border border-base-300">
                <span className="text-base-content/60 font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {showSearchBar && (
          <div className="mb-4 transition-all duration-300 ease-in-out">
            <div className="flex relative items-center max-w-md">
              <div className="flex absolute inset-y-0 left-0 z-10 items-center pl-3 pointer-events-none">
                <IoSearch className="w-4 h-4 text-base-content/80" />
              </div>
              <input
                type="text"
                placeholder="Search by patient name, KOLAK ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full input input-bordered input-sm rounded-xl text-xs"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSearchToggle}
                className="ml-2 btn btn-ghost btn-xs btn-circle text-error"
              >
                <IoClose className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <KolakLoader />
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
