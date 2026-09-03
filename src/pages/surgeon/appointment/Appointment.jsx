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

const Appointments = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('surgery'); // 'surgery' | 'all' | 'today'
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
        patientId: a?.patientId,
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
    const mapped = appointments.map((a) => ({
      ...a,
      patientName: resolvePatientName(a),
    }));

    if (typeFilter === 'surgery') {
      return mapped.filter(
        (a) =>
          a.appointmentType === 'surgery' ||
          String(a.department || '').toLowerCase() === 'surgeon',
      );
    }
    if (typeFilter === 'today') {
      return mapped.filter((a) => a.date && a.date.includes(todayStr));
    }
    return mapped;
  }, [appointments, patientsById, typeFilter, todayStr]);

  const handleStartSurgicalNote = (row, e) => {
    if (e) e.stopPropagation();
    navigate('/dashboard/surgeon/write-surgical-note', {
      state: { from: 'appointment', appointmentSnapshot: row.raw || row },
    });
  };

  const columns = useMemo(
    () => [
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
          <div className="card bg-base-100 p-4 shadow-sm border border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  typeFilter === 'today' ? 'btn-primary text-white' : 'btn-ghost'
                }`}
                onClick={() => setTypeFilter('today')}
              >
                Today's Bookings
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
