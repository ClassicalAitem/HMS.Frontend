import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import { usersAPI } from "@/services/api/usersAPI";
import toast from "react-hot-toast";

const LabResultsHistory = () => {
  const navigate = useNavigate();
  const [allLabResults, setAllLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  const [patientCache, setPatientCache] = useState({});
  const [technicianNameById, setTechnicianNameById] = useState({});

  const fetchLabResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLabResults();
      const results = Array.isArray(response)
        ? response
        : response?.data || response?.data?.data || response?.results || [];
      setAllLabResults(results);
      setError(null);
    } catch (err) {
      console.error("Error fetching lab results:", err);
      setError("Failed to load lab results history");
      toast.error("Failed to load lab results history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabResults();
  }, [fetchLabResults]);

  // Helper: Normalize API response
  const normalizeUserResponse = (response) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  // Helper: Get technician display name
  const getTechnicianDisplayName = (technician) => {
    if (!technician) return '';
    if (typeof technician === 'string') return technician;
    if (technician.fullName) return technician.fullName;
    if (technician.firstName || technician.lastName) {
      return `${technician.firstName || ''} ${technician.lastName || ''}`.trim();
    }
    return '';
  };

  // Helper: Get technician ID from result
  const getTechnicianId = (result) => {
    if (!result) return null;
    if (result.labTechnicianId) return result.labTechnicianId;
    if (result.technician?.id) return result.technician.id;
    if (result.technician?._id) return result.technician._id;
    return null;
  };

  // Helper: Get technician name from result
  const getTechnicianName = (result) => {
    if (!result) return 'Unknown Technician';
    if (result.labTechnicianName) return result.labTechnicianName;
    if (result.technician && typeof result.technician === 'object') {
      return getTechnicianDisplayName(result.technician) || 'Unknown Technician';
    }
    const techId = getTechnicianId(result);
    if (techId && technicianNameById[techId]) {
      return technicianNameById[techId];
    }
    return 'Unknown Technician';
  };

  // Load technician names
  const loadTechnicianNames = useCallback(async () => {
    if (!Array.isArray(allLabResults) || allLabResults.length === 0) return;

    const techIds = new Set();
    allLabResults.forEach((result) => {
      const techId = getTechnicianId(result);
      if (techId && !technicianNameById[techId]) {
        techIds.add(techId);
      }
    });

    if (techIds.size === 0) return;

    try {
      const responses = await Promise.allSettled(
        Array.from(techIds).map((id) => usersAPI.getUserById(id))
      );

      const newTechNames = {};
      responses.forEach((result, index) => {
        const techId = Array.from(techIds)[index];
        if (result.status === 'fulfilled') {
          const userData = normalizeUserResponse(result.value);
          newTechNames[techId] = getTechnicianDisplayName(userData) || 'Unknown Technician';
        } else {
          newTechNames[techId] = 'Unknown Technician';
        }
      });

      setTechnicianNameById((prev) => ({ ...prev, ...newTechNames }));
    } catch (e) {
      console.error('Error loading technician names:', e);
    }
  }, [allLabResults, technicianNameById]);

  // Load technician names when results change
  useEffect(() => {
    loadTechnicianNames();
  }, [loadTechnicianNames]);

const filteredLabResults = useMemo(() => {
  const query = search.trim().toLowerCase();
  const baseList = Array.isArray(allLabResults) ? allLabResults : [];

  return !query
    ? baseList
    : baseList.filter((inv) => {
        const cacheKey =
          inv.dependantId ||
          inv.opdPatientId ||
          inv.patientId ||
          inv._id ||
          inv.id;

        const cached = patientCache[cacheKey];

const patientName =
  (typeof cached === "string" ? cached.toLowerCase() : "") ||
  `${inv.patient?.firstName || ""} ${inv.patient?.lastName || ""}`.toLowerCase();

        return patientName.includes(query);
      });
}, [allLabResults, search, patientCache]);


useEffect(() => {
  const preloadNames = async () => {
    if (!allLabResults.length) return;

    await Promise.all(
      allLabResults.map((result) => getPatientName(result))
    );
  };

  preloadNames();
}, [allLabResults]);

  const totalResults = filteredLabResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));
  const paginatedLabResults = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredLabResults.slice(start, start + resultsPerPage);
  }, [currentPage, filteredLabResults]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const getPatientType = (result) => {
    if (result.dependantId) return "Dependant";
    if (result.opdPatientId) return "OPD Patient";
    return "Patient";
  };

  const getPatientName = async (result) => {
    const cacheKey = result.dependantId || result.opdPatientId || result.patientId || result._id || result.id || "unknown";
    if (patientCache[cacheKey]) return patientCache[cacheKey];

    try {
      let name = "Unknown";
      if (result.dependantId) {
        let dependant = result.dependant;
        if (!dependant) {
          const res = await getDependantById(result.dependantId);
          dependant = res?.data?.data?.dependant || res?.data?.dependant || res?.data || res;
        }
        if (dependant) {
          name = `${dependant.firstName || ""} ${dependant.lastName || ""}`.trim() || dependant.fullName || dependant.name || "Unknown Dependant";
        }
      } else if (result.opdPatientId) {
        const res = await getOpdPatientById(result.opdPatientId);
        const patient = res?.data || res || result.opdPatient;
        if (patient) {
          name = patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || patient.name || "Unknown OPD";
        }
      } else if (result.patientId) {
        const res = await getPatientById(result.patientId);
        const patient = res?.data || res || result.patient;
        if (patient) {
          name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || patient.fullName || patient.name || "Unknown Patient";
        }
      } else if (result.patient) {
        name = `${result.patient.firstName || ""} ${result.patient.lastName || ""}`.trim() || result.patient.fullName || result.patient.name || name;
      }

      setPatientCache((prev) => ({ ...prev, [cacheKey]: name }));
      return name;
    } catch (err) {
      console.error("Error fetching patient name:", err);
      return "Unknown";
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && allLabResults.length === 0) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading lab results history...</p>
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
              <h1 className="text-[32px] text-[#00943C] font-bold">Lab Results History</h1>
              <p className="text-[12px] text-[#605D66]">
                View and search all laboratory test results
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by patient name, ID, test type, or status..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
                className="input input-bordered w-full"
              />
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#00943C] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Patient Name</th>
                    <th className="px-4 py-3 text-left">Patient Type</th>
                    <th className="px-4 py-3 text-left">Technician</th>
                     <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLabResults.map((result) => (
                    <LabResultRow
                      key={result._id || result.id}
                      result={result}
                      getPatientName={getPatientName}
                      getPatientType={getPatientType}
                      getTechnicianName={getTechnicianName}
                      navigate={navigate}
                    />
                  ))}
                </tbody>
              </table>
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

            {paginatedLabResults.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-600">No lab results found.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// Separate component for table rows to handle async patient name fetching
const LabResultRow = ({ result, getPatientName, getPatientType, getTechnicianName, navigate }) => {
  const [patientName, setPatientName] = useState("Loading...");

  useEffect(() => {
    const fetchName = async () => {
      const name = await getPatientName(result);
      setPatientName(name);
    };
    fetchName();
  }, [result, getPatientName]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };



  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3">{formatDate(result.createdAt)}</td>
      <td className="px-4 py-3">{patientName}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          getPatientType(result) === "Dependant" ? "bg-blue-100 text-blue-800" :
          getPatientType(result) === "OPD Patient" ? "bg-green-100 text-green-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {getPatientType(result)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">{getTechnicianName(result)}</td>
    
      <td className="px-4 py-3">
        <button
          onClick={() => navigate(`/dashboard/laboratory/results/${result._id || result.id}`)}
          className="px-3 py-1 bg-[#00943C] text-white text-sm rounded hover:bg-[#007a31] transition-all"
        >
          View
        </button>
      </td>
    </tr>
  );
};

export default LabResultsHistory;