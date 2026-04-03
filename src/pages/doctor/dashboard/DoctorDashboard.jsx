import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import UpcomingAppointments from "./UpcomingAppointments";
import { getMetrics } from "@/services/api/metricsAPI";
import { useAppSelector } from "@/store/hooks";

const DoctorDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMetrics();
        const data = res?.data || {};
        if (mounted) setMetrics(data);
      } catch (e) {
        console.error("DoctorDashboard: metrics fetch error", e);
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
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="w-[687px]">
              <h1 className="text-4xl font-regular">Welcome, Doctor <span className="font-bold text-primary">{`${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}`}</span></h1>
              <p className="text-sm">Your dashboard provides a comprehensive overview of your daily tasks and patient information.</p>
            </div>

            <div className="flex justify-evenly mt-5 gap-4">
              {cards.map((c, idx) => (
                <div key={idx} className="w-full h-[152px] bg-base-100 shadow shadow-lg border p-5 rounded-[10px] ">
                  <div className="flex justify-between">
                    <p className="text-lg font-semibold">{c.label}</p>
                    <img src="/src/assets/images/users.png" alt="..." />
                  </div>
                  {loading ? (
                    <div className="skeleton h-8 w-24 mt-3" />
                  ) : (
                    <h1 className="text-6xl font-semibold mt-3">{c.value}</h1>
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

export default DoctorDashboard;
