/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { DataTable } from '@/components/common';
import KolakLoader from '@/components/common/KolakLoader';
import { BookAppointmentModal } from '@/components/modals';
import AppointmentDetailsModal from '@/components/modals/AppointmentDetailsModal';
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa';
import { PiSlidersLight } from 'react-icons/pi';
import { toast } from 'react-hot-toast';
import { getAllAppointments, createAppointment } from '@/services/api/appointmentsAPI';
import { getAllSurgeries } from '@/services/api/surgeryAPI';
import { mergeAppointmentsAndSurgeries } from '@/utils/appointmentSurgeryMerge';
import { getPatients } from '@/services/api/patientsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { getErrorMessage } from '@/utils/errorHandler';

const isAppointmentInDateRange = (appointmentDateStr, filter, customStart, customEnd) => {
  if (filter === 'all') return true;
  if (!appointmentDateStr) return false;

  // Normalize appointment date
  let aptDate;
  if (typeof appointmentDateStr === 'string' && appointmentDateStr.includes('T')) {
    aptDate = new Date(appointmentDateStr);
  } else if (typeof appointmentDateStr === 'string') {
    const parts = appointmentDateStr.trim().split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 4) {
      aptDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      aptDate = new Date(appointmentDateStr);
    }
  } else {
    aptDate = new Date(appointmentDateStr);
  }

  if (isNaN(aptDate.getTime())) return false;

  const aptYear = aptDate.getFullYear();
  const aptMonth = aptDate.getMonth();
  const aptDay = aptDate.getDate();

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();

  if (filter === 'today') {
    return aptYear === todayYear && aptMonth === todayMonth && aptDay === todayDay;
  }

  const aptTime = new Date(aptYear, aptMonth, aptDay).getTime();

  if (filter === 'week') {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(todayYear, todayMonth, todayDay - dayOfWeek, 0, 0, 0, 0).getTime();
    const endOfWeek = new Date(todayYear, todayMonth, todayDay - dayOfWeek + 6, 23, 59, 59, 999).getTime();
    return aptTime >= startOfWeek && aptTime <= endOfWeek;
  }

  if (filter === 'month') {
    const startOfMonth = new Date(todayYear, todayMonth, 1, 0, 0, 0, 0).getTime();
    const endOfMonth = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999).getTime();
    return aptTime >= startOfMonth && aptTime <= endOfMonth;
  }

  if (filter === 'custom') {
    if (!customStart && !customEnd) return true;
    const s = customStart ? new Date(`${customStart}T00:00:00`).getTime() : 0;
    const e = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : Infinity;
    return aptTime >= s && aptTime <= e;
  }

  return true;
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real date filter: 'all' | 'today' | 'week' | 'month' | 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patientsById, setPatientsById] = useState({});

  const mapAppointmentList = useCallback((list) => {
    return list.map((a, idx) => ({
      id: a?.id || a?._id || a?.appointmentId || idx + 1,
      appointmentId: a?.id || a?._id || a?.appointmentId,
      patientId: a?.patientId,
      dependantId: a?.dependantId || null,
      dependant: a?.dependant || null,
      patient: a?.patient || null,
      patientName: a?.patientName || a?.patient?.fullName || a?.patientId || 'Unknown',
      date: a?.appointmentDate || a?.date,
      time: a?.appointmentTime || a?.time, 
      appointmentType: a?.appointmentType || 'consultation',
      procedureName: a?.procedureName || '',
      procedureCode: a?.procedureCode || '',
      department: a?.department || 'doctor',
      status: a?.status || 'Active',
      isSurgeryRecord: !!a?.isSurgeryRecord,
      raw: a?.raw || a,
      createdAt: a?.createdAt,
    }));
  }, []);

  const fetchAppointmentsData = useCallback(async () => {
    try {
      const [appRes, surgRes] = await Promise.allSettled([
        getAllAppointments(),
        getAllSurgeries(),
      ]);
      const raw = appRes.status === 'fulfilled' ? (appRes.value?.data?.data ?? appRes.value?.data ?? []) : [];
      const list = Array.isArray(raw) ? raw : (raw.appointments ?? []);
      const rawSurgs = surgRes.status === 'fulfilled' ? (surgRes.value?.data?.data ?? surgRes.value?.data ?? surgRes.value ?? []) : [];
      const surgList = Array.isArray(rawSurgs) ? rawSurgs : [];
      setAppointments(mapAppointmentList(mergeAppointmentsAndSurgeries(list, surgList)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load appointments'));
    }
  }, [mapAppointmentList]);

  // Load appointments data and patient lookup
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [appRes, surgRes, patRes] = await Promise.allSettled([
          getAllAppointments(),
          getAllSurgeries(),
          getPatients()
        ]);

        if (!mounted) return;

        if (appRes.status === 'fulfilled' || surgRes.status === 'fulfilled') {
          const raw = appRes.status === 'fulfilled' ? (appRes.value?.data?.data ?? appRes.value?.data ?? []) : [];
          const list = Array.isArray(raw) ? raw : (raw.appointments ?? []);
          const rawSurgs = surgRes.status === 'fulfilled' ? (surgRes.value?.data?.data ?? surgRes.value?.data ?? surgRes.value ?? []) : [];
          const surgList = Array.isArray(rawSurgs) ? rawSurgs : [];
          setAppointments(mapAppointmentList(mergeAppointmentsAndSurgeries(list, surgList)));
        }

        if (patRes.status === 'fulfilled') {
          const raw = patRes.value?.data ?? patRes.value ?? [];
          const list = Array.isArray(raw) ? raw : (raw.data ?? []);
          const map = {};
          list.forEach((p) => {
            const name = `${p?.firstName || ''} ${p?.middleName || ''} ${p?.lastName || ''}`.trim() || 'Unknown Patient';
            const idKeys = [p?.id, p?.patientId, p?.uuid, p?.hospitalId].filter(Boolean);
            idKeys.forEach((k) => { map[k] = name; });
          });
          setPatientsById(map);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadInitialData();
    return () => { mounted = false; };
  }, [mapAppointmentList]);

  const StatusBadge = ({ status }) => {
    const getBadgeClass = (status) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return 'badge badge-primary text-white';
        case 'scheduled':
          return 'badge badge-outline badge-info';
        case 'cancelled':
          return 'badge badge-error text-white';
        case 'in_progress':
          return 'badge badge-warning';
        default:
          return 'badge badge-neutral text-white';
      }
    };

    return (
      <div className={`${getBadgeClass(status)} text-xs font-semibold`}>
        {status}
      </div>
    );
  };

  // Process appointments data
  const resolvePatientName = (a) => {
    if (a?.dependantId) {
      const depName = `${a?.dependant?.firstName || ''} ${a?.dependant?.lastName || ''}`.trim();
      return depName || 'Dependant';
    }
    const pid = a?.patientId || a?.patient?._id || a?.patient?.id;
    const resolved = pid ? patientsById[pid] : undefined;
    return resolved || a?.patientName || a?.patient?.fullName || 'Unknown';
  };

  // Filter and sort appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => isAppointmentInDateRange(a.date, dateFilter, customStartDate, customEndDate))
      .sort((a, b) => {
        const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00:00'}`).getTime();
        const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00:00'}`).getTime();
        if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
          return dateB - dateA;
        }
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      })
      .map((a, index) => ({
        ...a,
        serialNumber: index + 1,
        patientName: resolvePatientName(a),
      }));
  }, [appointments, dateFilter, customStartDate, customEndDate, patientsById]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'serialNumber',
      title: 'S/N',
      sortable: true,
      className: 'text-base-content font-medium w-16',
      render: (value, row, index) => value || index + 1
    },
    {
      key: 'patientName',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{value}</span>
          {row.dependantId && (
            <span className="badge badge-secondary badge-xs">
              {row.dependant?.relationshipType || 'Dependant'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      className: 'text-base-content/70 font-mono text-xs'
    },
    {
      key: 'time',
      title: 'Time',
      sortable: true,
      className: 'text-base-content/70 font-mono text-xs'
    },
    {
      key: 'appointmentType',
      title: 'Appointment Type',
      sortable: true,
      className: 'text-base-content/70 capitalize'
    },
    {
      key: 'department',
      title: 'Department',
      sortable: true,
      className: 'text-base-content/70 capitalize'
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      className: 'text-base-content/70',
      render: (value, row) => <StatusBadge status={value} />
    }
  ], []);

  // Get current date for display
  const getCurrentDate = () => {
    return formatNigeriaDate(new Date());
  };

  const handleRowClick = (appointment) => {
    const appointmentId = appointment.appointmentId || appointment.id || appointment._id;
    if (appointmentId) {
      setSelectedAppointmentId(appointmentId);
      setIsDetailsModalOpen(true);
    } else {
      toast.error('No appointment ID found');
    }
  };

  const handleBookAppointment = async (appointmentData) => {
    try {
      await toast.promise(
        createAppointment(appointmentData),
        {
          loading: 'Saving appointment...',
          success: 'Appointment saved',
          error: (e) => getErrorMessage(e, 'Failed to save appointment')
        }
      );
      setIsBookModalOpen(false);
      await fetchAppointmentsData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to book appointment'));
    }
  };

  const filterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return customStartDate && customEndDate
          ? `${customStartDate} to ${customEndDate}`
          : 'Custom Range';
      default:
        return 'All Appointments';
    }
  }, [dateFilter, customStartDate, customEndDate]);

  return (
    <FrontdeskLayout>
      {isLoading && <KolakLoader fullscreen />}

      {/* Page Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Appointments</h1>
          <p className="text-sm text-base-content/60 2xl:text-base">{getCurrentDate()}</p>
        </div>
        <button
          className="btn btn-primary btn-sm w-full sm:w-auto 2xl:btn-md"
          onClick={() => setIsBookModalOpen(true)}
        >
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs 2xl:text-sm">Book Appointment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 mb-4 rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`flex gap-2 items-center btn btn-sm ${filterOpen ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <PiSlidersLight className="w-4 h-4 rotate-90" />
              <span className="text-xs">Search Filter</span>
            </button>

            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  dateFilter === f.id
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'bg-base-200/80 text-base-content/70 hover:text-base-content hover:bg-base-300/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-base-content/70 font-medium ml-auto">
            Showing <strong className="text-primary font-bold">{filteredAppointments.length}</strong> appointments ({filterLabel})
          </div>
        </div>

        {/* Custom Day Range Picker */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-base-200 text-xs">
            <span className="text-base-content/70 font-semibold flex items-center gap-1">
              <FaCalendarAlt className="text-primary w-3 h-3" /> Select Date Range:
            </span>
            <div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
              <span className="text-base-content/60 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
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
                className="btn btn-ghost btn-xs text-error font-semibold"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Appointments Table */}
      <div className="flex flex-1 w-full min-h-0">
        <div className="w-full shadow-xl card bg-base-100">
          <div className="p-4 card-body 2xl:p-6">
            <DataTable
              data={filteredAppointments}
              columns={columns}
              searchable={filterOpen}
              sortable={true}
              paginated={true}
              initialEntriesPerPage={10}
              maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
              showEntries={true}
              searchPlaceholder="Search appointments by patient, type, department..."
              onRowClick={handleRowClick}
            />
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSubmit={handleBookAppointment}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointmentId={selectedAppointmentId}
        procedureData={appointments.find(a => a.id === selectedAppointmentId && a.isSurgeryRecord)?.raw || null}
        onUpdated={(updated) => {
          setAppointments(prev => prev.map(a => (
            a.id === (updated?.id || updated?._id || updated?.appointmentId) ?
              { ...a, status: updated?.status } : a
          )));
        }}
      />
    </FrontdeskLayout>
  );
};

export default Appointments;
