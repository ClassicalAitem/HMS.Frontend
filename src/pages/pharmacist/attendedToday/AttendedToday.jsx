import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common";
import { 
  FaUserCheck, 
  FaCalendarAlt, 
  FaCalendarDay, 
  FaCalendarWeek, 
  FaUsers, 
  FaSearch, 
  FaTimes, 
  FaPills,
  FaExternalLinkAlt 
} from "react-icons/fa";
import { RiRefreshLine } from "react-icons/ri";
import dispensesAPI from "@/services/api/dispensesAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { formatNigeriaTime, formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { PharmacistLayout } from "@/layouts/pharmacist";
import KolakLoader from "@/components/common/KolakLoader";

// Helper: Check if date falls in specified period
const isDateInPeriod = (dateVal, period, customStart, customEnd) => {
  if (period === "all") return true;
  if (!dateVal) return false;

  let targetDate;
  if (typeof dateVal === "string" && dateVal.includes("T")) {
    targetDate = new Date(dateVal);
  } else if (typeof dateVal === "string") {
    const parts = dateVal.trim().split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 4) {
      targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      targetDate = new Date(dateVal);
    }
  } else {
    targetDate = new Date(dateVal);
  }

  if (isNaN(targetDate.getTime())) return false;

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();

  if (period === "today") {
    return targetYear === todayYear && targetMonth === todayMonth && targetDay === todayDay;
  }

  const targetTime = new Date(targetYear, targetMonth, targetDay).getTime();

  if (period === "week") {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(todayYear, todayMonth, todayDay - dayOfWeek, 0, 0, 0, 0).getTime();
    const endOfWeek = new Date(todayYear, todayMonth, todayDay - dayOfWeek + 6, 23, 59, 59, 999).getTime();
    return targetTime >= startOfWeek && targetTime <= endOfWeek;
  }

  if (period === "month") {
    const startOfMonth = new Date(todayYear, todayMonth, 1, 0, 0, 0, 0).getTime();
    const endOfMonth = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999).getTime();
    return targetTime >= startOfMonth && targetTime <= endOfMonth;
  }

  if (period === "custom") {
    if (!customStart && !customEnd) return true;
    const s = customStart ? new Date(`${customStart}T00:00:00`).getTime() : 0;
    const e = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : Infinity;
    return targetTime >= s && targetTime <= e;
  }

  return true;
};

