import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getAllInvestigationRequests } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";

const LaboratoryDashboard = () => {
  const navigate = useNavigate();
  const [testStats, setTestStats] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [labResults, investigations] = await Promise.all([
          getLabResults(),
          getAllInvestigationRequests(),
        ]);

        // Ensure data is array
        const resultsArray = Array.isArray(labResults) ? labResults : labResults?.data || [];
        const investigationsArray = Array.isArray(investigations) ? investigations : investigations?.data || [];

        // Process lab results
        const completed = resultsArray.filter(
          (result) => result.status === "completed"
        ).length;
        const pending = investigationsArray.filter(
          (inv) => inv.status === "pending"
        ).length;
        const inProgress = investigationsArray.filter(
          (inv) => inv.status === "processing"
        ).length;

        setTestStats([
          {
            header: "Pending Test",
            value: pending,
            status: "+3 from yesterday",
          },
          {
            header: "Completed Today",
            value: completed,
            status: "On Track",
          },
          {
            header: "In Progress",
            value: inProgress,
            status: "3 urgent",
          },
          {
            header: "Low Stock Items",
            value: "7",
            status: "Needed Attention",
          },
        ]);

        // Fetch patient details for pending requests
        const pendingTests = investigationsArray
          .filter((inv) => inv.status === "pending")
          .slice(0, 4);

        const pendingWithPatients = await Promise.all(
          pendingTests.map(async (inv) => {
            try {
              const patientResponse = await getPatientById(inv.patientId);
              // Extract data from response wrapper
              const patientData = patientResponse?.data || patientResponse;
              
              const patientName =
                patientData?.firstName && patientData?.lastName
                  ? `${patientData.firstName} ${patientData.lastName}`
                  : patientData?.name ||
                    patientData?.firstName ||
                    "Unknown Patient";

              return {
                name: patientName,
                issuedBy: "Doctor",
                status: "Pending",
              };
            } catch (err) {
              console.error(`Failed to fetch patient ${inv.patientId}:`, err);
              return {
                name: "Unknown Patient",
                issuedBy: "Doctor",
                status: "Pending",
              };
            }
          })
        );

        setPendingRequests(pendingWithPatients);

        // Filter for tests completed TODAY from investigations
        const today = new Date().toDateString();
        const completedTests_data = investigationsArray
          .filter((result) => {
            if (result.status !== "completed") return false;
            const completionTime = result.completedAt || result.updatedAt || result.createdAt;
            if (!completionTime) return false;
            const completedDate = new Date(completionTime).toDateString();
            return completedDate === today;
          })
          .slice(0, 4);

        // Fetch patient details for completed tests
        const completedWithPatients = await Promise.all(
          completedTests_data.map(async (inv) => {
            try {
              const patientResponse = await getPatientById(inv.patientId);
              const patientData = patientResponse?.data || patientResponse;
              
              const patientName =
                patientData?.firstName && patientData?.lastName
                  ? `${patientData.firstName} ${patientData.lastName}`
                  : patientData?.name ||
                    patientData?.firstName ||
                    "Unknown Patient";

              return {
                name: patientName,
                testType: inv.tests?.map((t) => t.name).join(", ") || "Lab Test",
                date: inv.completedAt
                  ? new Date(inv.completedAt).toLocaleTimeString()
                  : new Date(inv.updatedAt || inv.createdAt).toLocaleTimeString(),
              };
            } catch (err) {
              console.error(`Failed to fetch patient ${inv.patientId}:`, err);
              return {
                name: "Unknown Patient",
                testType: inv.tests?.map((t) => t.name).join(", ") || "Lab Test",
                date: new Date(inv.updatedAt || inv.createdAt).toLocaleTimeString(),
              };
            }
          })
        );

        setCompletedTests(completedWithPatients);

        setError(null);
      } catch (err) {
        console.error("Error fetching laboratory data:", err);
        setError("Failed to load laboratory data");
        // Fallback to default values on error
        setTestStats([
          {
            header: "Pending Test",
            value: "0",
            status: "Unable to load",
          },
          {
            header: "Completed Today",
            value: "0",
            status: "Unable to load",
          },
          {
            header: "In Progress",
            value: "0",
            status: "Unable to load",
          },
          {
            header: "Low Stock Items",
            value: "0",
            status: "Unable to load",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading laboratory data...</p>
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
          <section className="p-7">            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}            <h4 className="text-[32px] text-[#00943C]">
              Welcome Back, Lab Technician!
            </h4>
            <p className="text-[12px]">
              Here’s what’s happening in your lab today. Thursday 5th October
              2025
            </p>

            <div className="flex gap-[20px] justify-between mt-10">
              {testStats.map((test, index) => {
                const isFourthCard = index === 3;
                return (
                  <div
                    key={index}
                    className={`w-[300px] h-[150px] bg-[#FFFFFF] shadow p-5 text-[12px] rounded-[8px] ${
                      isFourthCard ? "text-[#DC362E]" : ""
                    }`}
                  >
                    <h1
                      className={`text-[16px] text-[#605D66] ${
                        isFourthCard ? "text-[#DC362E]" : ""
                      }`}
                    >
                      {test.header}
                    </h1>
                    <p className="py-2 text-[30px] ">{test.value}</p>
                    <p
                      className={`text-[#605D66] text-[12px] ${
                        isFourthCard ? "text-[#DC362E]" : ""
                      }`}
                    >
                      {test.status}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Pending test results and Completed Today */}

            <section className="mt-10">
              <div className="flex justify-between">
                <div className="w-[670px] h-[458px] rounded-[6px] border border-[#AEAAAE] p-5">
                  <h4 className="text-[24px] text-[#00943C]">
                    Pending Test Requests
                  </h4>
                  <p className="text-[#605D66]">
                    Overview of tests awaiting processing.
                  </p>

                  <div className="mt-5 flex flex-col gap-5 ">
                    {pendingRequests.length > 0 ? (
                      pendingRequests.map((result, index) => (
                        <div
                          key={index}
                          className="w-full h-[60px] border border-[#AEAAAE] rounded-[6px]"
                        >
                          <div className="flex justify-between items-center px-3 mt-2">
                            <div className="flex gap-3 items-center">
                              <span className="w-[10px] h-[10px] rounded-full bg-[#3498DB] inline-block"></span>
                              <div>
                                <p className="text-[16px] font-[500]">
                                  {result.name}
                                </p>
                                <p className="text-[12px]">{result.issuedBy}</p>
                              </div>
                            </div>
                            <div className="bg-[#3498DB] w-[78px] h-[32px] flex items-center justify-center rounded-[6px]">
                              {result.status}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No pending requests</p>
                    )}
                    <button 
                      onClick={() => navigate('/dashboard/laboratory/incoming')}
                      className="text-[#3498DB] underline font-semibold cursor-pointer">
                      View All
                    </button>
                  </div>
                </div>

                <div className="w-[670px] h-[458px] rounded-[6px] border border-[#AEAAAE] p-5">
                  <h4 className="text-[24px] text-[#00943C]">
                    Completed Today
                  </h4>
                  <p className="text-[#605D66]">
                    Here is an overview of all your completed request
                  </p>

                  <div className="mt-5 flex flex-col gap-5 ">
                    {completedTests.length > 0 ? (
                      completedTests.map((result, index) => (
                        <div
                          key={index}
                          className="w-full h-[60px] border border-[#AEAAAE] rounded-[6px]"
                        >
                          <div className="flex justify-between items-center px-3 mt-2">
                            <div className="flex gap-3 items-center">
                              <span className="w-[10px] h-[10px] rounded-full bg-[#71B908] inline-block"></span>
                              <div>
                                <p className="text-[16px] font-[500]">
                                  {result.name}
                                </p>
                                <p className="text-[12px]">{result.testType}</p>
                              </div>
                            </div>
                            <div className=" flex items-center justify-center rounded-[6px]">
                              {result.date}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No completed tests</p>
                    )}
                    <button 
                      // onClick={() => navigate('/laboratory/completed')}
                      className="text-[#3498DB] underline font-semibold cursor-pointer">
                      View All
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryDashboard;
