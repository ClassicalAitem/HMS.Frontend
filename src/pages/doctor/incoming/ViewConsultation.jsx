import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getConsultationById } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { IoIosCloseCircleOutline } from "react-icons/io";

const ViewConsultation = () => {
  const { patientId, consultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // Fetch consultation details
        const res = await getConsultationById(consultationId);
        const data = res?.data ?? res;
        
        if (mounted) {
          setConsultation(data);
          
          // Fetch patient details if not available in consultation or to ensure latest
          const pid = patientId || data?.patientId;
          if (pid) {
            const pRes = await getPatientById(pid);
            const pData = pRes?.data ?? pRes;
            if (mounted) setPatient(pData);
          } else if (data?.patient) {
             // Fallback if patient object is embedded in consultation response
             setPatient(data.patient);
          }
        }
      } catch (error) {
        console.error("Error loading consultation details:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId, consultationId]);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Mapped Data
  const complaints = consultation?.complaint || [];
  const medicalHistory = consultation?.medicalHistory || [];
  const surgicalHistory = consultation?.surgicalHistory || [];
  const familyHistory = consultation?.familyHistory || [];
  const allergyHistory = consultation?.allergicHistory || []; // API uses allergicHistory
  const notes = consultation?.notes || "";

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar />
        </div>
        
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={toggleSidebar} />
          
          <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-64"></div>
                  <div className="flex flex-col gap-2">
                    <div className="skeleton h-4 w-32"></div>
                    <div className="skeleton h-4 w-24"></div>
                  </div>
                </div>
                <div className="skeleton h-12 w-12 rounded-full"></div>
              </div>
            </div>

            {/* Complaint Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <div className="skeleton h-6 w-32"></div>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="skeleton h-4 w-48"></div>
                    <div className="skeleton h-4 w-24"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical History Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4">
                <div className="skeleton h-6 w-48"></div>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-8 w-24 rounded-full"></div>
                ))}
              </div>
            </div>

            {/* Surgical History Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4">
                <div className="skeleton h-6 w-48"></div>
              </div>
              <div className="flex gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-8 w-32 rounded-full"></div>
                ))}
              </div>
            </div>

            {/* Family History Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4 border-b border-gray-100 pb-2">
                <div className="skeleton h-6 w-32"></div>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <div className="skeleton h-4 w-1/3"></div>
                    <div className="skeleton h-4 w-1/3"></div>
                    <div className="skeleton h-4 w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergy History Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4">
                <div className="skeleton h-6 w-48"></div>
              </div>
              <div className="flex gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-8 w-24 rounded-full"></div>
                ))}
              </div>
            </div>

            {/* Notes Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4">
                <div className="skeleton h-6 w-24"></div>
              </div>
              <div className="skeleton h-32 w-full rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />
        
        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-base-content">Consultation Details111</h1>
                </div>

                <div className="flex items-center gap-1 flex-col">
                  <p className="text-sm text-base-content/70">
                    {patient ? `${patientName || "Unknown"}` : ""}
                  </p>
                  <p className="text-sm text-base-content/70">
                    {patient ? `${patient?.hospitalId || patientId || "—"}` : ""}
                  </p>
                </div>
              </div>

              <div>
                <IoIosCloseCircleOutline 
                  className="btn btn-ghost text-error btn-md btn-circle" 
                  onClick={() => navigate(-1)} />
              </div>
            </div>
          </div>

          {/* Complaint Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Complaint</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="font-medium text-gray-500 py-4 pl-6">Complaint Name</th>
                    <th className="font-medium text-gray-500 py-4">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length > 0 ? (
                    complaints.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 pl-6 font-medium text-gray-800">{item.symptom}</td>
                        <td className="py-4 text-gray-600">{item.durationInDays ? `${item.durationInDays} days` : "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center py-8 text-gray-400">No complaints recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Medical History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Past Medical History</h3>
            </div>
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              {medicalHistory.length > 0 ? (
                medicalHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm hover:border-gray-300 transition-colors">
                    <span className="font-medium">{item.title} {item.value ? `(${item.value})` : ""}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No medical history recorded</span>
              )}
            </div>
          </div>

          {/* Past Surgical History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Past Surgical History</h3>
            </div>
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              {surgicalHistory.length > 0 ? (
                surgicalHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm hover:border-gray-300 transition-colors">
                    <span className="font-medium">{item.procedureName}</span>
                    <span className="text-xs text-gray-500">
                      {item.dateOfSurgery ? ` - ${new Date(item.dateOfSurgery).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No surgical history recorded</span>
              )}
            </div>
          </div>

          {/* Family History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Family History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="font-medium text-gray-500 py-4 pl-6 w-1/3">Relation</th>
                    <th className="font-medium text-gray-500 py-4 w-1/3">Condition</th>
                    <th className="font-medium text-gray-500 py-4 w-1/3">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {familyHistory.length > 0 ? (
                    familyHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 pl-6 font-medium text-gray-800">{item.relation}</td>
                        <td className="py-4 text-gray-600">{item.condition}</td>
                        <td className="py-4 text-gray-600">{item.value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-8 text-gray-400">No family history recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Allergy History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Past Allergy History</h3>
            </div>
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              {allergyHistory.length > 0 ? (
                allergyHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm hover:border-gray-300 transition-colors">
                    <span className="font-medium">{item.allergen}</span>
                    <span className="text-xs text-gray-500">
                      {item.reaction ? ` (${item.reaction})` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No allergy history recorded</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes</h3>
              <div className="p-4 rounded-md bg-gray-50 border border-gray-200 text-gray-700 min-h-[100px] whitespace-pre-wrap">
                {notes || "No additional notes."}
              </div>
            </div>
          </div>

          {/* Footer/Action */}
          <div className="flex justify-center pt-4 pb-12 gap-4">
            <button 
              className="btn btn-outline border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-12 h-12 text-lg font-normal normal-case rounded-md"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <button 
              className="btn bg-[#00943C] hover:bg-[#007a31] text-white px-8 h-12 text-lg font-normal normal-case rounded-md"
              onClick={() => {
                navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${consultationId}/prescription`, {
                   state: { from: fromIncoming ? "incoming" : "patients" } 
                });
              }}
            >
              Write Diagnosis/Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewConsultation;
