import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import AcceptTestRequestModal from "./modals/AcceptTestRequestModal";
import TestRequestModal from "./modals/TestRequestModal";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatientById, getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { getAllDependantsForPatient, updateDependantStatus } from "@/services/api/dependantAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { updateOpdPatient } from '@/services/api/opdPatientAPI';
import { hasStatus } from "@/utils/statusUtils";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { getAllOpdPatients } from "@/services/api/opdPatientAPI";
import { formatNigeriaDate, formatNigeriaDateTime, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import { useNotifications } from "@/contexts/NotificationContext";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [incomingStats, setIncomingStats] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [existingLabResults, setExistingLabResults] = useState({});
  const [sendingToSonographer, setSendingToSonographer] = useState(null);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchTestRequests = async () => {
    console.log("fetchTestRequests called");
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch all patients (don't filter by status yet - we need patient data for matching)
      console.log("📥 Fetching all patients...");
      const patientsResponse = await getPatients();
      const allPatients = Array.isArray(patientsResponse) 
        ? patientsResponse 
        : (patientsResponse?.data || []);
      
      // Filter for those with awaiting_lab or sonography_completed status
      const awaitingLabPatients = allPatients.filter((p) => 
        hasStatus(p.status, PATIENT_STATUS.AWAITING_LAB) || hasStatus(p.status, 'sonography_completed')
      );
      console.log("Patients with awaiting_lab or sonography_completed status:", awaitingLabPatients.length);

      // Step 1.5: Fetch OpD patients with awaiting_lab or sonography_completed status
      console.log("📥 Fetching OPD patients...");
      const opdPatientsResponse = await getAllOpdPatients();
      const allOpdPatients = Array.isArray(opdPatientsResponse)
        ? opdPatientsResponse
        : (opdPatientsResponse?.data || []);
      
      const awaitingLabOpdPatients = allOpdPatients.filter((p) => 
        hasStatus(p.status, PATIENT_STATUS.AWAITING_LAB) || hasStatus(p.status, 'sonography_completed')
      );
   
      // Step 2: Fetch all investigation requests
      console.log("📥 Fetching investigation requests...");
      const investigationsResponse = await getInvestigations();
      const allInvestigations = Array.isArray(investigationsResponse) 
        ? investigationsResponse 
        : (investigationsResponse?.data || []);
      // Step 3: Match investigation requests with awaiting_lab patients, OpD patients, or dependant requests
      const dependantCache = {};

      const loadDependantsForPatient = async (patientId) => {
        if (!patientId) return [];
        if (dependantCache[patientId]) return dependantCache[patientId];

        try {
          const res = await getAllDependantsForPatient(patientId);
          const rawDependants =
            res?.data?.data?.dependants ??
            res?.data?.dependants ??
            res?.data ??
            [];
          const dependantList = Array.isArray(rawDependants) ? rawDependants : [];
          dependantCache[patientId] = dependantList;
          return dependantList;
        } catch (err) {
          console.error(`Failed to load dependants for patient ${patientId}`, err);
          dependantCache[patientId] = [];
          return [];
        }
      };

      const relevantInvestigations = (
        await Promise.all(
          allInvestigations.map(async (inv) => {
            const invPatientId =
              inv.patientId ||
              inv.opdPatientId ||
              inv.patient?._id ||
              inv.patient?.id ||
              inv.opdPatient?._id ||
              inv.opdPatient?.id;
          const invStatus = String(inv.status || "").toLowerCase();
          
          if (invStatus === "awaiting_sonographer") return null;

          
            const matchesRegularPatient = awaitingLabPatients.some((patient) =>
              String(patient._id || patient.id) === String(invPatientId)
            );

            const matchesOpdPatient = awaitingLabOpdPatients.some((patient) =>
              String(patient.id) === String(invPatientId)
            );

            let matchesDependant = false;
            let dependantRecord = null;
            if (inv.dependantId) {
              if (inv.patientId) {
                const dependants = await loadDependantsForPatient(inv.patientId);
                dependantRecord = dependants.find(
                  (d) => String(d.id || d._id) === String(inv.dependantId)
                );
              } else if (Array.isArray(inv.patient?.dependants)) {
                dependantRecord = inv.patient.dependants.find(
                  (d) => String(d.id || d._id) === String(inv.dependantId)
                );
              }

              matchesDependant = dependantRecord
                ? (hasStatus(dependantRecord.status, PATIENT_STATUS.AWAITING_LAB) ||
                    hasStatus(dependantRecord.status, 'sonography_completed'))
                : false;
            }

            const shouldInclude = matchesRegularPatient || matchesOpdPatient || matchesDependant;
         return shouldInclude ? inv : null;
          })
        )
      ).filter(Boolean);

      console.log(
        "Investigation requests for awaiting_lab, OpD, or dependant patients:",
        relevantInvestigations.length
      );

      const investigationCards = await Promise.all(
        relevantInvestigations.map(async (inv) => {
          const invPatientId =
            inv.patientId ||
            inv.patient?._id ||
            inv.patient?.id ||
            inv.opdPatient?.id ||
            inv.opdPatient?._id;

          let patient = allPatients.find((p) =>
            String(p._id || p.id) === String(invPatientId)
          );

          let patientType = "regular";
          let patientName = "Unknown Patient";
          let displayId = invPatientId || "N/A";
          let requestedBy = inv.doctorName || "Doctor";

          const getDependantName = (dep) =>
            dep
              ?
                `${dep.firstName || ""} ${dep.lastName || ""}`.trim() ||
                dep.fullName ||
                dep.name ||
                null
              : null;

          const findDependant = async () => {
            if (inv.dependant) return inv.dependant;
            if (inv.patientId) {
              const dependants = await loadDependantsForPatient(inv.patientId);
              const found = dependants.find(
                (d) => String(d.id || d._id) === String(inv.dependantId)
              );
              if (found) return found;
            }
            if (Array.isArray(inv.patient?.dependants)) {
              return inv.patient.dependants.find(
                (d) => String(d.id || d._id) === String(inv.dependantId)
              );
            }
            return null;
          };

          const dependant = inv.dependantId ? await findDependant() : null;

          // Load OPD patient if not embedded
          if (!inv.opdPatient && inv.opdPatientId) {
            try {
              const opdRes = await getOpdPatientById(inv.opdPatientId);
              inv.opdPatient = opdRes?.data || opdRes;
            } catch (err) {
              console.warn("Failed to load OPD patient for investigation:", err);
            }
          }

          if (dependant) {
            patientType = "dependant";
            patientName = getDependantName(dependant) || "Unknown Dependant";
            displayId = dependant.id || dependant._id || inv.dependantId || displayId;
            requestedBy = "Dependant";
          } else if (patient) {
            patientName =
              `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
              patient.name ||
              "Unknown";
          } else if (inv.patient) {
            patientName =
              `${inv.patient.firstName || ""} ${inv.patient.lastName || ""}`.trim() ||
              inv.patient.name ||
              "Unknown";
          } else if (inv.opdPatient) {
            patient = inv.opdPatient;
            patientType = "opd";
            patientName =
              inv.opdPatient.fullName ||
              `${inv.opdPatient.firstName || ""} ${inv.opdPatient.lastName || ""}`.trim() ||
              "Unknown";
            displayId = inv.opdPatient.id || displayId;
            requestedBy = "Front Desk";
          } else {
            const opdPatient = awaitingLabOpdPatients.find(
              (p) => String(p.id) === String(invPatientId)
            );
            if (opdPatient) {
              patient = opdPatient;
              patientType = "opd";
              patientName = opdPatient.fullName || "Unknown OpD Patient";
              displayId = opdPatient.id;
              requestedBy = "Front Desk";
            }
          }

          const testNotes =
            inv.tests
              ?.map((test) => test.notes)
              .filter((note) => note)
              .join(", ") ||
            "No notes provided";

          // Get patient status
          let patientStatus = "unknown";
          if (dependant) {
            patientStatus = dependant.status || "unknown";
          } else if (patient) {
            patientStatus = patient.status || "unknown";
          }

          return {
            id: inv._id || inv.id,
            patientId: inv.patientId || invPatientId,
            dependantId: inv.dependantId,
            opdPatientId: inv.opdPatientId,
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
            sortTimestamp: inv.updatedAt || inv.createdAt, // use the investigation's own timestamp, not patient.updatedAt
            updatedAt: inv.updatedAt ? formatNigeriaDateTime(inv.updatedAt) : (patient?.updatedAt ? formatNigeriaDateTime(patient.updatedAt) : "N/A"),
          // symptoms: testNotes,
            patientType,
            investigationStatus: inv.status, // Add investigation status
            patientStatus, // Add patient status
          };
        })
      );

      const opdPatientCards = awaitingLabOpdPatients
        .filter((opdPatient) =>
          !relevantInvestigations.some((inv) => {
            const invPatientId =
              inv.patientId ||
              inv.opdPatientId ||
              inv.patient?._id ||
              inv.patient?.id ||
              inv.opdPatient?._id ||
              inv.opdPatient?.id;
            return invPatientId && String(invPatientId) === String(opdPatient.id);
          })
        )
        .map((opdPatient) => ({
          id: null,
          opdPatientId: opdPatient.id,
          name: opdPatient.fullName || "Unknown OpD Patient",
          userId: opdPatient.id,
          status: "Normal",
          test: "OpD Laboratory Request",
          date: opdPatient.createdAt
            ? formatNigeriaDate(opdPatient.createdAt)
            : "N/A",
          requestedBy: "Cashier",
          time: opdPatient.createdAt
            ? formatNigeriaTime(opdPatient.createdAt)
            : "N/A",
          createdAt: opdPatient.createdAt,
          sortTimestamp: opdPatient.updatedAt || opdPatient.createdAt,
          updatedAt: opdPatient.updatedAt ? formatNigeriaDateTime(opdPatient.updatedAt) : "N/A",
          patientType: "opd",
          patientStatus: opdPatient.status || "unknown",
        }));

      const formattedRequests = [...investigationCards, ...opdPatientCards];

     const sortedRequests = [...formattedRequests].sort((a, b) => {
      const aTime = new Date(a.sortTimestamp || a.createdAt || 0).getTime();
      const bTime = new Date(b.sortTimestamp || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const newRequests = sortedRequests.length;
    const urgentCount = sortedRequests.filter((card) => card.status === "Urgent").length;
    const highPriorityCount = sortedRequests.filter((card) => card.status === "High").length;


      // dedupe AFTER sort → keeps the newest of any duplicate group
      const uniqueRequests = sortedRequests.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      setTestRequests(uniqueRequests)

      setIncomingStats([
        {
          header: "New Request",
          value: newRequests,
        },
        {
          header: "Urgent Priority",
          value: urgentCount,
        },
        {
          header: "High Priority",
          value: highPriorityCount,
        },
        {
          header: "Avg. Wait time",
          value: "20 mm",
        },
      ]);

      console.log("Formatted requests:", formattedRequests);
    } catch (err) {
      console.error("Error fetching incoming lab requests:", err);
      setError("Failed to load incoming test requests");
      setIncomingStats([
        {
          header: "New Request",
          value: "0",
        },
        {
          header: "Urgent Priority",
          value: "0",
        },
        {
          header: "High Priority",
          value: "0",
        },
        {
          header: "Avg. Wait time",
          value: "N/A",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const bgChange = (status) => {
    if (status === "Urgent") {
      return "#FFE2E2";
    }
    if (status === "Normal") {
      return "#DBEAFE";
    }
  };

  useEffect(() => {
    fetchTestRequests();
  }, []);
  
  
  const fetchExistingLabResults = async () => {
    
    try {
           const { getLabResults } = await import('@/services/api/labResultsAPI');
           const labRes = await getLabResults();
           const labList = Array.isArray(labRes?.data) ? labRes.data
             : Array.isArray(labRes) ? labRes : [];
  
           // Map investigationRequestId → lab result _id
           const labMap = {};
           labList.forEach(lr => {
             const invId = lr.investigationRequestId || lr.investigationId;
             if (invId) labMap[invId] = lr._id || lr.id;
           });
           setExistingLabResults(labMap);
         } catch { /* silent */ }
  }
  
  useEffect(() => {
    fetchExistingLabResults();
  }, []);
  
  const handleAcceptFromDetails = (cardData) => {
    setSelectedCard(cardData);
    setShowModal(true);
  };

  const handleSendToSonographer = async (testCard) => {
    try {
      setSendingToSonographer(testCard.id);
      
      if (testCard.patientType === 'opd' && testCard.opdPatientId) {
        // Update OPD patient status
        await updateOpdPatient(testCard.opdPatientId, { status: "awaiting_sonographer" });
      } else if (testCard.patientType === 'dependant' && testCard.dependantId) {
        const { updateDependantStatus } = await import('@/services/api/dependantAPI');
        await updateDependantStatus(testCard.dependantId, { status: "awaiting_sonographer" });
      } else if (testCard.patientId) {
        // Update regular patient status
        await updatePatientStatus(testCard.patientId, "awaiting_sonographer");
      }

      // Refresh the test requests
      await fetchTestRequests();
      toast.success("Patient sent to sonographer successfully!");
    } catch (err) {
      console.error("Error sending to sonographer:", err);
      toast.error("Failed to send patient to sonographer");
    } finally {
      setSendingToSonographer(null);
    }
  };

    const { refreshQueueCount } = useNotifications();


     const handleClear = async (testCard) => {
      if (testCard.patientType === 'dependant') {
        await updateDependantStatus(testCard.dependantId, { status: PATIENT_STATUS.CANCELLED });
      } else {
        await updatePatientStatus(testCard.patientId, { status: PATIENT_STATUS.CANCELLED });
      }
      localStorage.setItem('refreshIncoming', Date.now().toString());
      refreshQueueCount();
    };


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

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        {sidebarWrapper}
        <div className="flex overflow-hidden flex-col flex-1 min-w-0">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading test requests...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-base-200">
      {sidebarWrapper}

      <div className="flex overflow-hidden flex-col flex-1 min-w-0">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex-1">
          <section className="p-3 sm:p-4">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <h4 className="text-xl sm:text-2xl lg:text-[32px] text-[#00943C]">
              Incoming Test Results
            </h4>
            <p className="text-xs sm:text-[12px]">
              Review and process new test requests from doctors
            </p>

            <div className="grid grid-cols-2 lg:flex gap-3 sm:gap-4 lg:justify-between mt-6">
              {incomingStats.map((test, index) => {
                return (
                  <div
                    key={index}
                    className={`w-full lg:w-[220px] h-auto lg:h-[110px] bg-white shadow p-3 text-sm rounded-md ${index === 1 ? "text-[#DC362E]" : ""}`}>
                    <h1 className="text-xs sm:text-sm text-[#605D66]">{test.header}</h1>
                    <p className="mt-2 text-xl sm:text-2xl font-semibold">{test.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mt-5">
              <h4 className="text-lg sm:text-[24px] font-normal">Patients Test Results</h4>
              <div className="flex items-center gap-3">
                <button className="text-sm sm:text-base text-[#3498DB] font-semibold cursor-pointer">
                  See All
                </button>
                <button
                  className="btn btn-xs btn-outline"
                  onClick={() => navigate('/dashboard/laboratory/incoming-scan')}
                >
                  Scan Upload
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {testRequests.length > 0 ? (
                testRequests.map((testCard, index) => {
                  return (
                    <div key={index} className="w-full h-auto border rounded-md p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm">{testCard.name}</p>
                            {testCard.patientType === 'dependant' && (
                              <span className="badge badge-secondary badge-xs">Dependant</span>
                            )}
                            {testCard.patientType === 'opd' && (
                              <span className="badge badge-info badge-xs">OPD</span>
                            )}
                            {testCard.patientStatus && (
                              <span className={`badge badge-xs ${
                                testCard.patientStatus === 'awaiting_lab' 
                                  ? 'badge-primary' 
                                  : testCard.patientStatus === 'sonography_completed'
                                  ? 'badge-warning'
                                  : 'badge-neutral'
                              }`}>
                                {testCard.patientStatus}
                              </span>
                            )}
                           
                            <div
                              style={{ backgroundColor: bgChange(testCard.status) }}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${testCard.status === "Urgent" ? "text-[#E7000B]" : "text-[#4680FC]"}`}
                            >
                              {testCard.status}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-[#605D66] space-y-0.5">
                            <div>Test: {testCard.test}</div>
                            <div>Date: {testCard.date} | Time: {testCard.time} </div>
                            <div>Investigation Status: {testCard.investigationStatus}</div>
                            <div>Updated at: {testCard.updatedAt}</div>
                          </div>
                        </div>

                          <div className="w-full sm:w-64 grid grid-cols-2 gap-2 shrink-0">
                          <button
                            onClick={() => { setSelectedCard(testCard); setShowModal2(true); }}
                              className="btn btn-sm btn-success w-full text-xs whitespace-nowrap"
                             >
                            View Details
                          </button>
                          {/* ✅ Edit button — only shows if lab result already exists */}
                            {testCard.id && existingLabResults[testCard.id] && (
                              <button
                                onClick={() => navigate(`/dashboard/laboratory/results/edit/${existingLabResults[testCard.id]}`)}
                                 className="btn btn-sm btn-warning w-full text-xs whitespace-nowrap"
                              >
                                Edit Lab Result
                              </button>
                                 )}
                          <button
                            onClick={() => handleSendToSonographer(testCard)}
                            disabled={sendingToSonographer === testCard.id}
                             className="btn btn-sm btn-outline w-full text-xs whitespace-nowrap"
                            >
                            {sendingToSonographer === testCard.id ? "Sending..." : "Send to Scanner"}
                          </button>
                           <div
                            className="w-full [&_button]:w-full [&_button]:text-xs [&_button]:whitespace-nowrap flex"
                              onClick={(e) => e.stopPropagation()}
                          >
                           

                            <ClearItemButton  item={testCard} onClear={handleClear} onCleared={fetchTestRequests}   />
                         
                          </div>
                        </div>
                      </div>

                      {showModal && (
                        <AcceptTestRequestModal data={selectedCard} setShowModal={setShowModal} onAcceptSuccess={fetchTestRequests} />
                      )}
                      {showModal2 && (
                        <TestRequestModal data={selectedCard} setShowModal2={setShowModal2} onAcceptFromDetails={handleAcceptFromDetails}  existingLabResultId={selectedCard?.id ? existingLabResults[selectedCard.id] : null} />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500">No test requests at the moment</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IncomingLaboratory;