const getId = (value) =>
  value && typeof value === "object" ? value.id || value._id : value;

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const PharmacistAttendedToday = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dispenseList, setDispenseList] = useState([]);
  const [patientsMap, setPatientsMap] = useState({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // "today" | "week" | "month" | "custom" | "all"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [dispensesRes, patientsRes] = await Promise.allSettled([
        dispensesAPI.getDispenses(),
        getPatients({ limit: 300 }),
      ]);

      const pMap = {};
      if (patientsRes.status === "fulfilled") {
        const rawP = patientsRes.value?.data ?? patientsRes.value ?? [];
        const pList = Array.isArray(rawP) ? rawP : (rawP.data ?? []);
        pList.forEach((p) => {
          const name = `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || p?.fullName || "Patient";
          const idKeys = [p?.id, p?._id, p?.hospitalId].filter(Boolean);
          idKeys.forEach((k) => {
            pMap[k] = {
              name,
              hospitalId: p?.hospitalId || "N/A",
              gender: p?.gender || "",
              age: p?.age ?? calculateAge(p?.dob || p?.dateOfBirth),
              phone: p?.phone || p?.phoneNumber || "",
            };
          });
        });
      }
      setPatientsMap(pMap);

      if (dispensesRes.status === "fulfilled") {
        const res = dispensesRes.value;
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setDispenseList(list);
      }
    } catch (err) {
      console.error("AttendedToday: fetch error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall counts across periods for top KPI cards
  const stats = useMemo(() => {
    const todayUnique = new Set();
    const weekUnique = new Set();
    const monthUnique = new Set();
    const totalUnique = new Set();

    dispenseList.forEach((d) => {
      const dateVal = d.dispensedAt || d.createdAt;
      const patientId = getId(d?.prescriptionId?.patientId || d?.patientId || d?.patient) || null;
      const dependantId = getId(d?.prescriptionId?.dependantId || d?.dependantId || d?.dependant) || null;
      const key = dependantId ? `dep-${dependantId}` : `pat-${patientId || d?._id || Math.random()}`;

      totalUnique.add(key);

      if (dateVal) {
        if (isDateInPeriod(dateVal, "today")) todayUnique.add(key);
        if (isDateInPeriod(dateVal, "week")) weekUnique.add(key);
        if (isDateInPeriod(dateVal, "month")) monthUnique.add(key);
      }
    });

    return {
      today: todayUnique.size,
      week: weekUnique.size,
      month: monthUnique.size,
      total: totalUnique.size,
    };
  }, [dispenseList]);

  // Group dispenses in the selected period by patient/dependant so each person appears once
  const groupedEvents = useMemo(() => {
    const byKey = new Map();

    dispenseList.forEach((d) => {
      const dateVal = d.dispensedAt || d.createdAt;
      if (!isDateInPeriod(dateVal, dateFilter, customStartDate, customEndDate)) {
        return;
      }

      const patientId = getId(d?.prescriptionId?.patientId || d?.patientId || d?.patient) || null;
      const dependantId = getId(d?.prescriptionId?.dependantId || d?.dependantId || d?.dependant) || null;
      const key = dependantId ? `dep-${dependantId}` : `pat-${patientId || d?._id || Math.random()}`;

      const resolved = patientsMap[patientId] || {};
      const person = dependantId
        ? d.dependant || (typeof d.dependantId === "object" ? d.dependantId : null)
        : d.patient || (typeof d.patientId === "object" ? d.patientId : null) || d.opdPatient;

      const name = 
        resolved.name ||
        (person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : "") ||
        (dependantId ? "Dependant" : "Patient");

      const displayId =
        resolved.hospitalId && resolved.hospitalId !== "N/A"
          ? resolved.hospitalId
          : person?.hospitalId || (d.patient ? d.patient.hospitalId : null) || patientId || "N/A";

      const gender = resolved.gender || person?.gender || "";
      const age = resolved.age ?? calculateAge(person?.dob || person?.dateOfBirth);

      const itemsList = Array.isArray(d.items) ? d.items : [];
      const itemNames = itemsList.map((item) => item.drugName || item.name || "Medication").filter(Boolean);

      if (!byKey.has(key)) {
        byKey.set(key, {
          id: key,
          patientId,
          dependantId,
          name,
          type: dependantId ? "Dependant" : "Patient",
          displayId,
          gender,
          age,
          medicationsList: itemNames,
          time: dateVal,
          dispenseCount: 1,
        });
      } else {
        const existing = byKey.get(key);
        existing.dispenseCount += 1;
        itemNames.forEach((med) => {
          if (!existing.medicationsList.includes(med)) {
            existing.medicationsList.push(med);
          }
        });
        if (new Date(dateVal) > new Date(existing.time)) {
          existing.time = dateVal;
        }
      }
    });

    return Array.from(byKey.values()).sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );
  }, [dispenseList, patientsMap, dateFilter, customStartDate, customEndDate]);

  // Search & demographic filters
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return groupedEvents.filter((d) => {
      const matchesQuery =
        !q ||
        [d?.name, d?.displayId, ...(d?.medicationsList || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesGender =
        genderFilter === "all" ||
        String(d.gender).toLowerCase() === genderFilter.toLowerCase();

      const matchesAge =
        ageFilter === "all" ||
        (ageFilter === "adult" && d.age !== null && d.age >= 18) ||
        (ageFilter === "child" && d.age !== null && d.age < 18);

      return matchesQuery && matchesGender && matchesAge;
    });
  }, [groupedEvents, searchQuery, genderFilter, ageFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, genderFilter, ageFilter, dateFilter, customStartDate, customEndDate]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
    setAgeFilter("all");
    setDateFilter("today");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const isFiltered =
    !!searchQuery ||
    genderFilter !== "all" ||
    ageFilter !== "all" ||
    dateFilter !== "today" ||
    !!customStartDate ||
    !!customEndDate;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visible = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const handleView = (row) => {
    // Navigate to Drug Dispensation with search query for this patient
    const term = row.displayId && row.displayId !== "N/A" ? row.displayId : row.name;
    navigate(`/dashboard/pharmacist/DrugDispensation?search=${encodeURIComponent(term)}`);
  };

  const periodLabels = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    custom: "Custom Range",
    all: "All Time",
  };

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00943C]/10 text-[#00943C]">
                  <FaUserCheck size={22} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">Attended Patients</h1>
                  <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                    Patients and dependants dispensed medications by the pharmacy
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
              >
                <RiRefreshLine className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* TOP 4 KPI STAT CARDS (LIVE COUNTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setDateFilter("today")}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                dateFilter === "today" ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Attended Today</span>
                  <div className="text-3xl font-black text-primary mt-1">
                    {stats.today}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FaCalendarDay className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Unique patients today</span>
                {dateFilter === "today" && <span className="badge badge-primary badge-xs font-bold">Active</span>}
              </div>
            </div>

            <div 
              onClick={() => setDateFilter("week")}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                dateFilter === "week" ? "border-success ring-2 ring-success/20 bg-success/5" : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">This Week</span>
                  <div className="text-3xl font-black text-success mt-1">
                    {stats.week}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-success/10 text-success">
                  <FaCalendarWeek className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Dispensed this week</span>
                {dateFilter === "week" && <span className="badge badge-success badge-xs font-bold text-white">Active</span>}
              </div>
            </div>

            <div 
              onClick={() => setDateFilter("month")}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                dateFilter === "month" ? "border-info ring-2 ring-info/20 bg-info/5" : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">This Month</span>
                  <div className="text-3xl font-black text-info mt-1">
                    {stats.month}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-info/10 text-info">
                  <FaCalendarAlt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Dispensed this month</span>
                {dateFilter === "month" && <span className="badge badge-info badge-xs font-bold text-white">Active</span>}
              </div>
            </div>

            <div 
              onClick={() => setDateFilter("all")}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                dateFilter === "all" ? "border-[#00943C] ring-2 ring-[#00943C]/20 bg-[#00943C]/5" : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">All-Time Total</span>
                  <div className="text-3xl font-black text-base-content mt-1">
                    {stats.total}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-base-200 text-base-content">
                  <FaUsers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Total unique patients</span>
                {dateFilter === "all" && <span className="badge badge-neutral badge-xs font-bold">Active</span>}
              </div>
            </div>
          </div>

          {/* MAIN CARD CONTAINER */}
          <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
            
            {/* FILTER TOOLBAR */}
            <div className="p-4 sm:p-5 bg-base-100 border-b border-base-200 flex flex-col gap-3.5">
              
              {/* Row 1: Search + Gender/Age + Count Indicator */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search patient, KOLAK ID, drug..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Gender Filter */}
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="select select-bordered select-sm text-xs rounded-xl"
                    aria-label="Filter by gender"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>

                  {/* Age Filter */}
                  <select
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className="select select-bordered select-sm text-xs rounded-xl"
                    aria-label="Filter by age"
                  >
                    <option value="all">All Ages</option>
                    <option value="adult">Adults (18+)</option>
                    <option value="child">Children (0-17)</option>
                  </select>

                  {isFiltered && (
                    <button
                      onClick={handleClearFilters}
                      className="btn btn-ghost btn-sm text-xs text-error font-medium"
                    >
                      Reset
                    </button>
                  )}

                  {/* Count Indicator */}
                  <div className="badge badge-lg bg-primary/10 border-none text-primary font-bold text-xs px-3 py-3 gap-1">
                    <span>Count:</span>
                    <span className="text-sm font-extrabold">{filteredItems.length}</span>
                    <span className="font-normal text-primary/80">({periodLabels[dateFilter] || "Filtered"})</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Unified Date Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-base-200">
                <span className="text-xs font-semibold text-base-content/60 mr-1.5 flex items-center gap-1">
                  <FaCalendarAlt className="w-3 h-3 text-primary" /> Period:
                </span>
                {[
                  { id: "today", label: "Today" },
                  { id: "week", label: "This Week" },
                  { id: "month", label: "This Month" },
                  { id: "custom", label: "Custom Range" },
                  { id: "all", label: "All Time" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDateFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      dateFilter === f.id
                        ? "bg-primary text-primary-content shadow-xs"
                        : "bg-base-200 text-base-content/70 hover:text-base-content"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Row 3: Custom Date Range Pickers */}
              {dateFilter === "custom" && (
                <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-base-200 text-xs bg-base-200/30 p-2.5 rounded-xl">
                  <span className="text-base-content/70 font-semibold flex items-center gap-1">
                    Select Exact Days:
                  </span>
                  <div className="flex items-center gap-1.5 bg-base-100 px-3 py-1 rounded-lg border border-base-300 shadow-2xs">
                    <span className="text-base-content/60 font-medium">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent border-none text-xs focus:outline-none"
                      aria-label="Start date"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-base-100 px-3 py-1 rounded-lg border border-base-300 shadow-2xs">
                    <span className="text-base-content/60 font-medium">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent border-none text-xs focus:outline-none"
                      aria-label="End date"
                    />
                  </div>
                  {(customStartDate || customEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStartDate("");
                        setCustomEndDate("");
                      }}
                      className="btn btn-ghost btn-xs text-error font-medium"
                    >
                      Clear Range
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TABLE / LIST VIEW */}
            {/* Desktop Table Header */}
            {!loading && filteredItems.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-1">S/N</div>
                <div className="col-span-3">Patient Profile</div>
                <div className="col-span-2">Hospital ID</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-3">Drugs Dispensed</div>
                <div className="col-span-1">Time / Date</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
            )}

            <div className="divide-y divide-base-200">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <KolakLoader />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No patients attended"
                    description={
                      isFiltered
                        ? `No attended patients found for ${periodLabels[dateFilter] || "the selected filters"}.`
                        : "No drugs have been dispensed yet today."
                    }
                    actionLabel={isFiltered ? "Reset Filters" : "Refresh"}
                    onAction={isFiltered ? handleClearFilters : () => loadData(true)}
                  />
                </div>
              ) : (
                visible.map((row, idx) => {
                  const serialNumber = page * pageSize + idx + 1;
                  const initial = (row.name || "P")[0].toUpperCase();

                  return (
                    <div 
                      key={row.id} 
                      className="p-4 md:px-5 md:py-3.5 hover:bg-base-200/40 transition-colors"
                    >
                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-base-200 text-base-content/60 text-xs font-bold flex items-center justify-center">
                              {serialNumber}
                            </span>
                            <div>
                              <p className="font-bold text-sm text-base-content">{row.name}</p>
                              <p className="text-xs font-mono font-bold text-primary">{row.displayId}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            row.type === "Dependant" ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/70"
                          }`}>
                            {row.type}
                          </span>
                        </div>

                        {/* Medications */}
                        <div className="text-xs bg-base-200/50 p-2 rounded-lg">
                          <span className="font-semibold text-base-content/70">Medications: </span>
                          <span className="text-base-content font-medium">
                            {row.medicationsList.length > 0 ? row.medicationsList.join(", ") : "—"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-base-200">
                          <span className="text-base-content/60 font-medium">
                            {row.time ? formatNigeriaDateTime(row.time) : "—"}
                          </span>
                          <button
                            onClick={() => handleView(row)}
                            className="btn btn-xs btn-primary gap-1 font-semibold"
                          >
                            <span>View</span>
                            <FaExternalLinkAlt className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Desktop Grid Row */}
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-1 font-bold text-base-content/50">
                          #{serialNumber}
                        </div>

                        <div className="col-span-3 min-w-0 pr-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center flex-shrink-0 text-xs">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-base-content truncate text-sm">{row.name}</p>
                              <div className="flex items-center gap-2 text-[11px] text-base-content/50 mt-0.5">
                                {row.gender && <span className="capitalize">{row.gender}</span>}
                                {row.age !== null && <span>• {row.age} yrs</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-base-200 text-base-content/80">
                            {row.displayId}
                          </span>
                        </div>

                        <div className="col-span-1">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            row.type === "Dependant" ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/70"
                          }`}>
                            {row.type}
                          </span>
                        </div>

                        <div className="col-span-3 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {row.medicationsList.slice(0, 2).map((med, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[11px] font-semibold border border-primary/10 truncate max-w-[140px]"
                                title={med}
                              >
                                <FaPills className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                                <span className="truncate">{med}</span>
                              </span>
                            ))}
                            {row.medicationsList.length > 2 && (
                              <span className="text-[10px] font-bold text-base-content/50 bg-base-200 px-1.5 py-0.5 rounded">
                                +{row.medicationsList.length - 2} more
                              </span>
                            )}
                            {row.medicationsList.length === 0 && (
                              <span className="text-base-content/40 italic">No drugs listed</span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1">
                          <div className="text-base-content/70 font-medium text-[11px]">
                            {row.time ? (
                              dateFilter === "today" ? (
                                <span className="font-semibold text-primary">{formatNigeriaTime(row.time)}</span>
                              ) : (
                                <div>
                                  <div className="font-semibold">{formatNigeriaDate(row.time)}</div>
                                  <div className="text-[10px] text-base-content/50">{formatNigeriaTime(row.time)}</div>
                                </div>
                              )
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleView(row)}
                            className="btn btn-xs btn-ghost hover:bg-primary/10 text-primary gap-1 font-semibold"
                            title="View Drug Dispensation details"
                          >
                            <span>View</span>
                            <FaExternalLinkAlt className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100">
                <span className="text-xs text-base-content/60">
                  Showing <strong className="text-base-content">{page * pageSize + 1}</strong> to{" "}
                  <strong className="text-base-content">{Math.min((page + 1) * pageSize, filteredItems.length)}</strong> of{" "}
                  <strong className="text-base-content">{filteredItems.length}</strong> patients
                </span>
                <div className="join">
                  <button
                    className="join-item btn btn-sm btn-outline border-base-300"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    «
                  </button>
                  <button className="join-item btn btn-sm bg-base-200 border-base-300 font-bold pointer-events-none">
                    Page {page + 1} of {totalPages}
                  </button>
                  <button
                    className="join-item btn btn-sm btn-outline border-base-300"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PharmacistLayout>
  );
};

export default PharmacistAttendedToday;
