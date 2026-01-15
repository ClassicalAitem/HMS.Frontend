import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getConsultationById } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaUserMd, FaNotesMedical, FaSyringe, FaAllergies, FaHistory, FaUsers, FaCalendarAlt, FaFileMedical, FaPlus } from "react-icons/fa";
import AddDiagnosisModal from "./modals/AddDiagnosisModal";

const ViewConsultation = () => {
  const { patientId, consultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getConsultationById(consultationId);
      const data = res?.data ?? res;
      setConsultation(data);
      
      const pid = patientId || data?.patientId;
      if (pid) {
        const pRes = await getPatientById(pid);
        const pData = pRes?.data ?? pRes;
        setPatient(pData);
      } else if (data?.patient) {
        setPatient(data.patient);
      }
    } catch (error) {
      console.error("Error loading consultation details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
  const socialHistory = consultation?.socialHistory || [];
  const allergyHistory = consultation?.allergicHistory || [];
  const notes = consultation?.notes || "";
  const visitReason = consultation?.visitReason || "Not specified";
  const diagnosis = consultation?.diagnosis || "Pending diagnosis";
  const doctorName = consultation?.doctor ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}` : "Unknown Doctor";
  const consultationDate = consultation?.createdAt ? new Date(consultation.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";

  // Helper for Skeleton Loading
  const SkeletonCard = ({ title, icon }) => (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-4 text-base-content/60">
          {icon}
          <div className="skeleton h-6 w-32"></div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-4 w-1/2"></div>
        </div>
      </div>
    </div>
  );

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
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <div className="skeleton h-8 w-64"></div>
                <div className="skeleton h-4 w-48"></div>
              </div>
              <div className="skeleton h-10 w-10 rounded-full"></div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard icon={<FaUserMd />} />
              <SkeletonCard icon={<FaNotesMedical />} />
              <SkeletonCard icon={<FaFileMedical />} />
              <SkeletonCard icon={<FaHistory />} />
              <SkeletonCard icon={<FaSyringe />} />
              <SkeletonCard icon={<FaUsers />} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200/50">
      <AddDiagnosisModal 
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        consultationId={consultationId}
        onDiagnosisAdded={loadData}
      />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-xl shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary hidden sm:flex">
                <FaUserMd className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">Consultation Details</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70 mt-1">
                  <span className="flex items-center gap-1"><FaUserMd className="w-3 h-3" /> Dr. {doctorName}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"><FaCalendarAlt className="w-3 h-3" /> {consultationDate}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-medium text-primary">{patientName}</span>
                </div>
              </div>
            </div>
            <button 
              className="btn btn-ghost btn-circle text-base-content/70 hover:bg-base-200" 
              onClick={() => navigate(-1)}
            >
              <IoIosCloseCircleOutline className="w-8 h-8" />
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Key Clinical Info */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Visit Reason & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <h3 className="card-title text-base text-base-content/70 mb-2 uppercase tracking-wide">Visit Reason</h3>
                    <p className="text-lg font-medium text-base-content">{visitReason}</p>
                  </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="card-title text-base text-base-content/70 uppercase tracking-wide">Diagnosis</h3>
                      {(diagnosis === "Pending Assessment" || diagnosis === "Pending diagnosis") && (
                        <button 
                          className="btn btn-xs btn-outline btn-success gap-1"
                          onClick={() => setIsDiagnosisModalOpen(true)}
                        >
                          <FaPlus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                    <p className={`text-lg font-medium ${diagnosis === "Pending Assessment" || diagnosis === "Pending diagnosis" ? "text-warning italic" : "text-primary"}`}>
                      {diagnosis}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complaints */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                  <div className="p-6 border-b border-base-200 flex items-center gap-2">
                    <FaNotesMedical className="text-error w-5 h-5" />
                    <h3 className="text-lg font-bold text-base-content">Complaints</h3>
                  </div>
                  <div className="p-6">
                    {complaints.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {complaints.map((item, idx) => (
                          <div key={idx} className="badge badge-lg badge-outline gap-2 p-4">
                            <span className="font-semibold">{item.symptom}</span>
                            <span className="text-xs opacity-70 border-l pl-2 border-base-content/20">
                              {item.durationInDays ? `${item.durationInDays} days` : "Duration N/A"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base-content/50 italic">No complaints recorded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                  <div className="p-6 border-b border-base-200 flex items-center gap-2">
                    <FaFileMedical className="text-warning w-5 h-5" />
                    <h3 className="text-lg font-bold text-base-content">Clinical Notes</h3>
                  </div>
                  <div className="p-6 bg-base-200/30 min-h-[150px]">
                    <p className="whitespace-pre-wrap text-base-content/80 leading-relaxed">
                      {notes || "No additional clinical notes."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - History & Background */}
            <div className="space-y-6">
              
              {/* Medical History */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center gap-2 mb-4 text-primary">
                    <FaHistory />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Medical History</h3>
                  </div>
                  {medicalHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {medicalHistory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-base-content/60 bg-base-200 px-2 py-0.5 rounded text-xs">{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">None recorded</p>
                  )}
                </div>
              </div>

              {/* Surgical History */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center gap-2 mb-4 text-secondary">
                    <FaSyringe />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Surgical History</h3>
                  </div>
                  {surgicalHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {surgicalHistory.map((item, idx) => (
                        <li key={idx} className="text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <div className="font-medium">{item.procedureName}</div>
                          {item.dateOfSurgery && (
                            <div className="text-xs text-base-content/60 mt-0.5">
                              {new Date(item.dateOfSurgery).toLocaleDateString()}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">None recorded</p>
                  )}
                </div>
              </div>

              {/* Allergies */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center gap-2 mb-4 text-error">
                    <FaAllergies />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Allergies</h3>
                  </div>
                  {allergyHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergyHistory.map((item, idx) => (
                        <div key={idx} className="badge badge-error badge-outline gap-1 h-auto py-1">
                          <span className="font-medium">{item.allergen}</span>
                          {item.reaction && <span className="text-xs opacity-75">({item.reaction})</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">No known allergies</p>
                  )}
                </div>
              </div>

              {/* Family History */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center gap-2 mb-4 text-info">
                    <FaUsers />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Family History</h3>
                  </div>
                  {familyHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {familyHistory.map((item, idx) => (
                        <li key={idx} className="text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.relation}</span>
                            <span className="text-xs bg-base-200 px-2 py-0.5 rounded">{item.value}</span>
                          </div>
                          <div className="text-xs text-base-content/60 mt-0.5">{item.condition}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">None recorded</p>
                  )}
                </div>
              </div>

              {/* Social History */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center gap-2 mb-4 text-success">
                    <FaUsers />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Social History</h3>
                  </div>
                  {socialHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {socialHistory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{item.habit || item.title}</span>
                          <span className="text-base-content/60 bg-base-200 px-2 py-0.5 rounded text-xs">
                            {item.frequencyPerDay ? `${item.frequencyPerDay}/day` : (item.value || "")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">None recorded</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-6 gap-4">
            <button 
              className="btn btn-outline btn-primary px-8 gap-2 shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                // Future functionality: Navigate to lab test order page or open modal
                console.log("Order further tests");
              }}
            >
              <FaFileMedical />
              Further Tests
            </button>
            <button 
              className="btn btn-primary px-8 gap-2 shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${consultationId}/prescription`, {
                   state: { from: fromIncoming ? "incoming" : "patients" } 
                });
              }}
            >
              <FaFileMedical />
              Write Prescription
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewConsultation;
