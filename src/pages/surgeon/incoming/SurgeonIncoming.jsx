import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import { RiArrowLeftRightFill, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import avatarImg from "@/assets/images/incomingLogo.jpg";
import { getAllInvestigationRequests } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";

const SurgeonIncoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const res = await getAllInvestigationRequests();
        const investigations = res?.data || [];
        const sorted = investigations.sort((a, b) => {
          const aTime = new Date(a?.createdAt || 0).getTime();
          const bTime = new Date(b?.createdAt || 0).getTime();
          return bTime - aTime;
        });
        const mapped = await Promise.all(sorted.map(async (inv) => {
          let patientName = 'Unknown';
          let patientId = '—';
          if (inv?.patient) {
            if (inv.patient.fullName) patientName = inv.patient.fullName;
            else if (inv.patient.firstName || inv.patient.lastName) patientName = `${inv.patient.firstName || ''} ${inv.patient.lastName || ''}`.trim();
            patientId = inv.patient.hospitalId || inv.patient.id || '—';
          } else if (inv?.patientName) {
            patientName = inv.patientName;
            patientId = inv?.patientId || inv?.patient_id || '—';
          } else if (inv?.patient_id) {
            patientName = inv.patient_id;
            patientId = inv.patient_id;
          } else if (inv?.patientId) {
            try {
              const patientRes = await getPatientById(inv.patientId);
              const p = patientRes?.data || patientRes;
              if (p?.fullName) patientName = p.fullName;
              else if (p?.firstName || p?.lastName) patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
              patientId = p?.hospitalId || p?.id || inv.patientId;
            } catch (e) {
              patientName = inv.patientId;
              patientId = inv.patientId;
            }
          }
          return {
            id: inv?._id || inv?.id,
            patientName,
            patientId,
            type: inv?.type || inv?.title || 'Investigation',
            status: inv?.status || 'Pending',
            createdAt: inv?.createdAt ? new Date(inv.createdAt).toLocaleString() : '—',
            snapshot: inv,
          };
        }));
        if (mounted) setItems(mapped);
      } catch (err) {
        console.error("Surgeon Incoming: investigation fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncoming();
    return () => { mounted = false; };
  }, [refreshKey]);

  useEffect(() => { setPage(0); }, [query, items]);
  const onRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <section>
            <div>
              <div>
                <div className="flex items-center gap-5 ">
                  <RiArrowLeftRightFill size={25} className="text-primary" />
                  <h1 className="text-[32px] text-primary ">Incoming</h1>
                </div>
                <p className="text-[12px] text-base-content/70">Check out the investigation requests assigned to you.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search requests" className="input input-bordered input-sm pl-9 w-full" />
              </div>
              {query && (
                <button onClick={() => setQuery("")} className="btn btn-ghost btn-xs">Clear</button>
              )}
            </div>

            <div className="bg-base-100 mt-10 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 rounded-md">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-[216px] card bg-base-100 border border-base-300 shadow-sm">
                    <div className="flex gap-6 items-center p-5">
                      <div className="w-[52px] h-[52px] rounded-full bg-base-300 animate-pulse" />
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="animate-pulse h-3 w-40 rounded bg-base-300" />
                          <div className="animate-pulse h-3 w-32 rounded bg-base-300" />
                          <div className="animate-pulse h-3 w-28 rounded bg-base-300" />
                        </div>
                        <div className="space-y-2">
                          <div className="animate-pulse h-3 w-36 rounded bg-base-300" />
                          <div className="animate-pulse h-3 w-32 rounded bg-base-300" />
                          <div className="animate-pulse h-3 w-28 rounded bg-base-300" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between px-7 pb-5">
                      <div className="animate-pulse h-6 w-24 rounded bg-base-300" />
                      <div className="animate-pulse h-6 w-24 rounded bg-base-300" />
                      <div className="animate-pulse h-6 w-24 rounded bg-base-300" />
                    </div>
                  </div>
                ))
              ) : (
                (() => {
                  const q = query.trim().toLowerCase();
                  const filtered = q
                    ? items.filter((d) => [d?.patientName, d?.status].filter(Boolean).join(" ").toLowerCase().includes(q))
                    : items;
                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full">
                        <EmptyState title="No matches found" description="Try a different search or clear the filter." actionLabel={query ? "Clear search" : "Refresh"} onAction={query ? () => setQuery("") : onRefresh} />
                      </div>
                    );
                  }
                  const start = page * pageSize;
                  const end = start + pageSize;
                  const visible = filtered.slice(start, end);
                  return visible.map((data, index) => (
                    <div key={index} className="card bg-base-100 border border-base-300 shadow-sm">
                      <div className="flex gap-6 items-center p-8">
                        <img src={avatarImg} alt="" className="w-[52px] h-[52px] object-cover rounded-full" />
                        <div className="flex-1 grid grid-cols-2 gap-4 text-sm text-base-content">
                          <div className="space-y-1 xl:space-y-3 col-span-2">
                            <span className="block whitespace-nowrap overflow-hidden text-ellipsis w-full font-semibold" style={{maxWidth: '100%'}}>
                              Patient: {data.patientName}
                            </span>
                            <span className="block">Patient ID: {data.patientId}</span>
                            <span className="block">Status: {data.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center px-7 pb-5 gap-2">
                        <button
                          className="px-4 py-1 rounded-full bg-primary text-white"
                          onClick={() => data.id && navigate(`/dashboard/surgeon/write-surgical-note/${data.id}`, { state: { from: 'incoming', investigationRequest: data.snapshot } })}
                        >
                          Add Surgical Note
                        </button>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {(() => {
              const q = query.trim().toLowerCase();
              const filtered = q ? items.filter((d) => [d?.patientName, d?.type, d?.status, d?.createdAt].filter(Boolean).join(" ").toLowerCase().includes(q)) : items;
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              if (!loading && filtered.length > pageSize) {
                return (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button className="btn btn-ghost btn-xs" aria-label="Previous" onClick={() => setPage((p) => Math.max(0, p - 1))}><RiArrowLeftSLine /></button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button key={i} onClick={() => setPage(i)} aria-label={`Go to page ${i + 1}`} className={`w-3 h-3 rounded-full ${i === page ? 'bg-success' : 'border border-base-300 bg-transparent'}`} />
                      ))}
                    </div>
                    <button className="btn btn-ghost btn-xs" aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}><RiArrowRightSLine /></button>
                  </div>
                );
              }
              return null;
            })()}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SurgeonIncoming;
