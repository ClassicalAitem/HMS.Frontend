import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAllDependantsForPatient, getDependantById } from "@/services/api/dependantAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import AcceptTestRequestModal from "@/pages/laboratory/incoming/modals/AcceptTestRequestModal";
import TestRequestModal from "@/pages/laboratory/incoming/modals/TestRequestModal";
import toast from "react-hot-toast";

const OrderedLab = () => {
  const navigate = useNavigate();
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  const [patientCache, setPatientCache] = useState({});
  const [existingLabResults, setExistingLabResults] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== searchTerm) {
        setSearchTerm(searchInputValue);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInputValue, searchTerm]);

  const fetchInvestigations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getInvestigations();
      const investigationsData = Array.isArray(response)
        ? response
        : response?.data || response?.data?.data || response?.results || [];

      setAllInvestigations(investigationsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching investigations:", err);
      setError("Failed to load ordered lab requests");
      toast.error("Failed to load ordered lab requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  const filteredInvestigations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const baseList = Array.isArray(allInvestigations) ? allInvestigations : [];

    return !query
      ? baseList
      : baseList.filter((inv) => {
          const searchText = [
            inv._id,
            inv.id,
            inv.patientId,
            inv.opdPatientId,
            inv.dependantId,
            inv.status,
            Array.isArray(inv.tests) ? inv.tests.map((t) => t.name || t.code || t).join(" ") : "",
            inv.patient?.firstName,
            inv.patient?.lastName,
            inv.patient?.fullName,
            inv.patient?.name,
            inv.opdPatient?.fullName,
            inv.opdPatient?.name,
            inv.dependant?.firstName,
            inv.dependant?.lastName,
            inv.dependant?.fullName,
            inv.dependant?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchText.includes(query);
        });
  }, [allInvestigations, searchTerm]);

  const paginatedInvestigations = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredInvestigations.slice(start, start + resultsPerPage);
  }, [currentPage, filteredInvestigations]);

  const totalResults = filteredInvestigations.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const fetchExistingLabResults = useCallback(async () => {
    try {
      const labRes = await getLabResults();
      const labList = Array.isArray(labRes?.data) ? labRes.data
        : Array.isArray(labRes) ? labRes : [];

      const labMap = {};
      labList.forEach(lr => {
        const invId = lr.investigationRequestId || lr.investigationId;
        if (invId) labMap[invId] = lr._id || lr.id;
      });
      setExistingLabResults(labMap);
    } catch (err) {
      console.error("Error fetching existing lab results:", err);
    }
  }, []);

  useEffect(() => {
    fetchExistingLabResults();
  }, [fetchExistingLabResults]);

  const getPatientName = async (inv) => {
    const cacheKey = inv.dependantId || inv.opdPatientId || inv.patientId || inv._id || inv.id || "unknown";
    if (patientCache[cacheKey]) return patientCache[cacheKey];

    try {
      let name = "Unknown";
      let patientType = "Patient";

      if (inv.dependantId) {
        patientType = "Dependant";
        let dependant = inv.dependant;

        if (!dependant) {
          try {
            const depRes = await getDependantById(inv.dependantId);
            dependant = depRes?.data?.data?.dependant || depRes?.data?.dependant || depRes?.data || depRes;
          } catch (err) {
            // ignore and fallback later
          }
        }

        if (!dependant && inv.patientId) {
          const res = await getAllDependantsForPatient(inv.patientId);
          const dependants = res?.data?.data?.dependants || res?.data?.dependants || res?.data || [];
          dependant = Array.isArray(dependants)
            ? dependants.find((d) => String(d.id || d._id) === String(inv.dependantId))
            : null;
        }

        if (dependant) {
          name = `${dependant.firstName || ""} ${dependant.lastName || ""}`.trim() || dependant.fullName || dependant.name || "Unknown Dependant";
        }
      } else if (inv.opdPatientId) {
        patientType = "OPD Patient";
        const res = await getOpdPatientById(inv.opdPatientId);
        const patient = res?.data || res || inv.opdPatient;
        if (patient) {
          name = patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || patient.name || "Unknown OPD";
        }
      } else if (inv.patientId) {
        const res = await getPatientById(inv.patientId);
        const patient = res?.data || res || inv.patient;
        if (patient) {
          name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || patient.fullName || patient.name || "Unknown Patient";
        }
      } else if (inv.patient) {
        name = `${inv.patient.firstName || ""} ${inv.patient.lastName || ""}`.trim() || inv.patient.fullName || inv.patient.name || name;
      }

      const result = { name, type: patientType };
      setPatientCache((prev) => ({ ...prev, [cacheKey]: result }));
      return result;
    } catch (err) {
      console.error("Error fetching patient name:", err);
      return { name: "Unknown", type: "Patient" };
    }
  };

  const handleSearchInput = (value) => {
    setSearchInputValue(value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAcceptFromDetails = (cardData) => {
    setSelectedCard(cardData);
    setShowModal(true);
  };

  const handleProcess = (inv) => {
    // Navigate to add lab result page with investigation data
    if (inv.dependantId) {
      navigate(`/dashboard/laboratory/results/add/${inv._id}?dependantId=${inv.dependantId}&patientId=${inv.patientId}`);
    } else if (inv.opdPatientId) {
      navigate(`/dashboard/laboratory/results/add-opd?opdPatientId=${inv.opdPatientId}&investigationId=${inv._id}`);
    } else {
      navigate(`/dashboard/laboratory/results/add/${inv._id}?patientId=${inv.patientId}`);
    }
  };

  if (loading && allInvestigations.length === 0) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading ordered lab requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-lg text-red-600 mb-4">{error}</p>
              <button
                onClick={() => navigate("/dashboard/laboratory")}
                className="px-6 py-2 bg-[#00943C] text-white font-semibold rounded-lg"
              >
                Back to Dashboard
              </button>
            </div>
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
            <div className="mb-6">
              <h1 className="text-[32px] text-[#00943C] font-bold">Ordered Lab</h1>
              <p className="text-[12px] text-[#605D66]">
                View and manage all ordered laboratory test requests
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by patient name, test type, or status..."
                value={searchInputValue}
                onChange={(e) => handleSearchInput(e.target.value)}
                disabled={loading}
                className="input input-bordered w-full"
              />
              {searchInputValue && <p className="text-xs text-gray-500 mt-1">Searching for: {searchInputValue}</p>}
            </div>

            {/* Results List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#00943C] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Patient Name</th>
                      <th className="px-4 py-3 text-left">Patient Type</th>
                      <th className="px-4 py-3 text-left">Test Names</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvestigations.map((inv) => (
                      <InvestigationRow
                        key={inv._id || inv.id}
                        investigation={inv}
                        getPatientName={getPatientName}
                        existingLabResults={existingLabResults}
                        onViewDetails={(inv) => { setSelectedCard(inv); setShowModal2(true); }}
                        onAcceptFromDetails={handleAcceptFromDetails}
                        onProcess={handleProcess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded ${
                        page === currentPage
                          ? "bg-[#00943C] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {paginatedInvestigations.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">No ordered lab requests found.</p>
              </div>
            )}

            {/* Modals */}
            {showModal && (
              <AcceptTestRequestModal
                data={selectedCard}
                setShowModal={setShowModal}
                onAcceptSuccess={fetchInvestigations}
              />
            )}
            {showModal2 && (
              <TestRequestModal
                data={selectedCard}
                setShowModal2={setShowModal2}
                onAcceptFromDetails={handleAcceptFromDetails}
                existingLabResultId={selectedCard ? existingLabResults[selectedCard._id || selectedCard.id] : null}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// Separate component for table rows to handle async patient name fetching
const InvestigationRow = ({
  investigation,
  getPatientName,
  existingLabResults,
  onViewDetails,
  onAcceptFromDetails,
  onProcess
}) => {
  const [patientInfo, setPatientInfo] = useState({ name: "Loading...", type: "Patient" });

  useEffect(() => {
    const fetchName = async () => {
      const info = await getPatientName(investigation);
      setPatientInfo(info);
    };
    fetchName();
  }, [investigation, getPatientName]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getTestNames = (inv) => {
    if (!inv.tests || !Array.isArray(inv.tests)) return "No tests specified";
    return inv.tests.map(test => test.name || test.code || test).join(", ");
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "badge-success";
      case "in_progress":
      case "processing":
        return "badge-info";
      case "awaiting_lab":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  const hasExistingLabResult = existingLabResults[investigation._id || investigation.id];

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{patientInfo.name}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          patientInfo.type === "Dependant" ? "bg-blue-100 text-blue-800" :
          patientInfo.type === "OPD Patient" ? "bg-green-100 text-green-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {patientInfo.type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">{getTestNames(investigation)}</td>
      <td className="px-4 py-3">
        <span className={`badge ${getStatusBadge(investigation.status)} badge-sm`}>
          {investigation.status?.replace("_", " ") || "Unknown"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">{formatDate(investigation.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(investigation)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-all"
          >
            View Details
          </button>
          {hasExistingLabResult ? (
            <button
              onClick={() => window.open(`/dashboard/laboratory/results/${hasExistingLabResult}`, '_blank')}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-all"
            >
              View Result
            </button>
          ) : (
            <button
              onClick={() => onProcess(investigation)}
              className="px-3 py-1 bg-[#00943C] text-white text-sm rounded hover:bg-[#007a31] transition-all"
            >
              Process
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default OrderedLab;