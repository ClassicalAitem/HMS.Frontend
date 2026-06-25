import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import AcceptTestRequestModal from "./modals/AcceptTestRequestModal";
import TestRequestModal from "./modals/TestRequestModal";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatientById, getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { updateOpdPatient } from '@/services/api/opdPatientAPI';
import { hasStatus } from "@/utils/statusUtils";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { getAllOpdPatients } from "@/services/api/opdPatientAPI";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [incomingStats, setIncomingStats] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [existingLabResults, setExistingLabResults] = useState({});
  const [sendingToSonographer, setSendingToSonographer] = useState(null);

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
      console.log("OpD patients with awaiting_lab or sonography_completed status:", awaitingLabOpdPatients.length);

      // Step 2: Fetch all investigation requests
      console.log("📥 Fetching investigation requests...");
      const investigationsResponse = await getInvestigations();
      const allInvestigations = Array.isArray(investigationsResponse) 
        ? investigationsResponse 
        : (investigationsResponse?.data || []);
      
      console.log("Total investigation requests:", allInvestigations.length);
      console.log("Awaiting lab patients:", awaitingLabPatients.length);
      console.log("Awaiting lab OPD patients:", awaitingLabOpdPatients.length);

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
            if (inv.dependantId && inv.patientId) {
              // Check if parent patient is still in awaitingLabPatients
              const parentIsAwaitingLab = awaitingLabPatients.some((patient) =>
                String(patient._id || patient.id) === String(inv.patientId)
              );
              if (parentIsAwaitingLab) {
                const dependants = await loadDependantsForPatient(inv.patientId);
                matchesDependant = dependants.some(
                  (d) => String(d.id || d._id) === String(inv.dependantId)
                );
              }
            } else if (inv.dependantId && Array.isArray(inv.patient?.dependants)) {
              // Check if parent patient is still in awaitingLabPatients
              const parentIsAwaitingLab = awaitingLabPatients.some((patient) =>
                String(patient._id || patient.id) === String(inv.patient._id || inv.patient.id)
              );
              if (parentIsAwaitingLab) {
                matchesDependant = inv.patient.dependants.some(
                  (d) => String(d.id || d._id) === String(inv.dependantId)
                );
              }
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
          if (dependant && patient) {
            patientStatus = patient.status || "unknown";
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
          // symptoms: "Direct lab request",
          patientType: "opd",
          patientStatus: opdPatient.status || "unknown",
        }));

      const formattedRequests = [...investigationCards, ...opdPatientCards];

      const newRequests = formattedRequests.length;
      const urgentCount = formattedRequests.filter((card) => card.status === "Urgent").length;
      const highPriorityCount = formattedRequests.filter((card) => card.status === "High").length;

      const uniqueRequests = formattedRequests.filter(
  (item, index, self) =>
    index ===
    self.findIndex(
      (t) =>
        t.userId === item.userId &&
        t.test === item.test &&
        t.date === item.date
    )
      ).sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return aTime - bTime; 
      });

      setTestRequests(uniqueRequests);


      // After setTestRequests(uniqueRequests) — fetch existing lab results
          
       


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
      } else if (testCard.patientType === 'dependant' && testCard.patientId) {
        // Update main patient status for dependant
        await updatePatientStatus(testCard.patientId, "awaiting_sonographer");
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

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading test requests...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-4">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <h4 className="text-[32px] text-[#00943C]">
              Incoming Test Results
            </h4>
            <p className="text-[12px]">
              Review and process new test requests from doctors
            </p>

            <div className="flex gap-4 justify-between mt-6 flex-wrap">
              {incomingStats.map((test, index) => {
                return (
                  <div
                    key={index}
                    className={`w-[220px] h-[110px] bg-white shadow p-3 text-sm rounded-md ${index === 1 ? "text-[#DC362E]" : ""}`}>
                    <h1 className="text-sm text-[#605D66]">{test.header}</h1>
                    <p className="mt-2 text-2xl font-semibold">{test.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-5">
              <h4 className="text-[24px] font-normal">Patients Test Results</h4>
              <div className="flex items-center gap-3">
                <button className="text-[#3498DB] font-semibold cursor-pointer">
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
                    <div key={index} className="w-full h-[130px] border rounded-md p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
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
                          <div className="mt-1 text-xs text-[#605D66]">
                            <div>Test: {testCard.test}</div>
                            <div>Date: {testCard.date} | Time: {testCard.time} </div>
                            <div>Investigation Status: {testCard.investigationStatus}</div>
                          </div>
                        </div>

                        <div className="w-44 flex flex-col gap-2">
                          <button
                            onClick={() => { setSelectedCard(testCard); setShowModal2(true); }}
                            className="btn btn-sm btn-success w-full"
                          >
                            View Details
                          </button>
                          {/* ✅ Edit button — only shows if lab result already exists */}
                            {testCard.id && existingLabResults[testCard.id] && (
                              <button
                                onClick={() => navigate(`/dashboard/laboratory/results/edit/${existingLabResults[testCard.id]}`)}
                                className="btn btn-sm btn-warning w-full"
                              >
                                Edit Lab Result
                              </button>
                            )}
                          <button
                            onClick={() => handleSendToSonographer(testCard)}
                            disabled={sendingToSonographer === testCard.id}
                            className="btn btn-sm btn-outline w-full"
                          >
                            {sendingToSonographer === testCard.id ? "Sending..." : "Send to Scanner"}
                          </button>
                        </div>
                      </div>

                      {/* <div className="mt-3 bg-[#EFEFEF] p-2 rounded text-sm">
                        // // <strong>Symptoms/Notes:</strong> <span className="ml-2">{testCard.symptoms}</span>
                      </div> */}
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
