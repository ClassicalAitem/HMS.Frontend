import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common";
import { FaUserCheck } from "react-icons/fa";
import { RiSearchLine } from "react-icons/ri";
import dispensesAPI from "@/services/api/dispensesAPI";
import { useAppSelector } from "@/store/hooks";
import { formatNigeriaTime, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { PharmacistLayout } from "@/layouts/pharmacist";
import KolakLoader from "@/components/common/KolakLoader";

const isToday = (dateValue) => {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const getDateParts = (dateValue) => {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    year,
    month,
    day,
    dateStr: `${year}-${month}-${day}`,
    monthStr: `${year}-${month}`,
  };
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
  const { user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [dispenseList, setDispenseList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");

  // Date filters: "today" | "day" | "month" | "custom" | "all"
  const [dateFilterType, setDateFilterType] = useState("today");
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await dispensesAPI.getDispenses();
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : [];
        if (mounted) setDispenseList(list);
      } catch (err) {
        console.error("AttendedToday: fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const events = useMemo(() => {
    // 1. Filter dispenses according to active date filter
    const filteredDispenses = dispenseList.filter((d) => {
      const dateVal = d.dispensedAt || d.createdAt;
      if (!dateVal) return false;

      if (dateFilterType === "today") {
        return isToday(dateVal);
      }

      const parts = getDateParts(dateVal);
      if (!parts) return false;

      if (dateFilterType === "day") {
        return selectedDay ? parts.dateStr === selectedDay : true;
      }
      if (dateFilterType === "month") {
        return selectedMonth ? parts.monthStr === selectedMonth : true;
      }
      if (dateFilterType === "custom") {
        if (customStartDate && parts.dateStr < customStartDate) return false;
        if (customEndDate && parts.dateStr > customEndDate) return false;
        return true;
      }
      if (dateFilterType === "all") {
        return true;
      }
      return true;
    });

    // 2. Group by patient/dependant so we display each person once in the selected window
    const byKey = new Map();

    filteredDispenses.forEach((d) => {
      const patientId = getId(
        d?.prescriptionId?.patientId || d?.patientId || d?.patient
      ) || null;

      const dependantId = getId(
        d?.prescriptionId?.dependantId || d?.dependantId || d?.dependant
      ) || null;

      const key = dependantId ? `dep-${dependantId}` : `pat-${patientId}`;

      if (!byKey.has(key)) {
        let name = "Unknown";
        let type = dependantId ? "Dependant" : "Patient";
        let displayId = "N/A";
        const person = dependantId
          ? d.dependant || (typeof d.dependantId === "object" ? d.dependantId : null)
          : d.patient || (typeof d.patientId === "object" ? d.patientId : null) || d.opdPatient;

        if (person) {
          name = `${person.firstName || ""} ${person.lastName || ""}`.trim() || (dependantId ? "Dependant" : "Patient");
          displayId = person.hospitalId || (d.patient ? d.patient.hospitalId : null) || patientId;
        }

        byKey.set(key, {
          id: key,
          patientId,
          dependantId,
          name,
          type,
          displayId,
          gender: person?.gender || "",
          age: calculateAge(person?.dob || person?.dateOfBirth),
          medications: (d.items || []).map((item) => item.drugName || "Drug").join(", "),
          time: d.dispensedAt || d.createdAt,
        });
      } else {
        const existing = byKey.get(key);
        const newMeds = (d.items || []).map((item) => item.drugName || "Drug").join(", ");
        if (newMeds) {
          existing.medications += existing.medications ? `, ${newMeds}` : newMeds;
        }
        if (new Date(d.dispensedAt || d.createdAt) > new Date(existing.time)) {
          existing.time = d.dispensedAt || d.createdAt;
        }
      }
    });

    return Array.from(byKey.values()).sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );
  }, [dispenseList, dateFilterType, selectedDay, selectedMonth, customStartDate, customEndDate]);

  const enriched = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        timeFormatted: e.time
          ? dateFilterType === "today"
            ? formatNigeriaTime(e.time)
            : formatNigeriaDateTime(e.time)
          : "—",
      })),
    [events, dateFilterType]
  );

  useEffect(() => {
    setPage(0);
  }, [query, genderFilter, ageFilter, dateFilterType, selectedDay, selectedMonth, customStartDate, customEndDate, enriched.length]);

  const handleClearFilters = () => {
    setQuery("");
    setGenderFilter("all");
    setAgeFilter("all");
    setDateFilterType("today");
    setSelectedDay(new Date().toISOString().slice(0, 10));
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const isFiltered =
    !!query ||
    genderFilter !== "all" ||
    ageFilter !== "all" ||
    dateFilterType !== "today";

  const q = query.trim().toLowerCase();
  const filteredItems = enriched.filter((d) => {
    const matchesQuery = !q || [d?.name, d?.displayId, d?.medications]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
    const matchesGender = genderFilter === "all" || String(d.gender).toLowerCase() === genderFilter;
    const matchesAge = ageFilter === "all"
      || (ageFilter === "adult" && d.age !== null && d.age >= 18)
      || (ageFilter === "child" && d.age !== null && d.age < 18);
    return matchesQuery && matchesGender && matchesAge;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visible = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const handleView = (row) => {
    navigate(`/dashboard/pharmacist/DrugDispensation`);
  };

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <FaUserCheck size={22} className="text-[#00943C] flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold text-[#00943C]">Attended Patients</h1>
            </div>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              {dateFilterType === "today"
                ? "Patients and dependants dispensed drugs today by the pharmacy."
                : dateFilterType === "day"
                ? `Patients and dependants dispensed drugs on ${selectedDay}.`
                : dateFilterType === "month"
                ? `Patients and dependants dispensed drugs in ${selectedMonth}.`
                : dateFilterType === "custom"
                ? `Patients and dependants dispensed drugs between ${customStartDate || "start"} and ${customEndDate || "end"}.`
                : "All patients and dependants dispensed drugs by the pharmacy."}
            </p>
          </div>

          {/* Search and Action Bar */}
          <div className="flex flex-col gap-3 mb-5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-wrap">
              <div className="relative w-full md:max-w-xs">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, ID, drug..."
                  className="input input-bordered input-sm pl-9 w-full"
                />
              </div>

              {/* Date Filter Type Select */}
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value)}
                className="select select-bordered select-sm w-full md:w-auto"
                aria-label="Filter by date range"
              >
                <option value="today">Today</option>
                <option value="day">A Day</option>
                <option value="month">A Month</option>
                <option value="custom">Custom Range</option>
                <option value="all">All Dates</option>
              </select>

              {/* Day Picker */}
              {dateFilterType === "day" && (
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="input input-bordered input-sm w-full md:w-auto"
                  aria-label="Select day"
                />
              )}

              {/* Month Picker */}
              {dateFilterType === "month" && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input input-bordered input-sm w-full md:w-auto"
                  aria-label="Select month"
                />
              )}

              {/* Custom Range Pickers */}
              {dateFilterType === "custom" && (
                <div className="flex items-center gap-1.5 w-full md:w-auto">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input input-bordered input-sm w-full md:w-auto"
                    placeholder="Start date"
                    aria-label="Start date"
                  />
                  <span className="text-xs text-base-content/60">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input input-bordered input-sm w-full md:w-auto"
                    placeholder="End date"
                    aria-label="End date"
                  />
                </div>
              )}

              {/* Gender and Age Filters */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="select select-bordered select-sm w-full md:w-auto"
                aria-label="Filter by gender"
              >
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="select select-bordered select-sm w-full md:w-auto"
                aria-label="Filter by age group"
              >
                <option value="all">All ages</option>
                <option value="adult">Adults (18+)</option>
                <option value="child">Kids (0-17)</option>
              </select>

              <div className="flex items-center gap-2 justify-between md:justify-start md:ml-auto w-full md:w-auto">
                {isFiltered && (
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-ghost btn-sm flex-1 md:flex-none"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={onRefresh}
                  className="btn btn-outline border-[#00943C] text-[#00943C] hover:bg-[#00943C] hover:text-white btn-sm flex-1 md:flex-none"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Card Container for Data */}
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            {/* Desktop Table Header */}
            {!loading && filteredItems.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Drugs Dispensed</div>
                <div className="col-span-2">{dateFilterType === "today" ? "Time" : "Date & Time"}</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
            )}

            <div className="divide-y divide-base-200">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <KolakLoader />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No patients attended"
                    description={
                      isFiltered
                        ? "No matches for the selected filters."
                        : "No drugs dispensed today."
                    }
                    actionLabel={isFiltered ? "Clear filters" : "Refresh"}
                    onAction={isFiltered ? handleClearFilters : onRefresh}
                  />
                </div>
              ) : (
                visible.map((row) => (
                  <div key={row.id} className="p-4 md:px-5 md:py-4 hover:bg-base-200/40 transition-colors">
                    {/* Mobile View */}
                    <div className="block md:hidden space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-base-content truncate">{row.name}</p>
                          <span className="text-xs text-base-content/40 font-mono">{row.displayId}</span>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-base-200 text-base-content/70 whitespace-nowrap">
                            {row.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm line-clamp-2">
                         <span className="font-semibold">Drugs: </span> {row.medications}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-base-200 pt-3">
                        <span className="text-xs font-medium text-base-content/60">{row.timeFormatted}</span>
                        <button
                          onClick={() => handleView(row)}
                          className="btn btn-sm btn-ghost text-primary px-3 h-8 min-h-0"
                        >
                          View
                        </button>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center text-sm">
                      <div className="col-span-3 min-w-0 pr-2">
                        <p className="font-semibold text-base-content truncate">{row.name}</p>
                        <p className="text-xs text-base-content/50 font-mono mt-0.5 truncate">{row.displayId}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-base-200 text-base-content/70">
                          {row.type}
                        </span>
                      </div>
                      <div className="col-span-4 min-w-0 pr-2">
                         <p className="text-base-content/80 truncate" title={row.medications}>
                           {row.medications}
                         </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-base-content/70 font-medium text-xs">{row.timeFormatted}</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => handleView(row)}
                          className="btn btn-sm btn-ghost hover:bg-[#00943C]/10 text-[#00943C]"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-base-200 flex items-center justify-between">
                <span className="text-xs text-base-content/60">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredItems.length)} of {filteredItems.length}
                </span>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    «
                  </button>
                  <button className="join-item btn btn-sm bg-base-100">Page {page + 1}</button>
                  <button
                    className="join-item btn btn-sm"
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