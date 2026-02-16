import React, { useState, useEffect } from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import AcceptTestRequestModal from "./modals/AcceptTestRequestModal";
import TestRequestModal from "./modals/TestRequestModal";
import { getAllInvestigationRequests } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";

const IncomingLaboratory = () => {
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
      const response = await getAllInvestigationRequests();
      
      console.log("Full API response:", response);
      
      // Extract data array from response - handle both array and object responses
      const investigationsArray = Array.isArray(response) 
        ? response 
        : (response?.data || []);
      
      console.log("Investigations array:", investigationsArray);
      console.log("Total investigations:", investigationsArray.length);
      
      // Log all status values to see what we're working with
      const statusValues = investigationsArray.map(inv => ({
        id: inv._id,
        status: inv.status,
        priority: inv.priority
      }));
      console.log("Status values in data:", statusValues);

      // Calculate stats from ALL investigations (for accurate counts)
      const newRequests = investigationsArray.filter((inv) => inv.status === "pending").length;
      const urgentCount = investigationsArray.filter((inv) => inv.priority === "urgent").length;
      const highPriorityCount = investigationsArray.filter((inv) => inv.priority === "high").length;

      console.log("Pending count:", newRequests);
      console.log("Urgent count:", urgentCount);
      console.log("High priority count:", highPriorityCount);

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

      // Format ONLY pending test requests with patient details
      const formattedRequests = await Promise.all(
        investigationsArray
          .filter((inv) => inv.status === "pending")
          .map(async (inv) => {
          try {
            const patientResponse = await getPatientById(inv.patientId);
            const patientData = patientResponse?.data || patientResponse;
            
            const patientName =
              patientData?.firstName && patientData?.lastName
                ? `${patientData.firstName} ${patientData.lastName}`
                : patientData?.name ||
                  patientData?.firstName ||
                  "Unknown Patient";

            // Extract notes from tests array
            const testNotes = inv.tests
              ?.map((test) => test.notes)
              .filter((note) => note)
              .join(", ") || "No notes provided";

            return {
              id: inv._id || inv.id,
              name: patientName,
              userId: patientData?.hospitalId || inv.patientId || "N/A",
              status: inv.priority === "urgent" ? "Urgent" : "Normal",
              test: inv.tests?.map((t) => t.name).join(", ") || inv.investigationType || "Lab Test",
              date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "N/A",
              requestedBy: inv.doctorName || "Doctor",
              time: inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString() : "N/A",
              symptoms: testNotes,
            };
          } catch (err) {
            console.error(`Failed to fetch patient ${inv.patientId}:`, err);
            
            // Extract notes from tests array even on error
            const testNotes = inv.tests
              ?.map((test) => test.notes)
              .filter((note) => note)
              .join(", ") || "No notes provided";

            return {
              id: inv._id || inv.id,
              name: "Unknown Patient",
              userId: inv.patientId || "N/A",
              status: inv.priority === "urgent" ? "Urgent" : "Normal",
              test: inv.tests?.map((t) => t.name).join(", ") || inv.investigationType || "Lab Test",
              date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "N/A",
              requestedBy: inv.doctorName || "Doctor",
              time: inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString() : "N/A",
              symptoms: testNotes,
            };
          }
        })
      );

      console.log("Formatted requests (pending only):", formattedRequests);
      setTestRequests(formattedRequests);
      setError(null);
    } catch (err) {
      console.error("Error fetching investigation requests:", err);
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
          <section className="p-7">
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

            <div className="flex gap-10 justify-between mt-10">
              {incomingStats.map((test, index) => {
                return (
                  <div
                    key={index}
                    className={`w-[300px] h-[150px] bg-[#FFFFFF] shadow p-5 text-[12px] rounded-[8px] ${
                      index === 1 ? "text-[#DC362E] " : ""
                    }`}
                  >
                    <h1 className="text-[16px] text-[#605D66]">
                      {test.header}
                    </h1>
                    <p className="py-2 text-[30px] mt-5">{test.value}</p>
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

            <div className="flex flex-col gap-5 mt-5">
              {testRequests.length > 0 ? (
                testRequests.map((testCard, index) => {
                  return (
                    <div
                      key={index}
                      className="w-full h-[280px] border border-[#605D66] rounded-[6px]"
                    >
                      <div className="flex flex-col gap-8 p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex gap-5 items-center">
                              <p className="font-semibold">{testCard.name}</p>
                              <p className="text-[12px]">{testCard.userId}</p>
                              <p
                                style={{
                                  backgroundColor: bgChange(testCard.status),
                                }}
                                className={`w-[62px] h-[32px] flex justify-center items-center text ${
                                  testCard.status === "Urgent"
                                    ? "text-[#E7000B]"
                                    : "text-[#4680FC]"
                                }`}
                              >
                                {testCard.status}
                              </p>
                            </div>

                            <div>
                              <p className="text-[12px] text-[#605D66]">
                                Test: {testCard.test}
                              </p>
                              <p className="text-[12px] text-[#605D66]">
                                Date: {testCard.date}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="font-semibold">
                              Requested by: {testCard.requestedBy}
                            </p>
                            <p className="text-[12px] text-[#605D66]">
                              Date: {testCard.date}
                            </p>
                            <p className="text-[12px] text-[#605D66]">
                              Time: {testCard.time}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-col">
                            <button
                              onClick={() => {
                                setSelectedCard(testCard), setShowModal(true);
                              }}
                              className="w-[258px] h-[56px] bg-[#00943C] text-[#FFFFFF]"
                            >
                              Accept & Process
                            </button>

                            {showModal && (
                              <AcceptTestRequestModal
                                data={selectedCard}
                                setShowModal={setShowModal}
                                onAcceptSuccess={fetchTestRequests}
                              />
                            )}

                            <button
                              onClick={() => {
                                setSelectedCard(testCard), setShowModal2(true);
                              }}
                              className="w-[258px] h-[56px] border border-[#AEAAAE]"
                            >
                              View Details
                            </button>

                            {showModal2 && (
                              <TestRequestModal
                                data={selectedCard}
                                setShowModal2={setShowModal2}
                                onAcceptFromDetails={handleAcceptFromDetails}
                              />
                            )}
                          </div>
                        </div>

                        <div className="w-full h-[76px] bg-[#EFEFEF] p-4">
                          <p className="text-[16px] text-[#605D66]">
                            Symptoms/Notes:
                          </p>
                          <p className="font-semibold">{testCard.symptoms}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No test requests at the moment
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IncomingLaboratory;
