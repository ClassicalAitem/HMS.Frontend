import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NurseLayout } from "@/layouts/nurse";
import { TaskAssigned, MedicationSchedule, InpatientMedicationAlertsWidget } from "@/components/nurse";
import { useAppSelector } from "@/store/hooks";
import { getMetrics } from "@/services/api/metricsAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { getVitalsByNurse } from "@/services/api/vitalsAPI";
import KolakLoader from "@/components/common/KolakLoader";
import {
  FaHeartbeat,
  FaBed,
  FaClipboardCheck,
  FaCalendarAlt,
} from "react-icons/fa";
import { RiArrowLeftRightFill } from "react-icons/ri";

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // Section states
  const [tasksCount, setTasksCount] = useState(0);
  const [admittedCount, setAdmittedCount] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [incomingItems, setIncomingItems] = useState([]);
  const [incomingTotalCount, setIncomingTotalCount] = useState(0);
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

    // Fetch metrics (Tasks Assigned & Admitted Patients)
    const fetchMetrics = async () => {
      try {
        setTasksLoading(true);
        const res = await getMetrics();
        const vitalsCount = res?.data?.totalTodayVital ?? 0;
        const admitted = res?.data?.totalAdmittedPatients ?? 0;
        if (mounted) {
          setTasksCount(vitalsCount);
          setAdmittedCount(admitted);
        }
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
        const name = (
          p?.fullName ||
          `${p?.firstName || ""} ${p?.lastName || ""}`.trim() ||
          p?.name ||
          ""
        ).trim();
        const ids = [p?.hospitalId, p?.patientId, p?.id, p?._id];
        ids.filter(Boolean).forEach((id) => {
          if (!map[id]) map[id] = name || "Unknown";
        });
      });
      return map;
    };

    // Fetch patients & dependants for Incoming Queue
    const fetchIncoming = async () => {
      try {
        setIncomingLoading(true);
        const nurseStatusFilter = "awaiting_injection,awaiting_sampling,awaiting_vitals,awaiting_nurse";
        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients({ status: nurseStatusFilter, limit: 100 }),
          getDependants({ status: nurseStatusFilter, limit: 100 }),
        ]);

        const patients =
          patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value?.data)
            ? patientsRes.value.data
            : [];

        const rawDeps =
          dependantsRes.status === "fulfilled"
            ? dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
            : [];
        const dependants = Array.isArray(rawDeps) ? rawDeps : rawDeps?.dependants ?? [];

        // Update patients map for name resolution
        const map = buildPatientsMap(patients);
        if (mounted) setPatientsById(map);

        const nurseStatuses = new Set([
          "awaiting_injection",
          "awaiting_sampling",
          "awaiting_vitals",
          "awaiting_nurse",
        ]);

        const hasNurseStatus = (status) => {
          if (!status) return false;
          const list = Array.isArray(status) ? status : [status];
          return list.some((s) => nurseStatuses.has(String(s).toLowerCase().replace(/\s+/g, "_")));
        };

        const filteredPatients = patients
          .filter((p) => hasNurseStatus(p?.status))
          .map((p) => ({
            patientId: p?.id || p?._id,
            hospitalId: p?.hospitalId,
            patientName: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
            administeredBy: p?.doctor ? "Doctor" : "Front Desk",
            status: Array.isArray(p?.status) ? p.status[p.status.length - 1] : p?.status,
            updatedAt: p?.updatedAt || p?.createdAt,
            time: (p?.updatedAt || p?.createdAt)
              ? new Date(p?.updatedAt || p?.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "â€”",
          }));

        const filteredDependants = dependants
          .filter((d) => hasNurseStatus(d?.status))
          .map((d) => ({
            patientId: d?.patientId || d?.id,
            hospitalId: d?.hospitalId || null,
            patientName: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
            administeredBy: "Front Desk",
            status: Array.isArray(d?.status) ? d.status[d.status.length - 1] : d?.status,
            updatedAt: d?.updatedAt || d?.createdAt,
            time: (d?.updatedAt || d?.createdAt)
              ? new Date(d?.updatedAt || d?.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "â€”",
          }));

        const merged = [...filteredPatients, ...filteredDependants].sort((a, b) => {
          const aTime = new Date(a.updatedAt || 0).getTime();
          const bTime = new Date(b.updatedAt || 0).getTime();
          return bTime - aTime;
        });

        if (mounted) {
          setIncomingTotalCount(merged.length);
          setIncomingItems(merged.slice(0, 5));
        }
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
        const latestFiveVitals = sortedVitals.slice(0, 8);

        const map = patientsById || {};

        const mapped = latestFiveVitals.map((v) => {
          const pid =
            v?.patient?.hospitalId ||
            v?.patient?.patientId ||
            v?.hospitalId ||
            v?.patientId ||
            v?.patient?.id;
          const nameFromMap = pid ? map[pid] : undefined;
          const nameResolved =
            v?.patient?.fullName ||
            `${v?.patient?.firstName || ""} ${v?.patient?.lastName || ""}`.trim() ||
            v?.patientName ||
            nameFromMap ||
            "Unknown Patient";

          return {
            headingTag: "Vital Signs Recorded",
            name: nameResolved,
            patientId: pid || "â€”",
            time: v?.createdAt
              ? new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "â€”",
            status: v?.status || "Recorded",
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

  // Current formatted date in Nigeria
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Personalized Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const nurseDisplayName = user?.firstName
    ? `Nurse ${user.firstName} ${user.lastName || ""}`.trim()
    : "Nurse On Duty";

  return (
    <NurseLayout>
      {tasksLoading && incomingLoading && <KolakLoader fullscreen />}

      <main className="space-y-5 min-w-0">
          {/* Welcome & Shift Status Banner */}
          <div className="bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-base-content">
                  {greeting}, {nurseDisplayName} 👋
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-base-content/60 flex items-center gap-2">
                <FaCalendarAlt className="w-3.5 h-3.5 text-primary" />
                <span>{currentDateFormatted}</span>
                <span>·</span>
                <span>Nursing Care &amp; Clinical Triage Station</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate("/dashboard/nurse/admitted")}
                className="btn btn-sm btn-outline btn-primary rounded-xl font-semibold gap-1.5 shadow-sm"
              >
                <FaBed className="w-3.5 h-3.5" />
                <span>Inpatient Ward</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Vitals Recorded */}
            <div
              onClick={() => navigate("/dashboard/nurse/incoming")}
              className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Vitals Recorded
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                  {tasksLoading ? "—" : tasksCount}
                </p>
                <p className="text-[11px] text-base-content/50">Today&apos;s observations</p>
              </div>
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                <FaClipboardCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Incoming Queue Waiting */}
            <div
              onClick={() => navigate("/dashboard/nurse/incoming")}
              className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Incoming Queue
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-base-content">
                  {incomingLoading ? "—" : incomingTotalCount}
                </p>
                <p className="text-[11px] text-base-content/50">Awaiting nurse action</p>
              </div>
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                <RiArrowLeftRightFill className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Admitted Inpatients */}
            <div
              onClick={() => navigate("/dashboard/nurse/admitted")}
              className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Admitted Patients
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-base-content">
                  {tasksLoading ? "—" : admittedCount}
                </p>
                <p className="text-[11px] text-base-content/50">Current bed occupancy</p>
              </div>
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                <FaBed className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Recent Care Logs */}
            <div
              onClick={refreshActivity}
              className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Logged Actions
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-base-content">
                  {activityLoading ? "—" : recentActivity.length}
                </p>
                <p className="text-[11px] text-base-content/50">Recent nurse entries</p>
              </div>
              <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
                <FaHeartbeat className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Section 1: Tasks Assigned & Incoming Queue Preview */}
          <TaskAssigned
            tasksCount={tasksCount}
            incoming={incomingItems}
            loading={tasksLoading || incomingLoading}
            onRefresh={refreshIncoming}
          />

          {/* Section 2: Inpatient Medication Schedule */}
          <InpatientMedicationAlertsWidget />

          {/* Section 3: Recent Clinical Activity Log */}
          <MedicationSchedule
            recentActivity={recentActivity}
            loading={activityLoading}
            onRefresh={refreshActivity}
          />
        </main>
    </NurseLayout>
  );
};

export default NurseDashboard;
