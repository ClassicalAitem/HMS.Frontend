import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getAllHmos } from "@/services/api/hmoAPI";
import { useAppSelector } from "@/store/hooks";

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

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="w-full md:w-[687px]">
              <h1 className="text-4xl font-regular">
                Welcome, HMO <span className="font-bold text-primary">{`${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}`}</span>
              </h1>
              <p className="text-sm">This dashboard provides a quick summary of your HMO claims and approvals.</p>
            </div>

            <div className="flex flex-col lg:flex-row justify-between mt-5 gap-4">
              {cards.map((c, idx) => (
                <div key={idx} className="w-full lg:w-[30%] h-[152px] bg-base-100 shadow shadow-lg border p-5 rounded-[10px]">
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

            <div className="mt-10 p-6 bg-base-100 border border-base-200 rounded-xl">
              <h2 className="text-xl font-semibold mb-3">Recent Entries</h2>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="loading loading-spinner loading-lg" />
                </div>
              ) : hmos.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                  <p className="text-lg">No HMO plans found</p>
                  <p className="text-sm mt-2">Once HMO plans are created, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hmos.slice(0, 6).map((hmo) => {
                    const expiresAt = hmo.expiresAt ? new Date(hmo.expiresAt) : null;
                    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                    const expiresLabel = expiresAt ? expiresAt.toLocaleDateString() : "—";

                    return (
                      <div key={hmo.id || hmo._id} className="bg-base-200 border border-base-300 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
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
