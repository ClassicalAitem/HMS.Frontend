import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { RiArrowLeftRightFill } from "react-icons/ri";
import womanLogo from "../../../assets/images/incomingLogo.jpg";
import { getPatients } from "@/services/api/patientsAPI";

const Incoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const statuses = new Set([
          "awaiting_injection",
          "awaiting_sampling",
          "awaiting_vitals",
        ]);
        const filtered = patients.filter((p) => statuses.has((p?.status || "").toLowerCase()));
        const sorted = filtered.sort((a, b) => {
          const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bTime - aTime;
        });

        const prettifyStatus = (s) => {
          switch ((s || '').toLowerCase()) {
            case 'awaiting_vitals': return 'Awaiting Vitals';
            case 'awaiting_sampling': return 'Awaiting Sampling';
            case 'awaiting_injection': return 'Awaiting Injection';
            default: return s || '—';
          }
        };

        const mapped = sorted.map((p) => ({
          id: p?.id,
          hospitalId: p?.hospitalId,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          patientId: p?.hospitalId || p?.id || '—',
          illness: prettifyStatus(p?.status),
          insurance: p?.hmos?.provider || '—',
          registered: (p?.createdAt)
            ? new Date(p.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })
            : '—',
          alert: prettifyStatus(p?.status),
          status: (p?.status || '').toLowerCase(),
        }));

        if (mounted) setItems(mapped);
      } catch (err) {
        console.error('Incoming page: patients fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchIncoming();
    return () => { mounted = false; };
  }, [refreshKey]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

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
                <p className="text-[12px] text-base-content/70">
                  Check out the patient sent to you.
                </p>
              </div>
            </div>
            <div className="bg-base-100 mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 rounded-md">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
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
              ) : items.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title="No incoming patients"
                    description="You're all clear. Patients assigned to you will appear here."
                    actionLabel="Refresh"
                    onAction={onRefresh}
                  />
                </div>
              ) : (
                items.map((data, index) => {
                  const primary =
                    data.status === 'awaiting_vitals' ? 'vitals' :
                    data.status === 'awaiting_sampling' ? 'sampling' :
                    data.status === 'awaiting_injection' ? 'injection' : '';
                  return (
                    <div
                      key={index}
                      onClick={() => data.id && navigate(`/dashboard/nurse/patient/${data.id}`, { state: { from: 'incoming', patientSnapshot: data.snapshot } })}
                      className="card bg-base-100 border border-base-300 shadow-sm cursor-pointer"
                    >
                      <div className="flex gap-6 items-center p-8">
                        <img
                          src={womanLogo}
                          alt=""
                          className="w-[52px] h-[52px] object-cover rounded-full"
                        />

                        <div className="flex-1 grid grid-cols-2 gap-4 text-sm text-base-content">
                          <div className="space-y-1 xl:space-y-3">
                            <span className="block">Name: {data.name}</span>
                            <span className="block">Patient ID: {data.patientId}</span>
                            <span className="block">Reason: {data.illness}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block">Insurance: {data.insurance}</span>
                            <span className="block">Registered: {data.registered}</span>
                            <span className="block">Alert: {data.alert}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between px-7 pb-5">
                        <button className={`px-3 py-1 rounded-full ${primary==='vitals' ? 'bg-primary text-white' : 'text-base-content/70'}`}>Record Vitals</button>
                        <button className={`px-3 py-1 rounded-full ${primary==='sampling' ? 'bg-primary text-white' : 'text-base-content/70'}`}>Sampling</button>
                        <button className={`px-3 py-1 rounded-full ${primary==='injection' ? 'bg-primary text-white' : 'text-base-content/70'}`}>Injection</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Incoming;
