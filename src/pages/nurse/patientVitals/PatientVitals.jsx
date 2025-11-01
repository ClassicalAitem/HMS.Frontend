import React, { useEffect, useState, useMemo } from "react";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { PiUsersThree } from "react-icons/pi";
import { getPatients } from "@/services/api/patientsAPI";

const PatientVitals = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

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
    if (s.includes("pass") || s.includes("deceased")) return "badge badge-neutral";
    if (s.includes("pending") || s.includes("wait")) return "badge badge-warning";
    return "badge badge-ghost";
  };

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const mapped = patients.map((p, idx) => ({
          sn: idx + 1,
          name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || p?.fullName || "Unknown",
          gender: p?.gender || "—",
          age: calculateAge(p?.dob),
          blood: p?.bloodGroup || p?.blood || "—",
          status: p?.status || "Active",
        }));
        if (mounted) setItems(mapped);
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
  
// pagination
  // const [page, setPage] = useState(1);
  // const perPage = 8;

  // // total pages
  // const total = patients.length;
  // const pages = Math.ceil(total / perPage);

  // // slice data for current page
  // const shown = useMemo(() => {
  //   const start = (page - 1) * perPage;
  //   return patients.slice(start, start + perPage);
  // }, [page]);

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
                  <h1 className="text-[32px] text-base-content">All Patients</h1>
                  <PiUsersThree size={25} className="text-base-content/80" />
                </div>
                <p className="text-[12px] text-base-content/70">View the list of all Patients.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow mt-6">
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
                          icon={<PiUsersThree className="text-base-content/60" size={40} />}
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((p, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="px-4 py-4">{String(p.sn).padStart(2, "0")}</td>
                        <td className="text-center">{p.name}</td>
                        <td className="text-center">{p.gender}</td>
                        <td className="text-center">{p.age}</td>
                        <td className="text-center">{p.blood}</td>
                        <td className="text-center">
                          <span className={statusBadgeClass(p.status)}>{p.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

           
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientVitals;
