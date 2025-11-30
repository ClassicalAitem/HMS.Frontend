import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { PiUsersThree } from "react-icons/pi";
import { getPatients } from "@/services/api/patientsAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { CashierActionModal, PharmacyActionModal } from "@/components/modals";
import { toast } from "react-hot-toast";

const PatientVitals = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  // Search, filters, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const navigate = useNavigate();
  const [isSendDoctorOpen, setIsSendDoctorOpen] = useState(false);
  const [isSendPharmacyOpen, setIsSendPharmacyOpen] = useState(false);
  const [isSendCashierOpen, setIsSendCashierOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const calculateAge = (dob) => {
    if (!dob) return "—";
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return "—";
    const diff = Date.now() - d.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const statusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("active")) return "badge badge-success";
    if (s.includes("pass") || s.includes("deceased"))
      return "badge badge-neutral";
    if (s.includes("pending") || s.includes("wait"))
      return "badge badge-warning";
    return "badge badge-ghost";
  };

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const allow = new Set(["awaiting_injection", "awaiting_sampling", "awaiting_vitals"]);
        const filtered = patients.filter((p) => allow.has(String(p?.status || "").toLowerCase()));
        const mapped = filtered.map((p, idx) => ({
          sn: idx + 1,
          name:
            `${p?.firstName || ""} ${p?.lastName || ""}`.trim() ||
            p?.fullName ||
            "Unknown",
          gender: p?.gender || "—",
          age: calculateAge(p?.dob),
          blood: p?.bloodGroup || p?.blood || "—",
          status: p?.status || "",
          id: p?.patientId || p?.id || p?.uuid,
          phone: p?.phone || p?.phoneNumber || "—",
          hospitalId: p?.hospitalId || p?.patientId || p?.id || p?.uuid,
          hmos: p?.hmos || [],
          firstName: p?.firstName,
          lastName: p?.lastName,
        }));
        // if (mounted) setItems(mapped);

        const allowedStatuses = [
          "awaiting_vitals",
          "awaiting_sampling",
          "awaiting_injection",
        ];

        const filtered = mapped.filter((p) =>
          allowedStatuses.includes((p.status || "").toLowerCase())
        );

        if (mounted) setItems(filtered);
      } catch (err) {
        console.error("PatientVitals: patients fetch error", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // Derived filtering & pagination
  const filteredItems = useMemo(() => {
    let data = items;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          String(p.sn).includes(q) ||
          (p.blood || "").toLowerCase().includes(q)
      );
    }
    if (genderFilter !== "all") {
      data = data.filter(
        (p) => (p.gender || "").toLowerCase() === genderFilter
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((p) =>
        (p.status || "").toLowerCase().includes(statusFilter)
      );
    }
    return data;
  }, [items, searchQuery, genderFilter, statusFilter]);

  const pages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const shown = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  useEffect(() => {
    // Reset to first page when query or filters change
    setPage(1);
  }, [searchQuery, genderFilter, statusFilter, perPage]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
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
            <div>
              <div>
                <div className="flex items-center gap-5 ">
                  <h1 className="text-[32px] text-base-content">
                    All Patients
                  </h1>
                  <PiUsersThree size={25} className="text-base-content/80" />
                </div>
                <p className="text-[12px] text-base-content/70">
                  View the list of all Patients.
                </p>
              </div>
            </div>
            {/* Search & Filters */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, S/N, blood group"
                className="input input-bordered w-full"
              />
              <select
                className="select select-bordered w-full"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <select
                className="select select-bordered w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="deceased">Deceased</option>
              </select>
              <select
                className="select select-bordered w-full"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg shadow mt-6">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-[16px] rounded-lg overflow-hidden">
                  <thead className="bg-base-200">
                    <tr>
                      <th className="p-3 ">S/n</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Age</th>
                      <th className="p-3">Blood/Gp</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="bg-base-100">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="px-4 py-4">
                            <div className="skeleton h-4 w-8" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="skeleton h-4 w-32" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="skeleton h-4 w-16" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="skeleton h-4 w-10" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="skeleton h-4 w-16" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="skeleton h-6 w-20" />
                          </td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8">
                          <EmptyState
                            title="No patient records"
                            description="Try refreshing to fetch the latest patients."
                            actionLabel="Refresh"
                            onAction={onRefresh}
                            icon={
                              <PiUsersThree
                                className="text-base-content/60"
                                size={40}
                              />
                            }
                          />
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8">
                          <EmptyState
                            title="No matches"
                            description="Try adjusting search or filters, or refresh to fetch latest."
                            actionLabel="Clear Filters"
                            onAction={() => {
                              setSearchQuery("");
                              setGenderFilter("all");
                              setStatusFilter("all");
                            }}
                            icon={
                              <PiUsersThree
                                className="text-base-content/60"
                                size={40}
                              />
                            }
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(p);
                                setIsSendDoctorOpen(true);
                              }}
                            >
                              Send to Doctor
                            </button>
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(p);
                                setIsSendPharmacyOpen(true);
                              }}
                            >
                              Send to Pharmacy
                            </button>
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(p);
                                setIsSendCashierOpen(true);
                              }}
                            >
                              Send to Cashier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      shown.map((p, index) => (
                        <tr
                          key={index}
                          className="border-b last:border-b-0 cursor-pointer hover:bg-base-200/40"
                          onClick={() =>
                            p?.id &&
                            navigate(`/dashboard/nurse/patient/${p.id}`, {
                              state: { patientSnapshot: p },
                            })
                          }
                        >
                          <td className="px-4 py-4">
                            {String(p.sn).padStart(2, "0")}
                          </td>
                          <td className="text-center">{p.name}</td>
                          <td className="text-center">{p.gender}</td>
                          <td className="text-center">{p.age}</td>
                          <td className="text-center">{p.blood}</td>
                          <td className="text-center">
                            <span className={statusBadgeClass(p.status)}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination footer */}
            {!loading && items.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-base-content/70">
                  Showing{" "}
                  {filteredItems.length
                    ? Math.min((page - 1) * perPage + 1, filteredItems.length)
                    : 0}
                  –{Math.min(page * perPage, filteredItems.length)} of{" "}
                  {filteredItems.length}
                </div>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span className="join-item btn btn-sm no-animation">
                    Page {page} / {pages}
                  </span>
                  <button
                    className="join-item btn btn-sm"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientVitals;
