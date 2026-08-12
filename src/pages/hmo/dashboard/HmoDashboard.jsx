import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getAllHmos } from "@/services/api/hmoAPI";
import { useAppSelector } from "@/store/hooks";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";

const HmoDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [hmos, setHmos] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchHmos = async () => {
      try {
        setLoading(true);
        const res = await getAllHmos();
        const data = res?.data ?? res ?? [];
        const list = Array.isArray(data) ? data : data?.data ?? [];
        if (mounted) setHmos(list);
      } catch (e) {
        console.error("HmoDashboard: failed to load HMO data", e);
        if (mounted) setHmos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHmos();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    const totalHmos = hmos.length;
    const now = Date.now();
    const expiringSoon = hmos.filter((h) => {
      const exp = h.expiresAt ? new Date(h.expiresAt).getTime() : 0;
      const diff = exp - now;
      return exp > 0 && diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    const expired = hmos.filter((h) => {
      const exp = h.expiresAt ? new Date(h.expiresAt).getTime() : 0;
      return exp > 0 && exp < now;
    }).length;

    return [
      { label: "Total Plans", value: totalHmos },
      { label: "Expiring Soon", value: expiringSoon },
      { label: "Expired Plans", value: expired },
    ];
  }, [hmos]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((value) => !value);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base-200">
      {loading && <KolakLoader fullscreen />}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-y-auto">
          <section className="p-4 sm:p-6 lg:p-7">
            <div className="w-full md:w-[687px]">
              <h1 className="text-3xl font-regular sm:text-4xl">
                Welcome, HMO <span className="font-bold text-primary">{`${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}`}</span>
              </h1>
              <p className="text-sm">This dashboard provides a quick summary of your HMO claims and approvals.</p>
            </div>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:justify-between">
              {cards.map((c, idx) => (
                <div key={idx} className="h-[152px] w-full rounded-[10px] border bg-base-100 p-5 shadow shadow-lg lg:w-[30%]">
                  <div className="flex justify-between">
                    <p className="text-lg font-semibold">{c.label}</p>
                    <img src="/src/assets/images/users.png" alt="..." />
                  </div>
                  {loading ? (
                    <div className="skeleton mt-3 h-8 w-24" />
                  ) : (
                    <h1 className="mt-3 text-4xl font-semibold sm:text-6xl">{c.value}</h1>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-base-200 bg-base-100 p-4 sm:p-6">
              <h2 className="mb-3 text-xl font-semibold">Recent Entries</h2>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="loading loading-spinner loading-lg" />
                </div>
              ) : hmos.length === 0 ? (
                <div className="py-12 text-center text-base-content/60">
                  <p className="text-lg">No HMO plans found</p>
                  <p className="mt-2 text-sm">Once HMO plans are created, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hmos.slice(0, 6).map((hmo) => {
                    const expiresAt = hmo.expiresAt ? new Date(hmo.expiresAt) : null;
                    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                    const expiresLabel = hmo.expiresAt ? formatNigeriaDate(hmo.expiresAt) : "—";

                    return (
                      <div key={hmo.id || hmo._id} className="rounded-xl border border-base-300 bg-base-200 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium">{hmo.provider || "Unknown Provider"}</p>
                          <span className={`badge badge-sm ${isExpired ? "badge-error" : "badge-secondary"}`}>
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/60">Member ID: {hmo.memberId || "—"}</p>
                        <p className="text-xs text-base-content/60">Plan: {hmo.plan || "—"}</p>
                        <p className="text-xs text-base-content/60">Expires: {expiresLabel}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HmoDashboard;
