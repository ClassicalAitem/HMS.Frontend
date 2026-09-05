import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, PatientStatusBadge, HmoStatusBadge } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import AcceptTestRequestModal from "./modals/AcceptTestRequestModal";
import TestRequestModal from "./modals/TestRequestModal";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { updateDependantStatus } from "@/services/api/dependantAPI";
import { getAllOpdPatients, updateOpdPatient } from '@/services/api/opdPatientAPI';
import { hasStatus } from "@/utils/statusUtils";
import { formatNigeriaDate, formatNigeriaDateTime, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import { useNotifications } from "@/contexts/NotificationContext";
import { FiSearch, FiAlertCircle, FiRefreshCw, FiUser, FiCalendar, FiClock } from "react-icons/fi";
import { FaFlask, FaStethoscope } from "react-icons/fa";
import { PATIENT_STATUS } from "@/constants/patientStatus";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [existingLabResults, setExistingLabResults] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { refreshQueueCount } = useNotifications();

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchTestRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch investigations and OPD patients concurrently (NO N+1 loops)
      const [invResponse, opdResponse] = await Promise.all([
        getInvestigations({ type: 'lab' }).catch((err) => {
          console.warn("Failed to fetch lab investigations, falling back to all:", err);
          return getInvestigations();
        }),
        getAllOpdPatients().catch((err) => {
          console.warn("Failed to fetch OPD patients:", err);
          return [];
        })
      ]);

      const allInvestigations = Array.isArray(invResponse)
        ? invResponse
        : (invResponse?.data || []);

      const allOpdPatients = Array.isArray(opdResponse)
        ? opdResponse
        : (opdResponse?.data || []);

      const awaitingLabOpdPatients = allOpdPatients.filter((p) =>
        hasStatus(p.status, PATIENT_STATUS.AWAITING_LAB) || hasStatus(p.status, 'sonography_completed')
      );

      // Map investigation requests using backend enriched patient, dependant, opdPatient, and hmoStatus
      const investigationCards = allInvestigations
        .filter((inv) => {
          const invType = String(inv.type || "").toLowerCase();
          if (invType && invType !== "lab") return false;

          const pStatus = inv.dependant?.status || inv.patient?.status || inv.opdPatient?.status;
          const invStatus = String(inv.status || "").toLowerCase();

          // If patient status is present, verify status
          if (pStatus) {
            return hasStatus(pStatus, PATIENT_STATUS.AWAITING_LAB) || hasStatus(pStatus, 'sonography_completed');
          }

          // If patient status is unknown, allow pending / awaiting_lab requests
          return invStatus === 'pending' || invStatus === 'awaiting_lab' || !invStatus;
        })
        .map((inv) => {
          const patient = inv.patient;
          const dependant = inv.dependant;
          const opdPatient = inv.opdPatient;

          let patientType = "regular";
          let patientName = "Unknown Patient";
          let displayId = inv.patientId || "N/A";
          let requestedBy = inv.doctorName || (inv.doctor?.name ? inv.doctor.name : "Doctor");

          if (dependant) {
            patientType = "dependant";
            patientName =
              `${dependant.firstName || ""} ${dependant.lastName || ""}`.trim() ||
              dependant.fullName ||
              dependant.name ||
              "Unknown Dependant";
            displayId = dependant.id || dependant._id || inv.dependantId || displayId;
            requestedBy = inv.doctorName || "Doctor";
          } else if (opdPatient) {
            patientType = "opd";
            patientName =
              opdPatient.fullName ||
              `${opdPatient.firstName || ""} ${opdPatient.lastName || ""}`.trim() ||
              "Unknown OPD Patient";
            displayId = opdPatient.id || inv.opdPatientId || displayId;
            requestedBy = "Front Desk";
          } else if (patient) {
            patientName =
              `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
              patient.name ||
              "Unknown";
            displayId = patient.hospitalId || patient.id || patient._id || displayId;
          }

          const patientStatus = dependant?.status || patient?.status || opdPatient?.status || "unknown";

          return {
            id: inv._id || inv.id,
            patientId: inv.patientId || (patient?._id || patient?.id),
            dependantId: inv.dependantId,
            opdPatientId: inv.opdPatientId || opdPatient?.id,
            name: patientName,
            userId: displayId,
            status: inv.priority === "urgent" ? "Urgent" : "Normal",
            test:
              inv.tests?.map((t) => t.name).join(", ") ||
              inv.investigationType ||
              "Lab Test",
            date: inv.createdAt ? formatNigeriaDate(inv.createdAt) : "N/A",
            requestedBy,
            time: inv.createdAt ? formatNigeriaTime(inv.createdAt) : "N/A",
            createdAt: inv.createdAt,
            sortTimestamp: patient?.updatedAt || inv.createdAt,
            updatedAt: patient?.updatedAt ? formatNigeriaDateTime(patient.updatedAt) : "N/A",
            patientType,
            investigationStatus: inv.status,
            patientStatus,
            statusUser: dependant?.statusUser || patient?.statusUser,
            statusSenderName: dependant?.statusSenderName || patient?.statusSenderName,
            hmoStatus: inv.hmoStatus || null,
            tests: inv.tests || [],
            investigation: inv
          };
        });

      // Filter standalone OPD patients awaiting lab not already tied to an investigation
      const opdPatientCards = awaitingLabOpdPatients
        .filter(
          (opdPatient) =>
            !investigationCards.some(
              (inv) => String(inv.opdPatientId || inv.patientId) === String(opdPatient.id)
            )
        )
        .map((opdPatient) => ({
          id: null,
          opdPatientId: opdPatient.id,
          name: opdPatient.fullName || "Unknown OpD Patient",
          userId: opdPatient.id,
          status: "Normal",
          test: "OpD Laboratory Request",
          date: opdPatient.createdAt ? formatNigeriaDate(opdPatient.createdAt) : "N/A",
          requestedBy: "Cashier",
          time: opdPatient.createdAt ? formatNigeriaTime(opdPatient.createdAt) : "N/A",
          createdAt: opdPatient.createdAt,
          sortTimestamp: opdPatient.updatedAt || opdPatient.createdAt,
          updatedAt: opdPatient.updatedAt ? formatNigeriaDateTime(opdPatient.updatedAt) : "N/A",
          patientType: "opd",
          patientStatus: opdPatient.status || "unknown",
          hmoStatus: null,
        }));

      const formattedRequests = [...investigationCards, ...opdPatientCards];

      const uniqueRequests = formattedRequests
        .filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                t.userId === item.userId &&
                t.test === item.test &&
                t.date === item.date
            )
        )
        .sort((a, b) => {
          const aTime = new Date(a.sortTimestamp || a.createdAt || 0).getTime();
          const bTime = new Date(b.sortTimestamp || b.createdAt || 0).getTime();
          return bTime - aTime;
        });

      setTestRequests(uniqueRequests);
    } catch (err) {
      console.error("Error fetching incoming lab requests:", err);
      setError("Failed to load incoming test requests. Please try refreshing.");
      setTestRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingLabResults = async () => {
    try {
      const labRes = await getLabResults();
      const labList = Array.isArray(labRes?.data)
        ? labRes.data
        : Array.isArray(labRes)
        ? labRes
        : [];

      const labMap = {};
      labList.forEach((lr) => {
        const invId = lr.investigationRequestId || lr.investigationId;
        if (invId) labMap[invId] = lr._id || lr.id;
      });
      setExistingLabResults(labMap);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchTestRequests();
    fetchExistingLabResults();
  }, []);

  const handleAcceptFromDetails = (cardData) => {
    setSelectedCard(cardData);
    setShowModal(true);
  };

  const handleClear = async (testCard) => {
    if (testCard.patientType === 'dependant' && testCard.dependantId) {
      await updateDependantStatus(testCard.dependantId, { status: PATIENT_STATUS.CANCELLED });
    } else if (testCard.patientType === 'opd' && testCard.opdPatientId) {
      await updateOpdPatient(testCard.opdPatientId, { status: PATIENT_STATUS.CANCELLED });
    } else if (testCard.patientId) {
      await updatePatientStatus(testCard.patientId, { status: PATIENT_STATUS.CANCELLED });
    }
    localStorage.setItem('refreshIncoming', Date.now().toString());
    refreshQueueCount();
  };

  // Filtered requests computation
  const filteredRequests = useMemo(() => {
    return testRequests.filter((item) => {
      // Filter tab
      if (activeFilter === "urgent" && item.status !== "Urgent") return false;
      if (activeFilter === "normal" && item.status !== "Normal") return false;
      if (activeFilter === "opd" && item.patientType !== "opd") return false;
      if (activeFilter === "dependant" && item.patientType !== "dependant") return false;
      if (activeFilter === "hmo_covered" && item.hmoStatus !== "approved" && item.hmoStatus !== "partial") return false;
      if (activeFilter === "hmo_not_covered" && item.hmoStatus !== "rejected") return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesId = String(item.userId || "").toLowerCase().includes(query);
        const matchesTest = item.test?.toLowerCase().includes(query);
        const matchesDoctor = item.requestedBy?.toLowerCase().includes(query);
        return matchesName || matchesId || matchesTest || matchesDoctor;
      }

      return true;
    });
  }, [testRequests, activeFilter, searchTerm]);

  // Dynamic KPI stats
  const stats = useMemo(() => {
    const total = testRequests.length;
    const urgent = testRequests.filter((r) => r.status === "Urgent").length;
    const routine = testRequests.filter((r) => r.status === "Normal").length;
    const hmoCovered = testRequests.filter((r) => r.hmoStatus === "approved" || r.hmoStatus === "partial").length;
    return [
      { label: "New Requests", value: total, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
      { label: "Urgent Priority", value: urgent, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
      { label: "Routine / Normal", value: routine, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
      { label: "HMO Covered", value: hmoCovered, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    ];
  }, [testRequests]);

  const sidebarWrapper = (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <LaboratorySidebar onCloseSidebar={closeSidebar} />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-base-200">
      {sidebarWrapper}

      <div className="flex overflow-hidden flex-col flex-1 min-w-0">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <FaFlask className="w-7 h-7 text-emerald-600" />
                Incoming Test Requests
              </h1>
             
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTestRequests}
                className="btn btn-sm btn-ghost gap-2 border border-base-300 hover:bg-base-300"
                title="Refresh requests"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
             
            </div>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border border-base-300/80 bg-base-100 shadow-sm flex flex-col justify-between`}
              >
                <span className="text-xs font-medium text-base-content/60 uppercase tracking-wider">{stat.label}</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${stat.bg} ${stat.color} font-medium`}>
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Chips & Search Bar */}
          <div className="bg-base-100 p-4 rounded-xl border border-base-300/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All Requests" },
                  { id: "urgent", label: "Urgent" },
                  { id: "normal", label: "Routine" },
                  { id: "opd", label: "OPD" },
                  { id: "dependant", label: "Dependants" },
                  { id: "hmo_covered", label: "HMO Covered" },
                  { id: "hmo_not_covered", label: "HMO Not Covered" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`btn btn-xs sm:btn-sm rounded-lg transition-all ${
                      activeFilter === tab.id
                        ? "btn-primary text-white"
                        : "btn-ghost text-base-content/70 hover:bg-base-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search patient, ID, or test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-sm input-bordered w-full pl-9 bg-base-200/50 focus:bg-base-100"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Test Request List */}
          <div className="space-y-3">
            {loading ? (
              // Fast Modern Skeleton Loaders
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-base-100 p-5 rounded-xl border border-base-300 animate-pulse flex flex-col md:flex-row gap-4 justify-between">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex gap-2 items-center">
                        <div className="h-5 bg-base-300 rounded w-36"></div>
                        <div className="h-4 bg-base-300 rounded w-16"></div>
                        <div className="h-4 bg-base-300 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-base-200 rounded w-64"></div>
                      <div className="h-3 bg-base-200 rounded w-48"></div>
                    </div>
                    <div className="flex gap-2 items-center self-end md:self-center">
                      <div className="h-9 bg-base-300 rounded w-28"></div>
                      <div className="h-9 bg-base-300 rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((testCard, index) => {
                const isUrgent = testCard.status === "Urgent";
                return (
                  <div
                    key={testCard.id || index}
                    className={`bg-base-100 p-4 sm:p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      isUrgent
                        ? "border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10"
                        : "border-base-300 hover:border-emerald-300 dark:hover:border-emerald-700"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Patient Info & Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-base-content flex items-center gap-1.5">
                            <FiUser className="w-4 h-4 text-base-content/60" />
                            {testCard.name}
                          </span>
                          <span className="badge badge-sm badge-ghost text-xs text-base-content/60 font-mono">
                            ID: {testCard.userId}
                          </span>
                          {testCard.patientType === 'dependant' && (
                            <span className="badge badge-sm badge-secondary font-medium">Dependant</span>
                          )}
                          {testCard.patientType === 'opd' && (
                            <span className="badge badge-sm badge-info font-medium">OPD</span>
                          )}
                          {/* HMO Badge */}
                          <HmoStatusBadge status={testCard.hmoStatus} size="sm" />

                          {/* Patient Workflow Status */}
                          {testCard.patientStatus && (
                            <PatientStatusBadge
                              status={testCard.patientStatus}
                              statusSenderName={testCard.statusSenderName}
                              statusUser={testCard.statusUser}
                              tooltipAlign="left"
                            />
                          )}

                          {/* Priority Badge */}
                          <span
                            className={`badge badge-sm font-semibold ${
                              isUrgent
                                ? "badge-error text-white animate-pulse"
                                : "badge-info badge-outline"
                            }`}
                          >
                            {testCard.status}
                          </span>
                        </div>

                        {/* Test details & timestamps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-base-content/70">
                          <div className="flex items-center gap-1.5">
                            <FaFlask className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-base-content">Test:</span>
                            <span className="truncate">{testCard.test}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaStethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold text-base-content">Ordered by: Dr</span>
                            <span>{testCard.requestedBy}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="w-3.5 h-3.5 text-base-content/50 shrink-0" />
                            <span>{testCard.date}</span>
                            <FiClock className="w-3.5 h-3.5 text-base-content/50 ml-1 shrink-0" />
                            <span>{testCard.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        <button
                          onClick={() => {
                            setSelectedCard(testCard);
                            setShowModal2(true);
                          }}
                          className="btn btn-sm btn-outline border-base-300 hover:bg-base-200"
                        >
                          View Details
                        </button>

                       

                        <div onClick={(e) => e.stopPropagation()}>
                          <ClearItemButton
                            item={testCard}
                            onClear={handleClear}
                            onCleared={fetchTestRequests}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-base-100 rounded-xl border border-dashed border-base-300">
                <FaFlask className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                <h3 className="font-bold text-lg text-base-content">No incoming test requests</h3>
                <p className="text-sm text-base-content/60 mt-1 max-w-sm mx-auto">
                  {searchTerm || activeFilter !== "all"
                    ? "No requests matched your current filters. Try resetting the search or filter."
                    : "There are currently no patient laboratory requests awaiting processing."}
                </p>
                {(searchTerm || activeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setActiveFilter("all");
                    }}
                    className="btn btn-sm btn-outline mt-4"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single Modals rendered outside map loop */}
      {showModal && selectedCard && (
        <AcceptTestRequestModal
          data={selectedCard}
          setShowModal={setShowModal}
          onAcceptSuccess={fetchTestRequests}
        />
      )}

      {showModal2 && selectedCard && (
        <TestRequestModal
          data={selectedCard}
          setShowModal2={setShowModal2}
          onAcceptFromDetails={handleAcceptFromDetails}
          existingLabResultId={selectedCard?.id ? existingLabResults[selectedCard.id] : null}
        />
      )}
    </div>
  );
};

export default IncomingLaboratory;