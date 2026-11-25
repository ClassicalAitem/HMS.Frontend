import React, { useState, useEffect, useMemo } from 'react';
import { Header, DataTable } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { BookAppointmentModal } from '@/components/modals';
import AppointmentDetailsModal from '@/components/modals/AppointmentDetailsModal';
import { 
  FaCalendarAlt, 
  FaCalendarCheck, 
  FaClock, 
  FaTimesCircle, 
  FaPlus, 
  FaFileExport, 
  FaEye, 
  FaUserCheck,
  FaChild
} from 'react-icons/fa';
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
    const dayOfWeek = (now.getDay() + 6) % 7;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patientsById, setPatientsById] = useState({});

  const fetchAppointmentsData = async () => {
    try {
      setIsLoading(true);
      const [res, surgRes] = await Promise.allSettled([
        getAllAppointments(),
        getAllSurgeries(),
      ]);
      const raw = res.status === 'fulfilled' ? (res.value?.data?.data ?? res.value?.data ?? []) : [];
      const list = Array.isArray(raw) ? raw : (raw.appointments ?? []);
      const rawSurgs = surgRes.status === 'fulfilled' ? (surgRes.value?.data?.data ?? surgRes.value?.data ?? surgRes.value ?? []) : [];
      const surgList = Array.isArray(rawSurgs) ? rawSurgs : [];
      const merged = mergeAppointmentsAndSurgeries(list, surgList);

      const mapped = merged.map((a, idx) => ({
        id: a?.id || a?._id || a?.appointmentId || idx + 1,
        rawId: a?._id || a?.id,
        patientId: a?.patientId,
        dependantId: a?.dependantId || null,
        dependant: a?.dependant || null,
        patient: a?.patient || null,
        patientName: 
          a?.patientName || 
          (a?.dependant ? `${a?.dependant?.firstName || ''} ${a?.dependant?.lastName || ''}`.trim() : null) ||
          (a?.patient ? `${a?.patient?.firstName || ''} ${a?.patient?.lastName || ''}`.trim() : null) || 
          a?.patientId || 
          'Unknown Patient',
        guardianName: a?.dependant && a?.patient ? `${a?.patient?.firstName || ''} ${a?.patient?.lastName || ''}`.trim() : null,
        date: a?.appointmentDate || a?.date,
        time: a?.appointmentTime || a?.time || '—', 
        appointmentType: a?.appointmentType || 'Consultation',
        procedureName: a?.procedureName || '',
        procedureCode: a?.procedureCode || '',
        department: a?.department || 'General Practice',
        status: (a?.status || 'Scheduled').toLowerCase(),
        notes: a?.notes || a?.reason || '—',
        isSurgeryRecord: !!a?.isSurgeryRecord,
        raw: a?.raw || a,
        createdAt: a?.createdAt,
      }));

      setAppointments(mapped);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load appointments'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsData();
  }, []);

  useEffect(() => {
    const fetchPatientsList = async () => {
      try {
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw.data ?? []);
        const map = {};
        list.forEach((p) => {
          const name = `${p?.firstName || ''} ${p?.middleName || ''} ${p?.lastName || ''}`.trim() || 'Unknown Patient';
          const idKeys = [p?.id, p?._id, p?.patientId, p?.hospitalId].filter(Boolean);
          idKeys.forEach((k) => { map[k] = name; });
        });
        setPatientsById(map);
      } catch {
        setPatientsById({});
      }
    };
    fetchPatientsList();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleBookAppointment = async (formData) => {
    try {
      await createAppointment(formData);
      toast.success('Appointment booked successfully!');
      setIsBookModalOpen(false);
      await fetchAppointmentsData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to book appointment'));
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    let badgeClass = 'badge badge-neutral';
    if (s === 'completed') badgeClass = 'badge badge-success text-white';
    else if (s === 'scheduled' || s === 'active') badgeClass = 'badge badge-primary text-white';
    else if (s === 'in_progress' || s === 'in-progress') badgeClass = 'badge badge-info text-white';
    else if (s === 'cancelled') badgeClass = 'badge badge-error text-white';
    else if (s.includes('awaiting')) badgeClass = 'badge badge-warning text-white';

    return (
      <span className={`${badgeClass} text-xs font-semibold uppercase tracking-wider`}>
        {status}
      </span>
    );
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const scheduled = appointments.filter((a) => a.status === 'scheduled' || a.status === 'active').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const today = appointments.filter((a) => {
      if (!a.date) return false;
      const d = new Date(a.date).toISOString().split('T')[0];
      return d === todayStr;
    }).length;

    return { total, completed, scheduled, cancelled, today };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .filter((a) => isAppointmentInDateRange(a.date, dateFilter, customStartDate, customEndDate))
      .sort((a, b) => {
        const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00:00'}`).getTime();
        const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00:00'}`).getTime();
        if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      });
  }, [appointments, statusFilter, dateFilter, customStartDate, customEndDate]);

  const processedData = useMemo(() => {
    return filteredAppointments.map((a, idx) => ({
      ...a,
      serialNumber: idx + 1,
      displayPatientName: patientsById[a.patientId] || a.patientName,
      formattedDate: a.date ? formatNigeriaDate(a.date) : '—',
    }));
  }, [filteredAppointments, patientsById]);

  // Export CSV
  const handleExportCsv = () => {
    if (processedData.length === 0) return toast.info('No appointments to export');
    const headers = ['S/N', 'Patient Name', 'Hospital ID', 'Type', 'Department', 'Date', 'Time', 'Status'];
    const rows = processedData.map((a) => [
      a.serialNumber,
      `"${a.displayPatientName}"`,
      `"${a.patientId || '—'}"`,
      `"${a.appointmentType}"`,
      `"${a.department}"`,
      `"${a.formattedDate}"`,
      `"${a.time}"`,
      `"${a.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Appointments exported to CSV');
  };

  const columns = useMemo(() => [
    {
      key: 'serialNumber',
      title: 'S/n',
      sortable: true,
      className: 'w-12 text-base-content font-medium'
    },
    {
      key: 'displayPatientName',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-primary">{value}</div>
          {row.dependantId && (
            <div className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
              <FaChild className="w-3 h-3" />
              <span>Dependant {row.guardianName ? `(Guardian: ${row.guardianName})` : ''}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'patientId',
      title: 'Patient ID',
      sortable: true,
      className: 'text-base-content/70 font-mono text-xs'
    },
    {
      key: 'department',
      title: 'Department / Doctor',
      sortable: true,
      className: 'text-base-content/70 capitalize'
    },
    {
      key: 'appointmentType',
      title: 'Type',
      sortable: true,
      className: 'text-base-content/70 capitalize'
    },
    {
      key: 'formattedDate',
      title: 'Date & Time',
      sortable: true,
      className: 'text-base-content/70',
      render: (value, row) => (
        <div>
          <span className="font-medium text-base-content">{value}</span>
          <span className="text-xs text-base-content/50 block">{row.time}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      title: 'Action',
      className: 'text-center w-20',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedAppointmentId(row.rawId || row.id);
            setIsDetailsModalOpen(true);
          }}
          className="btn btn-ghost btn-xs text-primary gap-1 hover:bg-primary/10"
        >
          <FaEye className="w-3.5 h-3.5" /> Details
        </button>
      )
    }
  ], []);

  return (
    <div className="flex h-screen bg-base-300/20">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-opacity-50 lg:hidden"
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
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-3 sm:p-6 h-full space-y-5">
          {/* Top Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Appointments</h1>
              <p className="text-xs sm:text-sm text-base-content/60">
                Hospital-wide appointment schedule, consultations, procedures, and booking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportCsv}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <FaFileExport className="w-3.5 h-3.5" /> Export
              </button>
              <button 
                onClick={() => setIsBookModalOpen(true)}
                className="btn btn-primary btn-sm gap-1.5 shadow-md"
              >
                <FaPlus className="w-3.5 h-3.5" /> Book Appointment
              </button>
            </div>
          </div>

          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-base-100 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FaCalendarAlt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-base-content/60">Total</div>
                <div className="text-xl font-bold text-base-content">{metrics.total}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-base-100 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-info/10 text-info">
                <FaClock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-base-content/60">Today's Visits</div>
                <div className="text-xl font-bold text-base-content">{metrics.today}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-base-100 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <FaUserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-base-content/60">Scheduled</div>
                <div className="text-xl font-bold text-base-content">{metrics.scheduled}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-base-100 border border-base-300 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <FaCalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-base-content/60">Completed</div>
                <div className="text-xl font-bold text-base-content">{metrics.completed}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-base-100 border border-base-300 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="p-3 rounded-xl bg-error/10 text-error">
                <FaTimesCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-base-content/60">Cancelled</div>
                <div className="text-xl font-bold text-base-content">{metrics.cancelled}</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-3 bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Status Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-base-content/60 mr-1">Status:</span>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'all' 
                      ? 'bg-primary text-primary-content shadow-sm' 
                      : 'bg-base-200 text-base-content/70 hover:text-base-content'
                  }`}
                >
                  All ({metrics.total})
                </button>
                <button 
                  onClick={() => setStatusFilter('scheduled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'scheduled' 
                      ? 'bg-primary text-primary-content shadow-sm' 
                      : 'bg-base-200 text-base-content/70 hover:text-base-content'
                  }`}
                >
                  Scheduled ({metrics.scheduled})
                </button>
                <button 
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'completed' 
                      ? 'bg-primary text-primary-content shadow-sm' 
                      : 'bg-base-200 text-base-content/70 hover:text-base-content'
                  }`}
                >
                  Completed ({metrics.completed})
                </button>
                <button 
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === 'cancelled' 
                      ? 'bg-primary text-primary-content shadow-sm' 
                      : 'bg-base-200 text-base-content/70 hover:text-base-content'
                  }`}
                >
                  Cancelled ({metrics.cancelled})
                </button>
              </div>

              <div className="text-xs text-base-content/60 font-medium">
                Showing <strong className="text-primary font-bold">{processedData.length}</strong> records
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-base-200">
              <span className="text-xs font-semibold text-base-content/60 mr-1">Date:</span>
              {[
                { id: 'all', label: 'All Dates' },
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
                      : 'bg-base-200 text-base-content/70 hover:text-base-content'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-base-200 text-xs">
                <span className="text-base-content/70 font-semibold flex items-center gap-1">
                  <FaCalendarAlt className="text-primary w-3 h-3" /> Select Day Range:
                </span>
                <div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
                  <span className="text-base-content/60 font-medium">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-base-content"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
                  <span className="text-base-content/60 font-medium">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-base-content"
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
                    Clear Range
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100 border border-base-300">
              <div className="p-4 card-body 2xl:p-6">
                <DataTable
                  data={processedData}
                  columns={columns}
                  loading={isLoading}
                  searchable={true}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={10}
                  maxHeight="max-h-56 sm:max-h-96 md:max-h-72 lg:max-h-96 2xl:max-h-120"
                  showEntries={true}
                  searchPlaceholder="Search by patient, ID, doctor, or department..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <BookAppointmentModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          onBook={handleBookAppointment}
        />
      )}

      {/* Appointment Details Modal */}
      {isDetailsModalOpen && selectedAppointmentId && (
        <AppointmentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedAppointmentId(null);
          }}
          appointmentId={selectedAppointmentId}
          procedureData={appointments.find(a => (a.id === selectedAppointmentId || a.rawId === selectedAppointmentId) && a.isSurgeryRecord)?.raw || null}
          onUpdate={fetchAppointmentsData}
        />
      )}
    </div>
  );
};

export default Appointments;
