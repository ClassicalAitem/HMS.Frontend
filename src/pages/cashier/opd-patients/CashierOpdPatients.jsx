import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { DataTable } from '@/components/common';
import toast from 'react-hot-toast';
import { deleteOpdPatient, getAllOpdPatients } from '@/services/api/opdPatientAPI';
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import {
  FaEdit,
  FaEye,
  FaTrash,
  FaUserPlus,
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaUndo,
  FaPhoneAlt,
  FaUserInjured,
  FaVenusMars,
  FaClock,
  FaCheckCircle,
} from 'react-icons/fa';
import KolakLoader from '@/components/common/KolakLoader';

const isDateInPeriod = (dateVal, period, customStart, customEnd) => {
  if (period === 'all') return true;
  if (!dateVal) return false;

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  if (period === 'today') {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (period === 'month') {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === 'custom') {
    if (!customStart && !customEnd) return true;
    const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date(8640000000000000);
    return d >= start && d <= end;
  }

  return true;
};

const exportToCsv = (filename, headers, rows) => {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const CashierOpdPatients = () => {
  const navigate = useNavigate();
  const [opdPatients, setOpdPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'male' | 'female'
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const patientsResponse = await getAllOpdPatients();
      const patientsData = Array.isArray(patientsResponse)
        ? patientsResponse
        : patientsResponse?.data ?? [];
      setOpdPatients(patientsData);
    } catch (error) {
      console.error('Failed to fetch OPD patients:', error);
      toast.error('Failed to load OPD patients');
      setOpdPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm('Are you sure you want to delete this OPD patient record?')) {
        try {
          await deleteOpdPatient(id);
          toast.success('OPD patient deleted successfully');
          setOpdPatients((prev) => prev.filter((p) => p.id !== id));
        } catch (error) {
          console.error('Failed to delete OPD patient:', error);
          toast.error('Failed to delete OPD patient');
        }
      }
    },
    []
  );

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return opdPatients.filter((p) => {
      // Date filter
      if (!isDateInPeriod(p.createdAt, periodFilter, customStartDate, customEndDate)) {
        return false;
      }
      // Gender filter
      if (genderFilter !== 'all' && String(p.gender || '').toLowerCase() !== genderFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && String(p.status || '').toLowerCase() !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [opdPatients, periodFilter, customStartDate, customEndDate, genderFilter, statusFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = opdPatients.length;
    const now = new Date();
    let todayCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let awaitingCount = 0;

    opdPatients.forEach((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (
        d &&
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        todayCount += 1;
      }

      const g = String(p.gender || '').toLowerCase();
      if (g === 'male') maleCount += 1;
      else if (g === 'female') femaleCount += 1;

      const s = String(p.status || '').toLowerCase();
      if (s === 'awaiting_cashier' || s === 'pending') awaitingCount += 1;
    });

    return {
      total,
      todayCount,
      maleCount,
      femaleCount,
      awaitingCount,
    };
  }, [opdPatients]);

  const handleResetFilters = () => {
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setGenderFilter('all');
    setStatusFilter('all');
  };

  const isFilterActive =
    periodFilter !== 'all' ||
    genderFilter !== 'all' ||
    statusFilter !== 'all' ||
    customStartDate ||
    customEndDate;

  const handleExportCSV = () => {
    if (filteredPatients.length === 0) {
      toast.error('No OPD patients to export');
      return;
    }

    const headers = [
      'ID',
      'Full Name',
      'Phone Number',
      'Gender',
      'Date of Birth',
      'Address',
      'Service Charge',
      'Status',
      'Date Added',
    ];

    const rows = filteredPatients.map((p) => [
      p.id,
      p.fullName,
      p.phone || 'N/A',
      p.gender || 'Not specified',
      p.dob ? formatNigeriaDate(p.dob) : 'N/A',
      p.address || 'N/A',
      p.serviceCharge?.name || 'N/A',
      p.status || 'awaiting_cashier',
      formatNigeriaDateTime(p.createdAt),
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Kolak_OPD_Patients_${dateStr}.csv`, headers, rows);
    toast.success(`Exported ${filteredPatients.length} OPD patients!`);
  };

  const processedPatients = useMemo(() => {
    return filteredPatients.map((patient, index) => ({
      ...patient,
      serialNumber: index + 1,
      gender: patient.gender || 'Not specified',
      dobFormatted: patient.dob ? formatNigeriaDate(patient.dob) : 'Not specified',
      createdAtFormatted: formatNigeriaDate(patient.createdAt),
      dateTimeFormatted: formatNigeriaDateTime(patient.createdAt),
      actions: patient.id,
    }));
  }, [filteredPatients]);

  const columns = useMemo(
    () => [
      {
        key: 'serialNumber',
        title: '#',
        sortable: true,
        className: 'text-center font-bold text-xs text-base-content/60 w-12',
        render: (val) => (
          <span className="w-6 h-6 rounded-full bg-base-200 text-base-content/70 font-semibold text-xs inline-flex items-center justify-center">
            {val}
          </span>
        ),
      },
      {
        key: 'fullName',
        title: 'Patient Profile',
        sortable: true,
        className: 'text-base-content font-medium',
        render: (value, row) => {
          const initial = (value || 'P')[0].toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                {initial}
              </div>
              <div className="min-w-0">
                <button
                  onClick={() => navigate(`/cashier/opd-patient-details/${row.id}`)}
                  className="font-bold text-sm text-base-content hover:text-primary transition-colors text-left truncate block max-w-[200px]"
                >
                  {value}
                </button>
                <div className="flex items-center gap-2 text-xs text-base-content/60 mt-0.5">
                  <span>DOB: {row.dobFormatted}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'phone',
        title: 'Contact',
        sortable: true,
        className: 'text-base-content/70 text-xs sm:text-sm',
        render: (value, row) => (
          <div>
            <div className="flex items-center gap-1.5 font-medium text-base-content">
              <FaPhoneAlt className="w-2.5 h-2.5 text-primary" />
              <span>{value || 'N/A'}</span>
            </div>
            {row.address && (
              <span className="text-xs text-base-content/50 truncate block max-w-[180px] mt-0.5">
                {row.address}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'gender',
        title: 'Gender',
        sortable: true,
        render: (value) => {
          const g = String(value || '').toLowerCase();
          const isMale = g === 'male';
          const isFemale = g === 'female';

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isMale
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : isFemale
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-base-200 text-base-content/70 border-base-300'
              }`}
            >
              <span className="capitalize">{value}</span>
            </span>
          );
        },
      },
      {
        key: 'serviceCharge',
        title: 'Service / Charge',
        sortable: true,
        render: (value, row) => (
          <div>
            <span className="font-semibold text-xs text-base-content block">
              {row.serviceCharge?.name || 'General OPD'}
            </span>
            {row.serviceCharge?.amount ? (
              <span className="text-xs font-bold text-primary">
                ₦{Number(row.serviceCharge.amount).toLocaleString()}
              </span>
            ) : (
              <span className="text-[11px] text-base-content/50">Fee at cashier</span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        render: (value) => {
          const s = String(value || 'awaiting_cashier').toLowerCase();
          const isCompleted = s === 'completed';

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isCompleted ? (
                <>
                  <FaCheckCircle className="w-2.5 h-2.5" /> Settled
                </>
              ) : (
                <>
                  <FaClock className="w-2.5 h-2.5" /> Awaiting Cashier
                </>
              )}
            </span>
          );
        },
      },
      {
        key: 'createdAtFormatted',
        title: 'Registered On',
        sortable: true,
        className: 'text-base-content/70 text-xs sm:text-sm',
        render: (value, row) => (
          <div className="text-xs">
            <span className="font-medium text-base-content">{value}</span>
          </div>
        ),
      },
      {
        key: 'actions',
        title: 'Action',
        className: 'text-center',
        render: (patientId, row) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => navigate(`/cashier/opd-patient-details/${patientId}`)}
              className="btn btn-ghost btn-xs text-primary"
              title="View Details"
            >
              <FaEye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate(`/cashier/opd-patients/${patientId}/edit`)}
              className="btn btn-ghost btn-xs text-info"
              title="Edit Patient"
            >
              <FaEdit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(patientId)}
              className="btn btn-ghost btn-xs text-error"
              title="Delete Patient"
            >
              <FaTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, handleDelete]
  );

  return (
    <CashierLayout>
      {isLoading && <KolakLoader fullscreen />}

      <div className="p-3 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
              OPD Patients
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              Manage non-card out-of-pocket registrations, emergency consultations, and direct billing settlements.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="btn btn-outline btn-primary btn-sm gap-2 shadow-sm"
              title="Export OPD patients to CSV"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchData}
              className="btn btn-ghost btn-square btn-sm"
              title="Refresh Data"
            >
              <FaUndo className="w-3.5 h-3.5 text-base-content/70" />
            </button>
            <button
              onClick={() => navigate('/cashier/opd-patients/new')}
              className="btn btn-primary btn-sm gap-2 shadow-sm font-semibold"
            >
              <FaUserPlus className="w-3.5 h-3.5" />
              <span>Create OPD Patient</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Total OPD Patients
              </p>
              <h3 className="text-2xl font-black text-base-content mt-1">
                {summaryMetrics.total}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Recorded in directory</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FaUserInjured className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Registered Today
              </p>
              <h3 className="text-2xl font-black text-primary mt-1">
                {summaryMetrics.todayCount}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">New intake today</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FaCalendarAlt className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Awaiting Settlement
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {summaryMetrics.awaitingCount}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Pending payment</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FaClock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Gender Profile
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  {summaryMetrics.maleCount} M
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
                  {summaryMetrics.femaleCount} F
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-1">Patient breakdown</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FaVenusMars className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-base-100 rounded-2xl p-4 border border-base-200 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Period Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider mr-1 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3 text-primary" /> Period:
              </span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodFilter(p.id)}
                  className={`btn btn-xs rounded-full px-3 transition-all ${
                    periodFilter === p.id
                      ? 'btn-primary font-bold shadow-sm'
                      : 'btn-ghost text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Gender Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                  <FaFilter className="w-3 h-3 text-primary" /> Gender:
                </span>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="select select-bordered select-xs rounded-lg text-xs"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered select-xs rounded-lg text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="awaiting_cashier">Awaiting Cashier</option>
                  <option value="completed">Completed / Settled</option>
                </select>
              </div>

              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-ghost btn-xs text-error gap-1"
                  title="Reset all filters"
                >
                  <FaUndo className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Pickers */}
          {periodFilter === 'custom' && (
            <div className="pt-3 border-t border-base-200 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-base-content/70">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="input input-bordered input-xs rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-base-content/70">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="input input-bordered input-xs rounded-lg text-xs"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="btn btn-ghost btn-xs text-xs"
                >
                  Clear Dates
                </button>
              )}
            </div>
          )}

          {/* Record Count Badge */}
          <div className="pt-2 border-t border-base-200/60 flex items-center justify-between text-xs text-base-content/60">
            <span>
              Showing <strong className="text-primary font-bold">{filteredPatients.length}</strong> of{' '}
              {opdPatients.length} OPD patients
            </span>
            {isFilterActive && (
              <span className="badge badge-sm badge-ghost text-xs">Filtered view</span>
            )}
          </div>
        </div>

        {/* Data Table Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 w-full min-w-0">
          <div className="card-body p-2 sm:p-5 min-w-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <KolakLoader size="lg" />
              </div>
            ) : processedPatients.length > 0 ? (
              <DataTable
                data={processedPatients}
                columns={columns}
                searchable={true}
                sortable={true}
                paginated={true}
                initialEntriesPerPage={10}
                showEntries={true}
                searchPlaceholder="Search OPD patients by name, phone, address..."
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40 mb-3">
                  <FaUserInjured className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base-content text-base">No OPD patients found</h3>
                <p className="text-xs text-base-content/60 max-w-sm mt-1">
                  {isFilterActive
                    ? 'No records match your active filters. Try resetting the filters or modifying your search query.'
                    : 'There are currently no out-of-pocket patients recorded in the directory.'}
                </p>
                {isFilterActive ? (
                  <button
                    onClick={handleResetFilters}
                    className="btn btn-outline btn-sm btn-primary mt-4"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/cashier/opd-patients/new')}
                    className="btn btn-primary btn-sm mt-4 gap-2"
                  >
                    <FaUserPlus className="w-3.5 h-3.5" />
                    <span>Create First OPD Patient</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierOpdPatients;
