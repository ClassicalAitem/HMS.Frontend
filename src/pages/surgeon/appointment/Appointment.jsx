import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/surgeon/dashboard';
import { DataTable } from '@/components/common';
import { BookAppointmentModal } from '@/components/modals';
import AppointmentDetailsModal from '@/components/modals/AppointmentDetailsModal';
import { FaCalendarAlt, FaPlus, FaFileMedical, FaEye } from 'react-icons/fa';
import { PiSlidersLight } from 'react-icons/pi';
import { toast } from 'react-hot-toast';
import { getAllAppointments, createAppointment } from '@/services/api/appointmentsAPI';
import { getPatients } from '@/services/api/patientsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

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
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('surgery'); // 'surgery' | 'all'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patientsById, setPatientsById] = useState({});

  const loadAppointments = async () => {
    try {
      const res = await getAllAppointments();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : raw.appointments ?? [];

      const mapped = list.map((a, idx) => ({
        id: a?.id || a?._id || a?.appointmentId || idx + 1,
        patientId: a?.patient?.hospitalId || a?.patientId,
        dependantId: a?.dependantId || null,
        dependant: a?.dependant || null,
        patient: a?.patient || null,
        patientName:
          a?.patientName || a?.patient?.fullName || a?.patientId || 'Unknown',
        date: a?.appointmentDate || a?.date,
        time: a?.appointmentTime || a?.time,
        appointmentType: a?.appointmentType || 'consultation',
        procedureName: a?.procedureName || 'Surgical Procedure',
        procedureCode: a?.procedureCode || '',
        department: a?.department || 'surgeon',
        status: a?.status || 'scheduled',
        raw: a,
      }));

      setAppointments(mapped);
    } catch (err) {
      toast.error('Failed to load appointments');
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw.data ?? [];
        const map = {};
        list.forEach((p) => {
          const name =
            `${p?.firstName || ''} ${p?.middleName || ''} ${p?.lastName || ''}`.trim() ||
            'Unknown Patient';
          const idKeys = [p?.id, p?.patientId, p?.uuid, p?.hospitalId].filter(
            Boolean,
          );
          idKeys.forEach((k) => {
            map[k] = name;
          });
        });
        setPatientsById(map);
      } catch {
        setPatientsById({});
      }
    };
    fetchPatients();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const resolvePatientName = (a) => {
    if (a?.dependantId) {
      const depName =
        `${a?.dependant?.firstName || ''} ${a?.dependant?.lastName || ''}`.trim();
      return depName || 'Dependant';
    }
    const pid = a?.patientId || a?.patient?._id || a?.patient?.id;
    const resolved = pid ? patientsById[pid] : undefined;
    return resolved || a?.patientName || a?.patient?.fullName || 'Unknown';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const processedAppointments = useMemo(() => {
    let list = appointments.map((a) => ({
      ...a,
      patientName: resolvePatientName(a),
    }));

    if (typeFilter === 'surgery') {
      list = list.filter((a) => {
        const type = String(a.appointmentType || '').toLowerCase();
        if (type.includes('injection')) return false;
        
        return type === 'surgery' || String(a.department || '').toLowerCase() === 'surgeon';
      });
    }

    return list
      .filter((a) => isAppointmentInDateRange(a.date, dateFilter, customStartDate, customEndDate))
      .sort((a, b) => {
        const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00:00'}`).getTime();
        const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00:00'}`).getTime();
        if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      });
  }, [appointments, patientsById, typeFilter, dateFilter, customStartDate, customEndDate]);

  const handleStartSurgicalNote = (row, e) => {
    if (e) e.stopPropagation();
    navigate('/dashboard/surgeon/write-surgical-note', {
      state: { from: 'appointment', appointmentSnapshot: row.raw || row },
    });
  };

  const columns = useMemo(
    () => [
      {
        key: 'serialNumber',
        title: 'S/N',
        sortable: true,
        className: 'w-12 text-base-content font-medium',
        render: (_, __, idx) => idx + 1,
      },
      {
        key: 'patientName',
        title: 'Patient Name',
        sortable: true,
        className: 'text-base-content font-medium',
        render: (value, row) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base-content">{value}</span>
              {row.dependantId && (
                <span className="badge badge-secondary badge-xs">
                  Dependant
                </span>
              )}
            </div>
            {row.patientId && (
              <span className="text-[11px] text-base-content/50 font-mono">
                ID: {row.patientId}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'appointmentType',
        title: 'Procedure / Type',
        sortable: true,
        className: 'text-base-content',
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-xs">
              {row.procedureName || value}
            </span>
            {row.procedureCode && (
              <span className="text-[11px] text-base-content/50 font-mono">
                {row.procedureCode}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'date',
        title: 'Date & Time',
        sortable: true,
        className: 'text-base-content/70 text-xs',
        render: (value, row) => (
          <div className="flex flex-col">
            <span>{value ? formatNigeriaDate(value) : '—'}</span>
            <span className="text-base-content/50 font-medium">
              {row.time || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'department',
        title: 'Department',
        sortable: true,
        className: 'text-base-content/70 capitalize text-xs',
      },
      {
        key: 'status',
        title: 'Status',
        className: 'text-base-content/70',
        render: (value) => (
          <span
            className={`badge badge-sm font-semibold capitalize ${
              value === 'completed'
                ? 'badge-success text-white'
                : value === 'in_theatre'
                ? 'badge-warning'
                : value === 'cancelled'
                ? 'badge-error text-white'
                : 'badge-ghost'
            }`}
          >
            {value?.replace('_', ' ') || 'scheduled'}
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'Actions',
        className: 'text-right',
        render: (_, row) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {row.appointmentType === 'surgery' && (
              <button
                type="button"
                className="btn btn-xs btn-primary gap-1 font-semibold text-white shadow-xs"
                onClick={(e) => handleStartSurgicalNote(row, e)}
              >
                <FaFileMedical className="w-3 h-3" />
                Write Note
              </button>
            )}
            <button
              type="button"
              className="btn btn-xs btn-ghost gap-1"
              onClick={() => {
                setSelectedAppointmentId(row.id);
                setIsDetailsModalOpen(true);
              }}
            >
              <FaEye className="w-3 h-3 text-base-content/60" />
              View
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleRowClick = (appointment) => {
    const appointmentId =
      appointment.id || appointment.appointmentId || appointment._id;
    if (appointmentId) {
      setSelectedAppointmentId(appointmentId);
      setIsDetailsModalOpen(true);
    }
  };

  const handleBookAppointment = async (appointmentData) => {
    try {
      await toast.promise(createAppointment(appointmentData), {
        loading: 'Saving appointment...',
        success: 'Appointment saved',
        error: (e) => e?.message || 'Failed to save appointment',
      });
      setIsBookModalOpen(false);
      loadAppointments();
    } catch {
      toast.error('Failed to book appointment');
    }
  };

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 lg:p-8 h-full gap-6">
          {/* HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FaCalendarAlt className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Surgeon Appointments & Theater Bookings
                </h1>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                {formatNigeriaDate(new Date())} • Comprehensive surgical & clinical schedule
              </p>
            </div>

            <button
              className="btn btn-primary btn-sm gap-1.5 font-semibold text-white shadow-xs"
              onClick={() => setIsBookModalOpen(true)}
            >
              <FaPlus className="w-3.5 h-3.5" />
              Book Appointment
            </button>
          </div>

          {/* FILTER TABS */}
          <div className="card bg-base-100 p-3.5 shadow-sm border border-base-200 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-base-content/60 mr-1">Type:</span>
                <div className="join">
                  <button
                    className={`btn btn-xs join-item ${
                      typeFilter === 'surgery'
                        ? 'btn-primary text-white'
                        : 'btn-ghost'
                    }`}
                    onClick={() => setTypeFilter('surgery')}
                  >
                    Surgeries / Procedures
                  </button>
                  <button
                    className={`btn btn-xs join-item ${
                      typeFilter === 'all' ? 'btn-primary text-white' : 'btn-ghost'
                    }`}
                    onClick={() => setTypeFilter('all')}
                  >
                    All Appointments ({appointments.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/60 font-medium">
                  Showing <strong className="text-primary font-bold">{processedAppointments.length}</strong> records
                </span>
                <button
                  className="btn btn-sm btn-ghost gap-2 border border-base-300"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <PiSlidersLight className="w-4 h-4 rotate-90" />
                  <span className="text-xs font-semibold">
                    {filterOpen ? 'Hide Search' : 'Search Table'}
                  </span>
                </button>
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

          {/* TABLE CONTAINER */}
          <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <DataTable
                data={processedAppointments}
                columns={columns}
                searchable={filterOpen}
                sortable={true}
                paginated={true}
                initialEntriesPerPage={10}
                maxHeight="max-h-[550px]"
                showEntries={true}
                searchPlaceholder="Search patients, procedures, or departments..."
                onRowClick={handleRowClick}
              />
            </div>
          </div>
        </div>
      </div>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSubmit={handleBookAppointment}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointmentId={selectedAppointmentId}
        onUpdated={(updated) => {
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === (updated?.id || updated?._id || updated?.appointmentId)
                ? { ...a, status: updated?.status }
                : a,
            ),
          );
        }}
      />
    </div>
  );
};

export default Appointments;
