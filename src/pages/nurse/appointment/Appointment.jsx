import React, { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { DataTable } from "@/components/common";
import { BookAppointmentModal } from "@/components/modals";
import { getAllAppointments, updateAppointment, createAppointment } from "@/services/api/appointmentsAPI";
import { getPatients } from "@/services/api/patientsAPI";

const Appointment = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [patientsById, setPatientsById] = useState({});
  const [selectedDate, setSelectedDate] = useState('7/18/17');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };


  useEffect(() => {
    const load = async () => {
      try {
        const res = await toast.promise(
          getAllAppointments(),
          {
            loading: 'Loading appointments...',
            success: 'Appointments loaded',
            error: 'Failed to load appointments'
          },
          { id: 'nurse-appointments-load' }
        );
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw.appointments ?? []);
        const mapped = list.map((a, idx) => ({
          id: a?.id || a?._id || a?.appointmentId || idx + 1,
          patientId: a?.patientId,
          patientName: a?.patientName || a?.patient?.fullName || a?.patientId || 'Unknown',
          date: a?.appointmentDate || a?.date,
          time: a?.appointmentTime || a?.time,
          appointmentType: a?.department || a?.appointmentType || 'General',
          status: a?.status || 'Active',
        }));
        setAppointments(mapped);
      } catch (err) {
        console.error('Nurse Appointments: load error', err);
      }
    };
    load();
  }, []);



  const [showModal, setShowModal] = useState(false);
  const handleModalSubmit = async (formData) => {
    try {
      // const response = await createAppointment(payload)
      // const createAppointment = response.data

      // TODO: integrate createAppointment API here and refresh list
      // For now, simply close after submit to mirror frontdesk modal behavior
      setShowModal(false);
      onRefresh();
    } catch (e) {
      console.error("Appointment submit failed", e);
    }
  };

  const handleRowClick = (appointment) => {
    const appointmentId = appointment.id || appointment.appointmentId || appointment._id;
    if (appointmentId) {
      setSelectedAppointmentId(appointmentId);
      setIsDetailsModalOpen(true);
    } else {
      toast.error('No appointment ID found');
    }
  };

  // Fetch patients map for resolving patientId -> name
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw.data ?? []);
        const map = {};
        list.forEach((p) => {
          const name = `${p?.firstName || ''} ${p?.middleName || ''} ${p?.lastName || ''}`.trim() || 'Unknown Patient';
          const idKeys = [p?.id, p?.patientId, p?.uuid, p?.hospitalId].filter(Boolean);
          idKeys.forEach((k) => { map[k] = name; });
        });
        setPatientsById(map);
      } catch (err) {
        console.error('Fetch patients for name resolution failed', err);
        setPatientsById({});
      }
    };
    fetchPatients();
  }, []);

  const resolvePatientName = (a) => {
    const pid = a?.patientId || a?.patient?._id || a?.patient?.id;
    const resolved = pid ? patientsById[pid] : undefined;
    return resolved || a?.patientName || a?.patient?.fullName || 'Unknown';
  };

  const processedAppointments = useMemo(() => appointments.map(a => ({
    ...a,
    patientName: resolvePatientName(a),
  })), [appointments, patientsById, resolvePatientName]);

  const columns = useMemo(() => [
    { key: 'id', title: 'S/n', sortable: true, className: 'text-base-content font-medium' },
    { key: 'patientName', title: 'Patient Name', sortable: true, className: 'text-base-content font-medium' },
    { key: 'date', title: 'Date', sortable: true, className: 'text-base-content/70' },
    { key: 'time', title: 'Time', sortable: true, className: 'text-base-content/70' },
    { key: 'appointmentType', title: 'Appointment type', sortable: true, className: 'text-base-content/70' },
    { key: 'status', title: 'Status', className: 'text-base-content/70', render: (value) => <span className="badge badge-outline">{value}</span> },
  ], []);

  const getCurrentDate = () => {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };
  return (
    <>
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <section>
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Appointments</h1>
                <p className="text-sm text-base-content/60 2xl:text-base">{getCurrentDate()}</p>
              </div>
               <button 
                 className="btn btn-primary btn-sm 2xl:btn-md"
                 onClick={() => setIsBookModalOpen(true)}
               >
                 <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
                 <span className="text-xs 2xl:text-sm">Book Appointment</span>
               </button>
            </div>

            <div className="flex gap-4 justify-between items-center mb-6">
              <div className="flex gap-3 items-center">
                <button 
                  className="flex gap-2 items-center btn btn-sm"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <svg className="w-4 h-4 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M7 12h10M10 18h4" strokeWidth="2" strokeLinecap="round"/></svg>
                  <span className="text-xs">Filter</span>
                </button>
              </div>
              
              <div className="flex gap-3 items-center">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="flex gap-2 items-center btn btn-outline btn-sm">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7V3m8 4V3M3 11h18M5 19h14" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span className="text-xs">{selectedDate}</span>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round"/></svg>
                  </label>
                  <ul tabIndex={0} className="p-2 mt-1 w-52 shadow dropdown-content menu bg-base-100 rounded-box">
                    <li><a onClick={() => setSelectedDate('7/18/17')}>7/18/17</a></li>
                    <li><a onClick={() => setSelectedDate('7/19/17')}>7/19/17</a></li>
                    <li><a onClick={() => setSelectedDate('7/20/17')}>7/20/17</a></li>
                  </ul>
                </div>
              </div>
            </div>

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
          </section>
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
        setAppointments(prev => prev.map(a => (
          a.id === (updated?.id || updated?._id || updated?.appointmentId) ?
            { ...a, status: updated?.status } : a
        )));
      }}
    />
    </>
  );
};

export default Appointment;
