import React, { useState, useEffect } from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const CompletedTests = () => {
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

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
    const fetchCompletedTests = async () => {
      try {
        setLoading(true);
        const [labResults, investigations] = await Promise.all([
          getLabResults(),
          getInvestigations(),
        ]);

        // Ensure data is array
        const resultsArray = Array.isArray(labResults) ? labResults : labResults?.data || [];
        const investigationsArray = Array.isArray(investigations) ? investigations : investigations?.data || [];

        // Filter for completed investigations
        const completedInvestigations = investigationsArray.filter((result) => result.status === "completed");

        const completedLabResults = resultsArray.filter((result) => result.status === "completed");

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
                completedAt: new Date(inv.completedAt || inv.updatedAt || inv.createdAt),
              };
            } catch (err) {
              console.error(`Failed to fetch patient ${inv.patientId || inv.opdPatientId}:`, err);
              return {
                key: `investigation-${inv._id || inv.id}`,
                name: "Unknown Patient",
                testType: inv.tests?.map((t) => t.name).join(", ") || "Lab Test",
                date: formatNigeriaTime(inv.updatedAt || inv.createdAt),
                completedAt: new Date(inv.updatedAt || inv.createdAt),
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
                completedAt: new Date(result.completedAt || result.updatedAt || result.createdAt),
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
                completedAt: new Date(result.updatedAt || result.createdAt),
              };
            }
          })
        );

        // Combine and deduplicate
        const allCompleted = [
          ...completedInvestigationItems,
          ...completedLabResultItems,
        ].filter((item, index, self) =>
          index === self.findIndex((other) =>
            item.key === other.key ||
            (item.name === other.name && item.testType === other.testType && item.date === other.date)
          )
        ).sort((a, b) => b.completedAt - a.completedAt); // Sort by most recent

        setCompletedTests(allCompleted);
        setTotalPages(Math.ceil(allCompleted.length / itemsPerPage));
        setError(null);
      } catch (err) {
        console.error("Error fetching completed tests:", err);
        setError("Failed to load completed tests");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTests();
  }, []);

  const paginatedTests = completedTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading completed tests...</p>
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

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[32px] text-[#00943C]">
                Completed Tests
              </h4>
              <p className="text-[#605D66]">
                Total: {completedTests.length} completed tests
              </p>
            </div>

            <div className="bg-white rounded-[6px] border border-[#AEAAAE] p-5">
              {paginatedTests.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedTests.map((test, index) => (
                      <div
                        key={test.key || index}
                        className="w-full h-[60px] border border-[#AEAAAE] rounded-[6px] p-3"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex gap-3 items-center">
                            <span className="w-[10px] h-[10px] rounded-full bg-[#71B908] inline-block"></span>
                            <div>
                              <p className="text-[16px] font-[500]">
                                {test.name}
                              </p>
                              <p className="text-[12px] text-[#605D66]">{test.testType}</p>
                            </div>
                          </div>
                          <div className="text-[#605D66] text-[12px]">
                            {test.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-6 space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-[#AEAAAE] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === page
                              ? "bg-[#00943C] text-white border-[#00943C]"
                              : "border-[#AEAAAE] hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-[#AEAAAE] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No completed tests found</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CompletedTests;