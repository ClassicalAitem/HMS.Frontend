import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const LaboratoryDashboard = () => {
  const navigate = useNavigate();
  const [testStats, setTestStats] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [allPendingRequests, setAllPendingRequests] = useState([]);
  const [allCompletedTests, setAllCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const itemsPerPage = 4;

  const loadPatientRecord = async (patientId, opdPatientId) => {
    if (patientId) {
      try {
        const response = await getPatientById(patientId);
        return response?.data || response;
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.warn(`Failed to load patient ${patientId}:`, err);
        }
      }
    }

    if (opdPatientId) {
      try {
        const response = await getOpdPatientById(opdPatientId);
        return response?.data || response;
      } catch (err) {
        console.warn(`Failed to load OPD patient ${opdPatientId}:`, err);
      }
    }

    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [labResults, investigations] = await Promise.all([
          getLabResults(),
          getInvestigations(),
        ]);

        // Ensure data is array
        const resultsArray = Array.isArray(labResults) ? labResults : labResults?.data || [];
        const investigationsArray = Array.isArray(investigations) ? investigations : investigations?.data || [];

        // Process lab results
        const completed = resultsArray.filter(
          (result) => result.status === "completed"
        ).length + investigationsArray.filter(
          (inv) => inv.status === "completed"
        ).length;
        const pending = investigationsArray.filter(
          (inv) => inv.status === "pending" || inv.status === "requested"
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
            header: "Completed Tests",
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
        const allPendingTests = investigationsArray
          .filter((inv) => inv.status === "pending" || inv.status === "requested");

        const allPendingWithPatients = await Promise.all(
          allPendingTests.map(async (inv) => {
            try {
              const patientData = await loadPatientRecord(inv.patientId, inv.opdPatientId);

              const patientName =
                patientData?.firstName && patientData?.lastName
                  ? `${patientData.firstName} ${patientData.lastName}`
                  : patientData?.name ||
                    patientData?.fullName ||
                    patientData?.firstName ||
                    "Unknown Patient";

              return {
                name: patientName,
                issuedBy: "Doctor",
                status: "Pending",
              };
            } catch (err) {
              console.error(`Failed to fetch patient ${inv.patientId || inv.opdPatientId}:`, err);
              return {
                name: "Unknown Patient",
                issuedBy: "Doctor",
                status: "Pending",
              };
            }
          })
        );

        setAllPendingRequests(allPendingWithPatients);

        const completedInvestigations = investigationsArray
          .filter((result) => result.status === "completed")
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

        const completedLabResults = resultsArray
          .filter((result) => result.status === "completed")
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

        const completedInvestigationItems = await Promise.all(
          completedInvestigations.map(async (inv) => {
            try {
              const patientData = await loadPatientRecord(inv.patientId, inv.opdPatientId);
              const patientName =
                patientData?.firstName && patientData?.lastName
                  ? `${patientData.firstName} ${patientData.lastName}`
                  : patientData?.name ||
                    patientData?.fullName ||
                    patientData?.firstName ||
                    "Unknown Patient";

              return {
                key: `investigation-${inv._id || inv.id}`,
                name: patientName,
                testType: inv.tests?.map((t) => t.name).join(", ") || "Lab Test",
                date: inv.completedAt
                  ? formatNigeriaTime(inv.completedAt)
                  : formatNigeriaTime(inv.updatedAt || inv.createdAt),
              };
            } catch (err) {
              console.error(`Failed to fetch patient ${inv.patientId || inv.opdPatientId}:`, err);
              return {
                key: `investigation-${inv._id || inv.id}`,
                name: "Unknown Patient",
                testType: inv.tests?.map((t) => t.name).join(", ") || "Lab Test",
                date: formatNigeriaTime(inv.updatedAt || inv.createdAt),
              };
            }
          })
        );

        const completedLabResultItems = await Promise.all(
          completedLabResults.map(async (result) => {
            try {
              const patientData = await loadPatientRecord(result.patientId, result.opdPatientId);
              const patientName =
                patientData?.firstName && patientData?.lastName
                  ? `${patientData.firstName} ${patientData.lastName}`
                  : patientData?.name ||
                    patientData?.fullName ||
                    patientData?.firstName ||
                    result.patientId ||
                    result.opdPatientId ||
                    "Unknown Patient";

              const testType =
                (Array.isArray(result.result) && (result.result[0]?.code || result.result[0]?.value)) ||
                result.tests?.map((t) => t.name).join(", ") ||
                result.form?.clinicalDiagnosis ||
                "Lab Test";

              return {
                key: `labresult-${result._id || result.id}`,
                name: patientName,
                testType,
                date: result.completedAt
                  ? formatNigeriaTime(result.completedAt)
                  : formatNigeriaTime(result.updatedAt || result.createdAt),
              };
            } catch (err) {
              console.error(`Failed to fetch patient ${result.patientId || result.opdPatientId}:`, err);
              const testType =
                (Array.isArray(result.result) && (result.result[0]?.code || result.result[0]?.value)) ||
                result.tests?.map((t) => t.name).join(", ") ||
                result.form?.clinicalDiagnosis ||
                "Lab Test";

              return {
                key: `labresult-${result._id || result.id}`,
                name: result.patientId || result.opdPatientId || "Unknown Patient",
                testType,
                date: formatNigeriaTime(result.updatedAt || result.createdAt),
              };
            }
          })
        );

        const dedupedCompleted = [
          ...completedInvestigationItems,
          ...completedLabResultItems,
        ].filter((item, index, self) =>
          index === self.findIndex((other) =>
            item.key === other.key ||
            (item.name === other.name && item.testType === other.testType && item.date === other.date)
          )
        );

        setAllCompletedTests(dedupedCompleted);

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

  // Handle pagination for pending requests
  useEffect(() => {
    const startIndex = (pendingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPendingRequests(allPendingRequests.slice(startIndex, endIndex));
  }, [allPendingRequests, pendingPage, itemsPerPage]);

  // Handle pagination for completed tests
  useEffect(() => {
    const startIndex = (completedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCompletedTests(allCompletedTests.slice(startIndex, endIndex));
  }, [allCompletedTests, completedPage, itemsPerPage]);

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
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate('/dashboard/laboratory/incoming')}
                        className="text-[#3498DB] underline font-semibold cursor-pointer">
                        View All
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/laboratory/incoming-scan')}
                        className="btn btn-xs btn-outline"
                      >
                        Scan Upload
                      </button>
                    </div>
                    {/* Pagination for pending requests */}
                    {allPendingRequests.length > itemsPerPage && (
                      <div className="flex justify-center items-center mt-4 space-x-2">
                        <button
                          onClick={() => setPendingPage(Math.max(1, pendingPage - 1))}
                          disabled={pendingPage === 1}
                          className="px-3 py-1 border border-[#AEAAAE] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-[#605D66]">
                          Page {pendingPage} of {Math.ceil(allPendingRequests.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setPendingPage(Math.min(Math.ceil(allPendingRequests.length / itemsPerPage), pendingPage + 1))}
                          disabled={pendingPage === Math.ceil(allPendingRequests.length / itemsPerPage)}
                          className="px-3 py-1 border border-[#AEAAAE] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-[670px] h-[458px] rounded-[6px] border border-[#AEAAAE] p-5">
                  <h4 className="text-[24px] text-[#00943C]">
                    Completed Tests
                  </h4>
                  <p className="text-[#605D66]">
                    Here is an overview of all your completed requests.
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
                      onClick={() => navigate('/dashboard/laboratory/completed')}
                      className="text-[#3498DB] underline font-semibold cursor-pointer">
                      View All
                    </button>
                    {/* Pagination for completed tests */}
                    {allCompletedTests.length > itemsPerPage && (
                      <div className="flex justify-center items-center mt-4 space-x-2">
                        <button
                          onClick={() => setCompletedPage(Math.max(1, completedPage - 1))}
                          disabled={completedPage === 1}
                          className="px-3 py-1 border border-[#AEAAAE] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-[#605D66]">
                          Page {completedPage} of {Math.ceil(allCompletedTests.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCompletedPage(Math.min(Math.ceil(allCompletedTests.length / itemsPerPage), completedPage + 1))}
                          disabled={completedPage === Math.ceil(allCompletedTests.length / itemsPerPage)}
                          className="px-3 py-1 border border-[#AEAAAE] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                        >
                          Next
                        </button>
                      </div>
                    )}
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
