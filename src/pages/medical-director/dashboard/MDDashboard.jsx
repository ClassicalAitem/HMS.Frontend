import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/medical-director/dashboard/Sidebar";
import UpcomingAppointments from "./UpcomingAppointments";
import { getMetrics } from "@/services/api/metricsAPI";
import { useAppSelector } from "@/store/hooks";
import KolakLoader from "@/components/common/KolakLoader";

const MDDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMetrics();
        const data = res?.data || {};
        if (mounted) setMetrics(data);
      } catch (e) {
        console.error("Medical Director Dashboard: metrics fetch error", e);
        if (mounted) setMetrics({});
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const cards = useMemo(() => {
    const totalTodayAppointment = Number(metrics?.totalTodayAppointment || 0);
    const totalLabResultCritical = Number(metrics?.totalLabResultCritical || 0);
    const totalLabResultHigh = Number(metrics?.totalLabResultHigh || 0);
    const totalLabResultLow = Number(metrics?.totalLabResultLow || 0);
    const totalLabResultNormal = Number(metrics?.totalLabResultNormal || 0);
    const pendingLabResults = totalLabResultCritical + totalLabResultHigh + totalLabResultLow + totalLabResultNormal;
    const totalDischargedPatients = Number(metrics?.totalDischargedPatients || 0);
    return [
      { label: "Today's Appointments", value: totalTodayAppointment },
      { label: "Pending Lab Results", value: pendingLabResults },
      { label: "Total Patients Discharged", value: totalDischargedPatients },
    ];
  }, [metrics]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-base-100">
      {loading && <KolakLoader fullscreen />}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex-1">
          <section className="p-4 sm:p-7">
            <div className="max-w-full">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-regular">
                Welcome, Medical Director{" "}
                <span className="font-bold text-primary">
                  {`${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}`}
                </span>
              </h1>
              <p className="text-sm">Your dashboard provides a comprehensive overview of your daily tasks and patient information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mt-5 gap-4">
              {cards.map((c, idx) => (
                <div key={idx} className="w-full min-h-[152px] bg-base-100 shadow shadow-lg border p-5 rounded-[10px]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold">{c.label}</p>
                    <img src="/src/assets/images/users.png" alt="..." className="hidden sm:block max-h-12" />
                  </div>
                  {loading ? (
                    <div className="skeleton h-8 w-24 mt-3" />
                  ) : (
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold mt-3">{c.value}</h1>
                  )}
                </div>
              ))}
            </div>

            <div>
              <UpcomingAppointments />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MDDashboard;