import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import AcceptTestRequestModal from "./modals/AcceptTestRequestModal";
import TestRequestModal from "./modals/TestRequestModal";
import { getAllInvestigationRequests } from "@/services/api/investigationRequestAPI";
import { getPatientById, getPatients } from "@/services/api/patientsAPI";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [incomingStats, setIncomingStats] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const fetchTestRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch all patients and filter those with awaiting_lab status
      console.log("📥 Fetching all patients...");
      const patientsResponse = await getPatients();
      const allPatients = Array.isArray(patientsResponse) 
        ? patientsResponse 
        : (patientsResponse?.data || []);
      
      const awaitingLabPatients = allPatients.filter((p) => p.status === "awaiting_lab");
      console.log("Patients with awaiting_lab status:", awaitingLabPatients.length);

      // Step 2: Fetch all investigation requests
      console.log("📥 Fetching investigation requests...");
      const investigationsResponse = await getAllInvestigationRequests();
      const allInvestigations = Array.isArray(investigationsResponse) 
        ? investigationsResponse 
        : (investigationsResponse?.data || []);
      
      console.log("Total investigation requests:", allInvestigations.length);

      // Step 3: Match investigation requests with awaiting_lab patients
      const relevantInvestigations = allInvestigations.filter((inv) => {
        return awaitingLabPatients.some((patient) => 
          (patient._id || patient.id) === (inv.patientId || inv.patient?._id || inv.patient?.id)
        );
      });

      console.log("Investigation requests for awaiting_lab patients:", relevantInvestigations.length);

      // Calculate stats
      const newRequests = relevantInvestigations.length;
      const urgentCount = relevantInvestigations.filter((inv) => inv.priority === "urgent").length;
      const highPriorityCount = relevantInvestigations.filter((inv) => inv.priority === "high").length;

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

      // Step 4: Format investigation requests with patient data
      const formattedRequests = relevantInvestigations.map((inv) => {
        // Find matching patient from our fetched patients array
        const patient = awaitingLabPatients.find((p) => 
          (p._id || p.id) === (inv.patientId || inv.patient?._id || inv.patient?.id)
        );

        const patientName = patient
          ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || "Unknown"
          : "Unknown Patient";

        // Extract notes from tests array
        const testNotes = inv.tests
          ?.map((test) => test.notes)
          .filter((note) => note)
          .join(", ") || "No notes provided";

        return {
          id: inv._id || inv.id,
          name: patientName,
          userId: patient?.hospitalId || inv.patientId || "N/A",
          status: inv.priority === "urgent" ? "Urgent" : "Normal",
          test: inv.tests?.map((t) => t.name).join(", ") || inv.investigationType || "Lab Test",
          date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "N/A",
          requestedBy: inv.doctorName || "Doctor",
          time: inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString() : "N/A",
          symptoms: testNotes,
        };
      });

      console.log("Formatted requests:", formattedRequests);
      setTestRequests(formattedRequests);
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

  const handleAcceptFromDetails = (cardData) => {
    setSelectedCard(cardData);
    setShowModal(true);
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
              <button className="text-[#3498DB] font-semibold cursor-pointer">
                See All
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {testRequests.length > 0 ? (
                testRequests.map((testCard, index) => {
                  return (
                    <div key={index} className="w-full h-[160px] border rounded-md p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-sm">{testCard.name}</p>
                            <p className="text-xs text-muted">{testCard.userId}</p>
                            <div
                              style={{ backgroundColor: bgChange(testCard.status) }}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${testCard.status === "Urgent" ? "text-[#E7000B]" : "text-[#4680FC]"}`}
                            >
                              {testCard.status}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-[#605D66]">
                            <div>Test: {testCard.test}</div>
                            <div>Date: {testCard.date}</div>
                          </div>
                        </div>

                        <div className="w-44 flex flex-col gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/laboratory/results/add/${testCard.id}`)}
                            className="btn btn-sm btn-success w-full"
                          >
                            Accept & Process
                          </button>
                          <button
                            onClick={() => { setSelectedCard(testCard); setShowModal2(true); }}
                            className="btn btn-sm btn-ghost w-full"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 bg-[#EFEFEF] p-2 rounded text-sm">
                        <strong>Symptoms/Notes:</strong> <span className="ml-2">{testCard.symptoms}</span>
                      </div>
                      {showModal && (
                        <AcceptTestRequestModal data={selectedCard} setShowModal={setShowModal} onAcceptSuccess={fetchTestRequests} />
                      )}
                      {showModal2 && (
                        <TestRequestModal data={selectedCard} setShowModal2={setShowModal2} onAcceptFromDetails={handleAcceptFromDetails} />
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
