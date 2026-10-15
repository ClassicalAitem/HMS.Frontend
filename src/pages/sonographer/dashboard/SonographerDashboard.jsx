import React, { useState, useEffect } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import toast from "react-hot-toast";
import { FaThLarge, FaCheckCircle, FaClock } from "react-icons/fa";
import { GiUltrasound } from "react-icons/gi";
import { useNotifications } from "@/contexts/NotificationContext";

const SonographerDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = React.useRef(false);
  const { lastUpdate } = useNotifications();

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        if (!hasLoadedRef.current) setLoading(true);

        const relevantStatuses = [
          "awaiting_sonographer",
          "awaiting_radiology",
          "awaiting_sonography",
          "sonography_completed",
          "radiology_completed",
          "sonography_in_progress",
          "radiology_in_progress"
        ].join(",");

        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients({ status: relevantStatuses, limit: 100 }),
          getDependants({ status: relevantStatuses, limit: 100 }),
        ]);

        const patients = patientsRes.status === "fulfilled"
          ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
          : [];
        const dependants = dependantsRes.status === "fulfilled"
          ? (() => {
              const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
              return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
            })()
          : [];

        const allSubjects = [...patients, ...dependants];

        // Count patients awaiting sonography
        const awaitingRadiology = allSubjects.filter(p => {
          if (!p?.status) return false;
          const list = Array.isArray(p.status) ? p.status : [p.status];
          return list.some(s => 
            String(s).toLowerCase() === "awaiting_radiology" ||
            String(s).toLowerCase() === "awaiting_sonography" ||
            String(s).toLowerCase() === "awaiting_sonographer"
          );
        });

        // Count completed scans
        const completedRadiology = allSubjects.filter(p => {
          if (!p?.status) return false;
          const list = Array.isArray(p.status) ? p.status : [p.status];
          return list.some(s => 
            String(s).toLowerCase() === "radiology_completed" ||
            String(s).toLowerCase() === "sonography_completed"
          );
        });

        const inProgress = allSubjects.filter(p => {
          if (!p?.status) return false;
          const list = Array.isArray(p.status) ? p.status : [p.status];
          return list.some(s => 
            String(s).toLowerCase() === "radiology_in_progress" ||
            String(s).toLowerCase() === "sonography_in_progress"
          );
        });

        if (mounted) {
          setIncomingCount(awaitingRadiology.length);
          setCompletedCount(completedRadiology.length);
          setPendingCount(inProgress.length);
          hasLoadedRef.current = true;
        }
      } catch (err) {
        console.error("SonographerDashboard: fetch error", err);
        if (mounted) toast.error("Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { mounted = false; };
  }, [lastUpdate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const cards = [
    {
      icon: FaThLarge,
      label: "Incoming Scans",
      count: incomingCount,
      color: "badge-primary",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: FaClock,
      label: "In Progress",
      count: pendingCount,
      color: "badge-warning",
      bgColor: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      icon: FaCheckCircle,
      label: "Completed",
      count: completedCount,
      color: "badge-success",
      bgColor: "bg-success/10",
      iconColor: "text-success",
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
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
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <GiUltrasound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-base-content">Sonographer Dashboard</h1>
            </div>
            <p className="text-base-content/70">Welcome - Manage patient ultrasound scans</p>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-28"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className={`card bg-base-100 shadow-sm border border-base-200`}>
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base-content/70 text-sm font-medium">{card.label}</p>
                          <p className="text-3xl font-bold text-base-content mt-2">{card.count}</p>
                        </div>
                        <div className={`${card.bgColor} p-4 rounded-full`}>
                          <Icon className={`${card.iconColor} w-6 h-6`} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold text-base-content mb-4">Quick Actions</h2>
              <div className="flex gap-3 flex-wrap">
                <button className="btn btn-primary btn-sm gap-2"
                  onClick={() => window.location.href = '/dashboard/sonographer/incoming'}
                >
                  <GiUltrasound className="w-4 h-4" />
                 
                  View Incoming
                </button>
                <button className="btn btn-outline btn-sm gap-2"
                onClick={() => window.location.href = '/dashboard/sonographer/scan-history'}
                >
                  View Scan History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonographerDashboard;
