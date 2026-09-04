import React, { useEffect, useMemo, useState } from "react";
import { TbCalendarPlus } from "react-icons/tb";
import { RiArrowRightLine } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { EmptyState } from "@/components/common";

const UpcomingAppointments = () => {
  const navigate = useNavigate();
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
        const raw = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        const now = new Date();
        const upcoming = raw
          .filter((a) => {
            const status = String(a?.status || "").toLowerCase();
            if (!status.includes("scheduled")) return false;
            const d = a?.appointmentDate;
            const t = a?.appointmentTime;
            if (!d || !t) return false;
            const dt = new Date(`${d}T${t}`);
            if (Number.isNaN(dt.getTime())) return false;
            return dt.getTime() >= now.getTime();
          })
          .sort((a, b) => {
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
    return () => {
      mounted = false;
    };
  }, []);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  useEffect(() => {
    let mounted = true;
    const missingIds = pageItems
      .map((i) => i?.patientId)
      .filter((id) => id && !patientsById[id]);
    const unique = Array.from(new Set(missingIds));
    const fetchNames = async () => {
      try {
        const entries = await Promise.all(
          unique.map(async (id) => {
            try {
              const r = await getPatientById(id);
              const d = r?.data || {};
              const name = (
                d?.fullName ||
                `${d?.firstName || ""} ${d?.lastName || ""}`.trim() ||
                d?.name ||
                ""
              ).trim() || "Unknown";
              return [id, name];
            } catch {
              return [id, "Unknown"];
            }
          })
        );
        const map = { ...patientsById };
        entries.forEach(([id, name]) => {
          map[id] = name;
        });
        if (mounted) setPatientsById(map);
      } catch (err) {
        console.error("UpcomingAppointments: patient names fetch error", err);
      }
    };
    if (unique.length > 0) fetchNames();
    return () => {
      mounted = false;
    };
  }, [pageItems, patientsById]);

  const totalPages = Math.ceil(items.length / pageSize) || 1;

  return (
    <div className="w-full bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-base-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <TbCalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-base-content">
                Upcoming Appointments
              </h3>
              <span className="badge badge-primary badge-sm font-bold">
                {items.length}
              </span>
            </div>
            <p className="text-xs text-base-content/60">
              Future scheduled patient consultations and clinic visits
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/doctor/appointments"
          className="btn btn-xs btn-ghost text-primary font-semibold gap-1 hover:bg-primary/10 rounded-lg"
        >
          <span>View All</span>
          <RiArrowRightLine className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full text-xs sm:text-sm">
          <thead className="bg-base-200/50 text-base-content/60 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Patient Name</th>
              <th className="py-3 px-4">Appointment Type</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-200">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4"><div className="skeleton h-4 w-20" /></td>
                  <td className="py-4 px-4"><div className="skeleton h-4 w-16" /></td>
                  <td className="py-4 px-4"><div className="skeleton h-4 w-36" /></td>
                  <td className="py-4 px-4"><div className="skeleton h-4 w-28" /></td>
                  <td className="py-4 px-4 text-center"><div className="skeleton h-6 w-20 rounded-full mx-auto" /></td>
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <EmptyState
                    title="No upcoming appointments"
                    description="No future patient appointments scheduled at this time."
                  />
                </td>
              </tr>
            ) : (
              pageItems.map((a, index) => {
                const dt = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
                const timeStr = dt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateObj = new Date(`${a.appointmentDate}T00:00:00`);
                const dateStr = Number.isNaN(dateObj.getTime())
                  ? String(a.appointmentDate || "")
                  : `${String(dateObj.getDate()).padStart(2, "0")}/${String(
                      dateObj.getMonth() + 1
                    ).padStart(2, "0")}/${dateObj.getFullYear()}`;
                const patientName = patientsById[a.patientId] || "Patient";
                const type = a.appointmentType || a.department || "Consultation";

                return (
                  <tr
                    key={index}
                    className="hover:bg-base-200/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-base-content">
                      {dateStr}
                    </td>
                    <td className="py-3.5 px-4 text-base-content/70">
                      {timeStr}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-base-content">
                      {patientName}
                    </td>
                    <td className="py-3.5 px-4 text-base-content/80 capitalize">
                      {type}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="badge badge-outline badge-success badge-sm font-semibold capitalize px-3 py-1">
                        Scheduled
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-base-200 text-xs text-base-content/60">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="btn btn-xs btn-outline rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="btn btn-xs btn-outline rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;
