import React, { useEffect, useState, useMemo, useRef } from "react";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { LuPlus, LuCheck } from "react-icons/lu";
import { VscSettings } from "react-icons/vsc";
import { BookAppointmentModal } from "@/components/modals";
import { getAllAppointments, updateAppointment } from "@/services/api/appointmentsAPI";
import { getPatients } from "@/services/api/patientsAPI";

const Appointment = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const [patientsById, setPatientsById] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmAppt, setConfirmAppt] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const statusClasses = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("scheduled") || s.includes("active")) return "badge badge-info";
    if (s.includes("completed")) return "badge badge-success";
    if (s.includes("cancel")) return "badge badge-error";
    if (s.includes("pending")) return "badge badge-warning";
    return "badge badge-ghost";
  };

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  };

  const formatTime = (t) => {
    if (!t) return "—";
    // Normalize "12:30:00" to HH:MM
    const parts = String(t).split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return t;
  };

  useEffect(() => {
    let mounted = true;
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await getAllAppointments();
        const data = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
        const mapped = data.map((a, idx) => ({
          id: a?.id || a?.appointmentId || a?.uuid,
          sn: idx + 1,
          patientName:
            a?.patient?.fullName || `${a?.patient?.firstName || ""} ${a?.patient?.lastName || ""}`.trim() || a?.patientName || "Unknown",
          patientId: a?.patient?.hospitalId || a?.hospitalId || a?.patientId || a?.patient?.id,
          date: formatDate(a?.appointmentDate || a?.date),
          rawDate: a?.appointmentDate || a?.date,
          time: formatTime(a?.appointmentTime || a?.time),
          type: a?.appointmentType || a?.department || "consultation",
          status: a?.status || "scheduled",
        }));
        if (mounted) setItems(mapped);
      } catch (err) {
        console.error("Nurse Appointment: fetch error", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAppointments();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const [showModal, setShowModal] = useState(false);
  const handleModalSubmit = async (formData) => {
    try {
      // TODO: integrate createAppointment API here and refresh list
      // For now, simply close after submit to mirror frontdesk modal behavior
      setShowModal(false);
      onRefresh();
    } catch (e) {
      console.error("Appointment submit failed", e);
    }
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleStatusChange = async (appt, newStatus) => {
    if (!appt?.id) return;
    try {
      setUpdatingId(appt.id);
      await updateAppointment(appt.id, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === appt.id ? { ...i, status: newStatus } : i)));
    } catch (e) {
      console.error("Appointment status update failed", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const openConfirm = (appt) => {
    setConfirmAppt(appt);
    setIsConfirmOpen(true);
  };
  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setConfirmAppt(null);
  };
  const confirmComplete = async () => {
    if (!confirmAppt?.id) return;
    try {
      setUpdatingId(confirmAppt.id);
      await updateAppointment(confirmAppt.id, { status: "completed" });
      setItems((prev) => prev.map((i) => (i.id === confirmAppt.id ? { ...i, status: "completed" } : i)));
    } catch (e) {
      console.error("Appointment status update failed", e);
    } finally {
      setUpdatingId(null);
      closeConfirm();
    }
  };

  // Fetch patients map for resolving patientId -> name
  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw.data ?? []);
        const map = {};
        list.forEach((p) => {
          const ids = [p?.id, p?.patientId, p?.hospitalId, p?.uuid].filter(Boolean);
          const name = (`${p?.firstName || ""} ${p?.middleName || ""} ${p?.lastName || ""}`).trim() || p?.fullName || p?.name || "Unknown";
          ids.forEach((id) => {
            if (id && !map[id]) map[id] = name || "Unknown";
          });
        });
        if (mounted) setPatientsById(map);
      } catch (e) {
        console.error("Nurse Appointment: patients fetch error", e);
      }
    };
    loadPatients();
    return () => { mounted = false; };
  }, []);

  const resolvePatientName = (i) => {
    const base = (i?.patientName && i.patientName !== "Unknown") ? i.patientName : "";
    if (base) return base;
    const pid = i?.patientId;
    if (pid && patientsById[pid]) return patientsById[pid] || "Unknown";
    return "Unknown";
  };

  // Close filter dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [isFilterOpen]);

  // Apply filters to items
  const filteredItems = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") {
      const s = statusFilter.toLowerCase();
      list = list.filter((i) => (i.status || "").toLowerCase().includes(s));
    }
    if (typeFilter !== "all") {
      const t = typeFilter.toLowerCase();
      list = list.filter((i) => (i.type || "").toLowerCase().includes(t));
    }
    if (selectedDate) {
      list = list.filter((i) => {
        const d = i.rawDate;
        if (!d) return false;
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return false;
        return dt.toISOString().slice(0, 10) === selectedDate;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => resolvePatientName(i).toLowerCase().includes(q));
    }
    return list;
  }, [items, statusFilter, typeFilter, selectedDate, searchQuery, patientsById]);
  return (
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
            <div className="flex justify-between">
              <div>
                <h5 className="text-[24px] font-[400] text-base-content">Appointments</h5>
                <p className="text-[12px] text-base-content/70">Tuesday, September 9, 2025</p>
              </div>
              <div className="flex items-center">
                <button
                  className="btn btn-primary w-[301px] h-[56px] flex justify-center items-center gap-2"
                  onClick={() => setShowModal(true)}
                >
                  <LuPlus /> Book Appointment
                </button>
              </div>
              <BookAppointmentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleModalSubmit}
              />
            </div>

            {/* filter section */}
            <div className="flex justify-between items-center mt-7">
              <div className="flex items-center w-full max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm w-full"
                  placeholder="Search patient..."
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input input-bordered w-[213px] h-[34px]"
                />
                <div ref={dropdownRef} className={`dropdown ${isFilterOpen ? 'dropdown-open' : ''} dropdown-end dropdown-bottom`}>
                  <button
                    className="btn btn-ghost btn-sm flex items-center"
                    onClick={() => setIsFilterOpen((v) => !v)}
                  >
                    <VscSettings />
                    <span className="text-base-content ml-2">Filter</span>
                  </button>
                  <div className="dropdown-content z-[1000] p-3 shadow bg-base-100 rounded-box w-64">
                    <div className="mb-3">
                      <label className="block mb-1 text-xs font-medium text-base-content">Status</label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="block mb-1 text-xs font-medium text-base-content">Type</label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="consultation">Consultation</option>
                        <option value="follow_up">Follow-up</option>
                        <option value="routine_check">Check-up</option>
                        <option value="lab_test">Lab Test</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="surgery">Surgery</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSelectedDate(''); setIsFilterOpen(false); }}
                      >
                        Clear
                      </button>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow mt-6">
              <table className="w-full text-[16px] rounded-lg overflow-hidden border-collapse">
                <thead className="bg-base-200">
                  <tr>
                    <th className="p-3 py-5">S/n</th>
                    <th className="">Patient Name</th>
                    <th className="">Date</th>
                    <th className="">Time</th>
                    <th className="">Appointment Type</th>
                    <th className="">Status</th>
                  </tr>
                </thead>

                <tbody className="bg-base-100">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td className="p-3 text-center"><div className="skeleton h-4 w-8" /></td>
                        <td className="py-5 text-center"><div className="skeleton h-4 w-40" /></td>
                        <td className="text-center"><div className="skeleton h-4 w-24" /></td>
                        <td className="text-center"><div className="skeleton h-4 w-16" /></td>
                        <td className="text-center"><div className="skeleton h-4 w-32" /></td>
                        <td className="text-center"><div className="skeleton h-6 w-24" /></td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8">
                        <EmptyState
                          title="No appointments"
                          description="Try refreshing to fetch the latest appointments."
                          actionLabel="Refresh"
                          onAction={onRefresh}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((appt, index) => (
                      <tr key={index}>
                        <td className="p-3 text-center">{String(appt.sn).padStart(2, "0")}</td>
                        <td className="py-5 text-center">{resolvePatientName(appt)}</td>
                        <td className="text-center">{appt.date}</td>
                        <td className="text-center">{appt.time}</td>
                        <td className="text-center">{appt.type}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={statusClasses(appt.status)}>{appt.status}</span>
                            <button
                              className="btn btn-ghost btn-xs"
                              title="Mark as completed"
                              onClick={() => openConfirm(appt)}
                              disabled={!appt.id || updatingId === appt.id || (appt.status || '').toLowerCase().includes('completed')}
                            >
                              <LuCheck />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {isConfirmOpen && (
              <div className="modal modal-open">
                <div className="modal-box">
                  <h3 className="font-bold text-lg">Mark as Completed</h3>
                  <p className="py-2 text-sm">
                    Confirm completing appointment for {resolvePatientName(confirmAppt)}
                    {confirmAppt?.date ? ` on ${confirmAppt.date}` : ''}
                    {confirmAppt?.time ? ` at ${confirmAppt.time}` : ''}?
                  </p>
                  <div className="modal-action">
                    <button className="btn btn-ghost" onClick={closeConfirm}>Cancel</button>
                    <button
                      className={`btn btn-primary ${updatingId === confirmAppt?.id ? 'loading' : ''}`}
                      onClick={confirmComplete}
                      disabled={updatingId === confirmAppt?.id}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Appointment;
