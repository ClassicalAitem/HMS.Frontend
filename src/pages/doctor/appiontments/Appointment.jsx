import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { DataTable } from "@/components/common";
import { BookAppointmentModal } from "@/components/modals";
import AppointmentDetailsModal from "@/components/modals/AppointmentDetailsModal";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { PiSlidersLight } from "react-icons/pi";
import { toast } from "react-hot-toast";
import { getAllAppointments, createAppointment } from "@/services/api/appointmentsAPI";
import { getPatients } from "@/services/api/patientsAPI";

const Appointment = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState("7/18/17");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patientsById, setPatientsById] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await toast.promise(
          getAllAppointments(),
          {
            loading: "Loading appointments...",
            success: "Appointments loaded",
            error: "Failed to load appointments",
          }
        );
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : raw.appointments ?? [];
        const mapped = list.map((a, idx) => ({
          id: a?.id || a?._id || a?.appointmentId || idx + 1,
          patientId: a?.patientId,
          patientName: a?.patientName || a?.patient?.fullName || a?.patientId || "Unknown",
          date: a?.appointmentDate || a?.date,
          time: a?.appointmentTime || a?.time,
          appointmentType: a?.department || a?.appointmentType || "General",
          status: a?.status || "Active",
        }));
        setAppointments(mapped);
      } catch (err) {
        console.error("Doctor Appointments: load error", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw.data ?? [];
        const map = {};
        list.forEach((p) => {
          const name = `${p?.firstName || ""} ${p?.middleName || ""} ${p?.lastName || ""}`.trim() || "Unknown Patient";
          const idKeys = [p?.id, p?.patientId, p?.uuid, p?.hospitalId].filter(Boolean);
          idKeys.forEach((k) => { map[k] = name; });
        });
        setPatientsById(map);
      } catch (err) {
        console.error("Doctor Appointments: fetch patients error", err);
        setPatientsById({});
      }
    };
    fetchPatients();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const StatusBadge = ({ status }) => {
    const getBadgeClass = (s) => {
      switch ((s || "").toLowerCase()) {
        case "completed":
          return "badge badge-primary text-white";
        case "scheduled":
          return "badge badge-outline badge-info";
        case "cancelled":
          return "badge badge-error text-white";
        default:
          return "badge badge-neutral text-white";
      }
    };
    return <div className={getBadgeClass(status)}>{status}</div>;
  };

  const resolvePatientName = (a) => {
    const pid = a?.patientId || a?.patient?._id || a?.patient?.id;
    const resolved = pid ? patientsById[pid] : undefined;
    return resolved || a?.patientName || a?.patient?.fullName || "Unknown";
  };

  const processedAppointments = useMemo(() => appointments.map(a => ({
    ...a,
    patientName: resolvePatientName(a),
  })), [appointments, patientsById]);

  const columns = useMemo(() => [
    { key: "id", title: "S/n", sortable: true, className: "text-base-content font-medium" },
    { key: "patientName", title: "Patient Name", sortable: true, className: "text-base-content font-medium" },
    { key: "date", title: "Date", sortable: true, className: "text-base-content/70" },
    { key: "time", title: "Time", sortable: true, className: "text-base-content/70" },
    { key: "appointmentType", title: "Appointment type", sortable: true, className: "text-base-content/70" },
    { key: "status", title: "Status", className: "text-base-content/70", render: (v) => <StatusBadge status={v} /> },
  ], []);

  const getCurrentDate = () => {
    const today = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return today.toLocaleDateString("en-US", options);
  };

  const todayStats = useMemo(() => {
    const isSameDay = (d) => {
      if (!d) return false;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const now = new Date();
        return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth() && parsed.getDate() === now.getDate();
      }
      return false;
    };
    const normalize = (s) => (s || '').toLowerCase();
    let todayTotal = 0, todayConfirmed = 0, pending = 0, confirmed = 0, cancelled = 0;
    processedAppointments.forEach((a) => {
      const status = normalize(a.status);
      if (isSameDay(a.date)) {
        todayTotal += 1;
        if (status.includes('confirmed') || status.includes('completed')) todayConfirmed += 1;
      }
      if (status.includes('pending') || status.includes('await') || status.includes('scheduled')) pending += 1;
      if (status.includes('confirmed') || status.includes('completed')) confirmed += 1;
      if (status.includes('cancel')) cancelled += 1;
    });
    return { todayTotal, todayConfirmed, pending, confirmed, cancelled };
  }, [processedAppointments]);

  const handleRowClick = (appointment) => {
    const appointmentId = appointment.id || appointment.appointmentId || appointment._id;
    if (appointmentId) {
      setSelectedAppointmentId(appointmentId);
      setIsDetailsModalOpen(true);
    } else {
      toast.error("No appointment ID found");
    }
  };

  const handleBookAppointment = async (appointmentData) => {
    try {
      await toast.promise(
        createAppointment(appointmentData),
        { loading: "Saving appointment...", success: "Appointment saved", error: (e) => e?.message || "Failed to save appointment" }
      );
      setIsBookModalOpen(false);
      const res = await getAllAppointments();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : raw.appointments ?? [];
      const mapped = list.map((a, idx) => ({
        id: a?.id || a?._id || a?.appointmentId || idx + 1,
        patientId: a?.patientId,
        patientName: a?.patientName || a?.patient?.fullName || a?.patientId || "Unknown",
        date: a?.appointmentDate || a?.date,
        time: a?.appointmentTime || a?.time,
        appointmentType: a?.department || a?.appointmentType || "General",
        status: a?.status || "Active",
      }));
      setAppointments(mapped);
    } catch (err) {
      console.error("Doctor Appointments: create error", err);
    }
  };

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Appointments</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">{getCurrentDate()}</p>
            </div>
            <button className="btn btn-primary btn-sm 2xl:btn-md" onClick={() => setIsBookModalOpen(true)}>
              <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs 2xl:text-sm">Book Appointment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg border border-base-300 bg-base-100">
              <div className="text-sm text-base-content">Today's Appointment</div>
              <div className="mt-2 text-3xl font-semibold text-base-content">{todayStats.todayTotal}</div>
              <div className="text-xs text-base-content/70">{todayStats.todayConfirmed} confirmed</div>
            </div>
            <div className="p-4 rounded-lg border border-base-300 bg-base-100">
              <div className="text-sm text-base-content">Pending</div>
              <div className="mt-2 text-3xl font-semibold text-base-content">{todayStats.pending}</div>
              <div className="text-xs text-base-content/70">Awaiting confirmation</div>
            </div>
            <div className="p-4 rounded-lg border border-base-300 bg-base-100">
              <div className="text-sm text-base-content">Confirmed</div>
              <div className="mt-2 text-3xl font-semibold text-base-content">{todayStats.confirmed}</div>
              <div className="text-xs text-base-content/70">Ready to proceed</div>
            </div>
            <div className="p-4 rounded-lg border border-base-300 bg-base-100">
              <div className="text-sm text-base-content">Cancelled</div>
              <div className="mt-2 text-3xl font-semibold text-base-content">{todayStats.cancelled}</div>
              <div className="text-xs text-base-content/70">Cancelled Today</div>
            </div>
          </div>

          <div className="flex gap-4 justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <button className="flex gap-2 items-center btn btn-sm" onClick={() => setFilterOpen(!filterOpen)}>
                <PiSlidersLight className="w-4 h-4 rotate-90" />
                <span className="text-xs">Filter</span>
              </button>
            </div>
            <div className="flex gap-3 items-center">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="flex gap-2 items-center btn btn-outline btn-sm">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span className="text-xs">{selectedDate}</span>
                  <FaChevronDown className="w-3 h-3" />
                </label>
                <ul tabIndex={0} className="p-2 mt-1 w-52 shadow dropdown-content menu bg-base-100 rounded-box">
                  <li><a onClick={() => setSelectedDate("7/18/17")}>7/18/17</a></li>
                  <li><a onClick={() => setSelectedDate("7/19/17")}>7/19/17</a></li>
                  <li><a onClick={() => setSelectedDate("7/20/17")}>7/20/17</a></li>
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
        </div>
      </div>

      <BookAppointmentModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} onSubmit={handleBookAppointment} />
      <AppointmentDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} appointmentId={selectedAppointmentId} onUpdated={(updated) => {
        setAppointments(prev => prev.map(a => (
          a.id === (updated?.id || updated?._id || updated?.appointmentId) ? { ...a, status: updated?.status } : a
        )))
      }} />
    </div>
  );
};

export default Appointment;
