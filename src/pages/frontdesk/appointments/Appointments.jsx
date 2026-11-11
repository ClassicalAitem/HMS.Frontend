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
import { getPatients } from '@/services/api/patientsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { getErrorMessage } from '@/utils/errorHandler';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('7/18/17');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patientsById, setPatientsById] = useState({});

  const mapAppointmentList = useCallback((list) => {
    return list.map((a, idx) => ({
      id: a?.id || a?._id || a?.appointmentId || idx + 1,
      patientId: a?.patientId,
      dependantId: a?.dependantId || null,
      dependant: a?.dependant || null,
      patient: a?.patient || null,
      patientName: a?.patientName || a?.patient?.fullName || a?.patientId || 'Unknown',
      date: a?.appointmentDate || a?.date,
      time: a?.appointmentTime || a?.time, 
      appointmentType: a?.appointmentType || 'consultation',
      department: a?.department || 'doctor',
      status: a?.status || 'Active',
    }));
  }, []);

  const fetchAppointmentsData = useCallback(async () => {
    try {
      const res = await getAllAppointments();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : (raw.appointments ?? []);
      setAppointments(mapAppointmentList(list));
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
        const [appRes, patRes] = await Promise.allSettled([
          getAllAppointments(),
          getPatients()
        ]);

        if (!mounted) return;

        if (appRes.status === 'fulfilled') {
          const raw = appRes.value?.data?.data ?? appRes.value?.data ?? [];
          const list = Array.isArray(raw) ? raw : (raw.appointments ?? []);
          setAppointments(mapAppointmentList(list));
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
      switch (status) {
        case 'completed':
          return 'badge badge-primary text-white';
        case 'scheduled':
          return 'badge badge-outline badge-info';
        case 'cancelled':
          return 'badge badge-error text-white';
        default:
          return 'badge badge-neutral text-white';
      }
    };

    return (
      <div className={getBadgeClass(status)}>
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

  const processedAppointments = useMemo(() => appointments.map(a => ({
    ...a,
    patientName: resolvePatientName(a),
  })), [appointments, patientsById]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'id',
      title: 'S/n',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'patientName',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
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
      className: 'text-base-content/70'
    },
    {
      key: 'time',
      title: 'Time',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'appointmentType',
      title: 'Appointment type',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'department',
      title: 'Department',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value, row) => <StatusBadge status={value} />
    }
  ], []);

  // Get current date for display
  const getCurrentDate = () => {
    return formatNigeriaDate(new Date());
  };

  const handleRowClick = (appointment) => {
    // Use the actual appointment ID from the API, or fall back to the mapped ID
    const appointmentId = appointment.id || appointment.appointmentId || appointment._id;
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
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex gap-3 items-center">
          <button
            className="flex gap-2 items-center btn btn-sm w-full sm:w-auto"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <PiSlidersLight className="w-4 h-4 rotate-90" />
            <span className="text-xs">Filter</span>
          </button>
        </div>

        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <div className="dropdown dropdown-end w-full sm:w-auto">
            <label tabIndex={0} className="flex gap-2 items-center btn btn-outline btn-sm w-full sm:w-auto justify-between">
              <FaCalendarAlt className="w-3 h-3" />
              <span className="text-xs">{selectedDate}</span>
              <FaChevronDown className="w-3 h-3" />
            </label>
            <ul tabIndex={0} className="p-2 mt-1 w-52 shadow dropdown-content menu bg-base-100 rounded-box">
              <li><a onClick={() => setSelectedDate('7/18/17')}>7/18/17</a></li>
              <li><a onClick={() => setSelectedDate('7/19/17')}>7/19/17</a></li>
              <li><a onClick={() => setSelectedDate('7/20/17')}>7/20/17</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="flex flex-1 w-full min-h-0">
        <div className="w-full shadow-xl card bg-base-100">
          <div className="p-4 card-body 2xl:p-6">
            <DataTable
              data={processedAppointments}
              columns={columns}
              searchable={filterOpen}
              sortable={true}
              paginated={true}
              initialEntriesPerPage={10}
              maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
              showEntries={true}
              searchPlaceholder="Search appointments..."
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

