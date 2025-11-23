import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import {
  RiArrowLeftRightFill,
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "react-icons/ri";
import womanLogo from "../../../assets/images/incomingLogo.jpg";
import { getPatients } from "@/services/api/patientsAPI";
import SamplingModals from "./modals/SamplingModals";
import InjectionModals from "./modals/InjectionModals";

const Incoming = () => {
  const navigate = useNavigate();
  const [selectedInvestigationId, setSelectedInvestigationId] = useState(null);
  const [selectedInjectionId, setSelectedInjectionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [patient, setPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordForm, setRecordForm] = useState({
    bp: "",
    pulse: "",
    temperature: "",
    weight: "",
    spo2: "",
    notes: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 9;

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
        const filtered = patients.filter((p) =>
          statuses.has((p?.status || "").toLowerCase())
        );
        const sorted = filtered.sort((a, b) => {
          const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bTime - aTime;
        });

        const prettifyStatus = (s) => {
          switch ((s || "").toLowerCase()) {
            case "awaiting_vitals":
              return "Awaiting Vitals";
            case "awaiting_sampling":
              return "Awaiting Sampling";
            case "awaiting_injection":
              return "Awaiting Injection";
            default:
              return s || "—";
          }
        };

        const mapped = sorted.map((p) => ({
          id: p?.id,
          prescriptionId: p?.prescriptionId || p?.prescription?._id,
          hospitalId: p?.hospitalId,
          snapshot: p,
          name:
            `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
          patientId: p?.hospitalId || p?.id || "—",
          illness: prettifyStatus(p?.status),
          insurance: p?.hmos?.provider || "—",
          registered: p?.createdAt
            ? new Date(p.createdAt).toLocaleString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          alert: prettifyStatus(p?.status),
          status: (p?.status || "").toLowerCase(),
        }));

        if (mounted) setItems(mapped);
      } catch (err) {
        console.error("Incoming page: patients fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchIncoming();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  // Reset to first page when search query or items change
  useEffect(() => {
    setPage(0);
  }, [query, items]);

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
            {/* Minimal search */}
            <div className="mt-4 flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search patients"
                  className="input input-bordered input-sm pl-9 w-full"
                />
              </div>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn btn-ghost btn-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="bg-base-100 mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 rounded-md">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-[216px] card bg-base-100 border border-base-300 shadow-sm"
                    >
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
                : (() => {
                    const q = query.trim().toLowerCase();
                    const filtered = q
                      ? items.filter((d) => {
                          const hay = [
                            d?.name,
                            d?.patientId,
                            d?.illness,
                            d?.insurance,
                            d?.alert,
                          ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();
                          return hay.includes(q);
                        })
                      : items;

                    if (filtered.length === 0) {
                      return (
                        <div className="col-span-full">
                          <EmptyState
                            title="No matches found"
                            description="Try a different search or clear the filter."
                            actionLabel={query ? "Clear search" : "Refresh"}
                            onAction={query ? () => setQuery("") : onRefresh}
                          />
                        </div>
                      );
                    }

                    const totalPages = Math.max(
                      1,
                      Math.ceil(filtered.length / pageSize)
                    );
                    const start = page * pageSize;
                    const end = start + pageSize;
                    const visible = filtered.slice(start, end);

                    return visible.map((data, index) => {
                      const primary =
                        data.status === "awaiting_vitals"
                          ? "vitals"
                          : data.status === "awaiting_sampling"
                          ? "sampling"
                          : data.status === "awaiting_injection"
                          ? "injection"
                          : "";
                      return (
                        <div
                          key={index}
                          onClick={() =>
                            data.id &&
                            navigate(`/dashboard/nurse/patient/${data.id}`, {
                              state: {
                                from: "incoming",
                                patientSnapshot: data.snapshot,
                              },
                            })
                          }
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
                                <span className="block">
                                  Patient ID: {data.patientId}
                                </span>
                                <span className="block">
                                  Reason: {data.illness}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="block">
                                  Insurance: {data.insurance}
                                </span>
                                <span className="block">
                                  Registered: {data.registered}
                                </span>
                                <span className="block">
                                  Alert: {data.alert}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex  px-7 pb-5 cursor-pointer">
                            {primary === "vitals" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPatient(data.snapshot);
                                  setIsRecordOpen(true);
                                }}
                                className={`px-3 py-1 rounded-full cursor-pointer ${
                                  primary === "vitals"
                                    ? "bg-primary text-white"
                                    : "text-base-content/70"
                                }`}
                              >
                                Record Vitals
                              </button>
                            )}

                            {primary === "sampling" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPatient(data.snapshot);
                                  setSelectedInvestigationId(data.snapshot.id);
                                  setShowModal(true);
                                }}
                                className={`px-3 py-1 rounded-full cursor-pointer ${
                                  primary === "sampling"
                                    ? "bg-primary text-white"
                                    : "text-base-content/70"
                                }`}
                              >
                                Sampling
                              </button>
                            )}

                            {primary === "injection" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();

                                  console.log(
                                    "=== INJECTION BUTTON CLICKED ==="
                                  );
                                  console.log("data object:", data);
                                  console.log("data.id:", data.id);
                                  console.log("data.snapshot:", data.snapshot);
                                  console.log(
                                    "data.snapshot.id:",
                                    data.snapshot.id
                                  );
                                  console.log(
                                    "================================"
                                  );

                                  setPatient(data.snapshot);
                                  setSelectedInjectionId(
                                    data.id || data.snapshot.id
                                  );
                                  setShowModal2(true);
                                }}
                                className={`px-3 py-1 rounded-full cursor-pointer ${
                                  primary === "injection"
                                    ? "bg-primary text-white"
                                    : "text-base-content/70"
                                }`}
                              >
                                Injection
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
            </div>

            {/* Modals rendered OUTSIDE the grid */}
            {showModal && (
              <SamplingModals
                setShowModal={setShowModal}
                patientId={selectedInvestigationId}
                patientData={patient}
              />
            )}

            {showModal2 && (
              <InjectionModals
                setShowModal2={setShowModal2}
                patientId={selectedInjectionId}
                patientData={patient}
              />
            )}

            {/* Carousel-style pagination dots and controls */}
            {(() => {
              const q = query.trim().toLowerCase();
              const filtered = q
                ? items.filter((d) => {
                    const hay = [
                      d?.name,
                      d?.patientId,
                      d?.illness,
                      d?.insurance,
                      d?.alert,
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();
                    return hay.includes(q);
                  })
                : items;
              const totalPages = Math.max(
                1,
                Math.ceil(filtered.length / pageSize)
              );
              if (!loading && filtered.length > pageSize) {
                return (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      className="btn btn-ghost btn-xs"
                      aria-label="Previous"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <RiArrowLeftSLine />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          aria-label={`Go to page ${i + 1}`}
                          className={`w-3 h-3 rounded-full ${
                            i === page
                              ? "bg-success"
                              : "border border-base-300 bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      className="btn btn-ghost btn-xs"
                      aria-label="Next"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                    >
                      <RiArrowRightSLine />
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </section>

          {isRecordOpen && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg">
                  Record New Vitals -{" "}
                  {patient?.fullName ||
                    `${patient?.firstName || ""} ${
                      patient?.lastName || ""
                    }`.trim() ||
                    "Patient"}
                </h3>
                <p className="py-1 text-sm">
                  Enter the latest vital signs for this patient.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      className="input input-bordered w-full"
                      value={recordForm.bp}
                      onChange={(e) =>
                        setRecordForm((f) => ({ ...f, bp: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">
                      Pulse
                    </label>
                    <input
                      type="number"
                      placeholder="78"
                      className="input input-bordered w-full"
                      value={recordForm.pulse}
                      onChange={(e) =>
                        setRecordForm((f) => ({ ...f, pulse: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">
                      Weight
                    </label>
                    <input
                      type="number"
                      placeholder="62"
                      className="input input-bordered w-full"
                      value={recordForm.weight}
                      onChange={(e) =>
                        setRecordForm((f) => ({ ...f, weight: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      placeholder="98.6"
                      className="input input-bordered w-full"
                      value={recordForm.temperature}
                      onChange={(e) =>
                        setRecordForm((f) => ({
                          ...f,
                          temperature: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">
                      SpO2
                    </label>
                    <input
                      type="number"
                      placeholder="98"
                      className="input input-bordered w-full"
                      value={recordForm.spo2}
                      onChange={(e) =>
                        setRecordForm((f) => ({ ...f, spo2: e.target.value }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm text-base-content/70">
                      Notes
                    </label>
                    <textarea
                      placeholder="Optional notes"
                      className="textarea textarea-bordered w-full"
                      value={recordForm.notes}
                      onChange={(e) =>
                        setRecordForm((f) => ({ ...f, notes: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {recordError && (
                  <p className="mt-2 text-sm text-error">{recordError}</p>
                )}

                <div className="modal-action">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setIsRecordOpen(false);
                      setRecordError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`btn btn-primary ${
                      recordLoading ? "loading" : ""
                    }`}
                    onClick={async () => {
                      try {
                        setRecordLoading(true);
                        setRecordError("");
                        const payload = {
                          patientId: patientUUID || patientId,
                          bp: recordForm.bp,
                          temperature: recordForm.temperature
                            ? Number(recordForm.temperature)
                            : undefined,
                          weight: recordForm.weight
                            ? Number(recordForm.weight)
                            : undefined,
                          pulse: recordForm.pulse
                            ? Number(recordForm.pulse)
                            : undefined,
                          spo2: recordForm.spo2
                            ? Number(recordForm.spo2)
                            : undefined,
                          notes: recordForm.notes || undefined,
                        };
                        const res = await createVital(payload);
                        const created = res?.data ?? res;
                        // Prepend new vital to history and update latest
                        setVitals((prev) => [
                          created,
                          ...(Array.isArray(prev) ? prev : []),
                        ]);
                        setIsRecordOpen(false);
                        setRecordForm({
                          bp: "",
                          pulse: "",
                          temperature: "",
                          weight: "",
                          spo2: "",
                          notes: "",
                        });
                      } catch (e) {
                        const msg =
                          e?.response?.data?.message ||
                          "Failed to record vitals";
                        setRecordError(msg);
                      } finally {
                        setRecordLoading(false);
                      }
                    }}
                  >
                    Record Vitals
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Incoming;
