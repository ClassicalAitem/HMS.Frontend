import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common";
import { Sidebar, TaskAssigned, MedicationSchedule } from "@/components/nurse";
import { useAppSelector } from "@/store/hooks";
import { getMetrics } from "@/services/api/metricsAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getVitalsByNurse } from "@/services/api/vitalsAPI";

const NurseDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Section states
  const [tasksCount, setTasksCount] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [incomingItems, setIncomingItems] = useState([]);
  const [incomingLoading, setIncomingLoading] = useState(true);

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  // Map of patient identifiers to names for resolving recent activity names
  const [patientsById, setPatientsById] = useState({});

  // Refresh keys to allow manual reloads from child components
  const [refreshIncomingKey, setRefreshIncomingKey] = useState(0);
  const [refreshActivityKey, setRefreshActivityKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    // Fetch metrics (Tasks Assigned)
    const fetchMetrics = async () => {
      try {
        setTasksLoading(true);
        const res = await getMetrics();
        const count = res?.data?.totalTodayVital ?? 0;
        if (mounted) setTasksCount(count);
      } catch (err) {
        console.error("NurseDashboard: metrics fetch error", err);
      } finally {
        if (mounted) setTasksLoading(false);
      }
    };

    // Helper: build map of patient identifiers => display name
    const buildPatientsMap = (patients = []) => {
      const map = {};
      patients.forEach((p) => {
        const name = (p?.fullName || `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || p?.name || "").trim();
        const ids = [p?.hospitalId, p?.patientId, p?.id];
        ids.filter(Boolean).forEach((id) => {
          if (!map[id]) map[id] = name || "Unknown";
        });
      });
      return map;
    };

    // Fetch patients and build Incoming
    const fetchIncoming = async () => {
      try {
        setIncomingLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];

        // Update patients map for name resolution across the dashboard
        const map = buildPatientsMap(patients);
        if (mounted) setPatientsById(map);
        const statuses = new Set([
          "awaiting_injection",
          "awaiting_sampling",
          "awaiting_vitals",
        ]);
        const filtered = patients.filter((p) => statuses.has((p?.status || "").toLowerCase()));

        // Sort by updatedAt or createdAt desc if available
        const sorted = filtered.sort((a, b) => {
          const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bTime - aTime;
        });

        const latestFive = sorted.slice(0, 5).map((p) => ({
          patientName: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
          administeredBy: p?.doctor ? "Doctor" : "front desk",
          time: (p?.updatedAt || p?.createdAt)
            ? new Date(p?.updatedAt || p?.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—",
        }));

        if (mounted) setIncomingItems(latestFive);
      } catch (err) {
        console.error("NurseDashboard: patients fetch error", err);
      } finally {
        if (mounted) setIncomingLoading(false);
      }
    };

    // Fetch recent vitals activity for nurse
    const fetchVitals = async () => {
      try {
        setActivityLoading(true);
        const nurseId = user?.id;
        const res = await getVitalsByNurse(nurseId);
        const vitals = Array.isArray(res?.data) ? res.data : [];

        // Sort by createdAt desc and limit to latest 5
        const sortedVitals = vitals.slice().sort((a, b) => {
          const aTime = new Date(a?.createdAt || 0).getTime();
          const bTime = new Date(b?.createdAt || 0).getTime();
          return bTime - aTime;
        });
        const latestFiveVitals = sortedVitals.slice(0, 5);

        // Ensure we have a patients map; if empty, fetch patients once
        let map = patientsById;
        if (!map || Object.keys(map).length === 0) {
          try {
            const patientsRes = await getPatients();
            const patientsList = Array.isArray(patientsRes?.data) ? patientsRes.data : [];
            map = buildPatientsMap(patientsList);
            if (mounted) setPatientsById(map);
          } catch (e) {
            console.warn("NurseDashboard: unable to build patients map", e);
            map = {};
          }
        }

        const mapped = latestFiveVitals.map((v) => {
          const pid = v?.patient?.hospitalId || v?.patient?.patientId || v?.hospitalId || v?.patientId || v?.patient?.id;
          const nameFromMap = pid ? map[pid] : undefined;
          const nameResolved = (
            v?.patient?.fullName || `${v?.patient?.firstName || ""} ${v?.patient?.lastName || ""}`.trim() || v?.patientName || nameFromMap || "Unknown"
          );
          return {
            headingTag: "New Vitals Recorded",
            name: nameResolved,
            patientId: pid || "—",
            time: v?.createdAt
              ? new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—",
            status: v?.status || "Active",
          };
        });

        if (mounted) setRecentActivity(mapped);
      } catch (err) {
        console.error("NurseDashboard: vitals fetch error", err);
      } finally {
        if (mounted) setActivityLoading(false);
      }
    };

    fetchMetrics();
    fetchIncoming();
    fetchVitals();

    return () => {
      mounted = false;
    };
  }, [user?.id, refreshIncomingKey, refreshActivityKey]);

  const refreshIncoming = () => setRefreshIncomingKey((k) => k + 1);
  const refreshActivity = () => setRefreshActivityKey((k) => k + 1);

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex flex-col gap-1 p-2  h-full">
          <TaskAssigned
            tasksCount={tasksCount}
            incoming={incomingItems}
            loading={tasksLoading || incomingLoading}
            onRefresh={refreshIncoming}
          />
          <MedicationSchedule
            recentActivity={recentActivity}
            loading={activityLoading}
            onRefresh={refreshActivity}
          />
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
