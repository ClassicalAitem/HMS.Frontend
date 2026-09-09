import React, { useEffect, useMemo, useState } from "react";
import { TbCalendarPlus } from "react-icons/tb";
import { IoIosArrowRoundForward } from "react-icons/io";
import { Link } from "react-router-dom";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { getPatientById } from "@/services/api/patientsAPI";

const UpcomingAppointments = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [patientsById, setPatientsById] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await getAllAppointments();
        const raw = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        const now = new Date();
        const upcoming = raw.filter((a) => {
          const status = String(a?.status || "").toLowerCase();
          if (!status.includes("scheduled")) return false;
          const d = a?.appointmentDate;
          const t = a?.appointmentTime;
          if (!d || !t) return false;
          const dt = new Date(`${d}T${t}`);
          if (Number.isNaN(dt.getTime())) return false;
          return dt.getTime() >= now.getTime();
        }).sort((a, b) => {
          const adt = new Date(`${a.appointmentDate}T${a.appointmentTime}`).getTime();
          const bdt = new Date(`${b.appointmentDate}T${b.appointmentTime}`).getTime();
          return adt - bdt;
        });
        if (mounted) setItems(upcoming);
      } catch (e) {
        console.error("UpcomingAppointments: appointments fetch error", e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAppointments();
    return () => { mounted = false; };
  }, []);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  useEffect(() => {
    let mounted = true;
    const map = { ...patientsById };
    pageItems.forEach((item) => {
      if (item.dependantId && item.dependant) {
        map[item.dependantId] = item.dependant.fullName || `${item.dependant.firstName || ""} ${item.dependant.lastName || ""}`.trim() || "Dependant";
      } else if (item.patientId && item.patient) {
        map[item.patientId] = item.patient.fullName || `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.trim() || "Unknown";
      } else if (item.patientId) {
        map[item.patientId] = map[item.patientId] || "Unknown";
      }
    });
    setPatientsById(map);
    return () => { mounted = false; };
  }, [pageItems]);

  const totalPages = Math.ceil(items.length / pageSize) || 1;

  return (
    <section className="mt-10">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <TbCalendarPlus size={29} color="#00943C" />
          <p className="text-[24px]">Upcoming Appointments</p>
        </div>
        <div className="flex items-center text-[20px] text-[#00943C] gap-2">
          <Link to="/dashboard/medical-director/appointments">View All</Link>
          <button>
            <IoIosArrowRoundForward size={32} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow mt-6">
        <table className="w-full text-[16px] rounded-lg overflow-hidden">
          <thead className="bg-base-300">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Appointment Type</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="">
            {loading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={idx} className="border-b last:border-b-0 text-center ">
                  <td className="py-7"><div className="skeleton h-4 w-24 mx-auto" /></td>
                  <td className="py-7"><div className="skeleton h-4 w-20 mx-auto" /></td>
                  <td><div className="skeleton h-4 w-40 mx-auto" /></td>
                  <td><div className="skeleton h-4 w-32 mx-auto" /></td>
                  <td><div className="skeleton h-4 w-24 mx-auto" /></td>
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-base-content/70">No upcoming scheduled appointments</td>
              </tr>
            ) : (
              pageItems.map((a, index) => {
                const dt = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
                const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateObj = new Date(`${a.appointmentDate}T00:00:00`);
                const dateStr = Number.isNaN(dateObj.getTime())
                  ? String(a.appointmentDate || '')
                  : `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                const patientName = patientsById[a.patientId] || "Unknown";
                const type = a.appointmentType || a.department || "Consultation";
                const statusLabel = "Active";
                return (
                  <tr key={index} className="border-b last:border-b-0 text-center ">
                    <td className="py-7">{dateStr}</td>
                    <td className="py-7">{timeStr}</td>
                    <td>
                      <div className="flex flex-col">
                        <span>{patientName}</span>
                        <span className="text-[10px] text-base-content/50 font-mono">ID: {a.dependantId || a.patientId || "—"}</span>
                      </div>
                    </td>
                    <td>{type}</td>
                    <td>
                      <span className="inline-block w-[150px] rounded-[6px] bg-[#8AD3A8]  h-[24px]">{statusLabel}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-4">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <span className="text-sm">{page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      )}
    </section>
  );
};

export default UpcomingAppointments;
