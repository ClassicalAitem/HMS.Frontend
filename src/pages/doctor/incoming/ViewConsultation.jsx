import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getConsultationById } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaUserMd, FaNotesMedical, FaSyringe, FaAllergies, FaHistory, FaUsers, FaCalendarAlt, FaFileMedical, FaPlus, FaPrescriptionBottleAlt, FaFlask } from "react-icons/fa";
import AddDiagnosisModal from "./modals/AddDiagnosisModal";
import OrderInvestigationModal from "./modals/OrderInvestigationModal";
import { getPrescriptionsForConsultation } from "@/services/api/prescriptionsAPI";
import { getInvestigationByConsultationId } from "@/services/api/investigationAPI";

const ViewConsultation = () => {
  const { patientId, consultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]); // Placeholder for future lab data
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getConsultationById(consultationId);
      const data = res?.data ?? res;
      setConsultation(data);
      
      const pid = patientId || data?.patientId;
      if (pid) {
        // Parallel fetching for patient data, prescriptions, and lab requests
        // We use Promise.allSettled to ensure one failure doesn't block others
        const promises = [
           getPatientById(pid),
           getPrescriptionsForConsultation(consultationId),
           getInvestigationByConsultationId(consultationId)
        ];

        const results = await Promise.allSettled(promises);

        // 1. Patient Details
        if (results[0].status === 'fulfilled') {
          const pRes = results[0].value;
          setPatient(pRes?.data ?? pRes);
        } else {
          console.error("Error loading patient:", results[0].reason);
        }

        // 2. Prescriptions
        if (results[1].status === 'fulfilled') {
           const presRes = results[1].value;
           const rawData = presRes?.data ?? presRes;
           let list = [];
           if (Array.isArray(rawData)) {
             list = rawData;
           } else if (rawData && typeof rawData === 'object') {
             if (Object.keys(rawData).length > 0) list = [rawData];
           }
           setPrescriptions(list);
        } else {
           console.error("Error loading prescriptions:", results[1].reason);
        }

        // 3. Lab Investigations
        if (results[2].status === 'fulfilled') {
           const labRes = results[2].value;
           const rawLabData = labRes?.data ?? labRes ?? [];
           const labList = Array.isArray(rawLabData) ? rawLabData : [];
           setLabRequests(labList);
        } else {
           console.error("Error loading lab investigations:", results[2].reason);
        }

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

  // Filter prescriptions related to this consultation (if there's a link) or just show recent ones
  // Since the API doesn't seem to link prescription to consultationId directly yet, 
  // we'll display the most recent prescription if it matches the consultation date closely, or just list recent ones.
  // For now, let's show all prescriptions for this patient as a reference.
  const recentPrescriptions = prescriptions.slice(0, 3);

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
      <OrderInvestigationModal 
        isOpen={isInvestigationModalOpen}
        onClose={() => setIsInvestigationModalOpen(false)}
        patientId={patientId}
        consultationId={consultationId}
        onOrderCreated={() => {
           // Optional: Reload data or show success notification
           console.log("Investigation ordered");
        }}
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Key Clinical Info */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Consultation Summary Section */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                  <div className="p-4 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaNotesMedical className="text-primary w-5 h-5" />
                      <h3 className="font-bold text-lg text-base-content">Consultation Overview</h3>
                    </div>
                    {(diagnosis === "Pending Assessment" || diagnosis === "Pending diagnosis") && (
                      <button 
                        className="btn btn-sm btn-outline btn-success gap-2"
                        onClick={() => setIsDiagnosisModalOpen(true)}
                      >
                        <FaPlus className="w-3 h-3" /> Add Diagnosis
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6 grid gap-6">
                    {/* Reason & Diagnosis Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Visit Reason</h4>
                        <div className="p-3 bg-base-200/50 rounded-lg">
                          <p className="font-medium text-base-content">{visitReason}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Diagnosis</h4>
                        <div className={`p-3 rounded-lg border ${diagnosis.includes("Pending") ? "bg-warning/10 border-warning/20 text-warning-content" : "bg-success/10 border-success/20"}`}>
                          <p className="font-medium">{diagnosis}</p>
                        </div>
                      </div>
                    </div>

                    {/* Complaints */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Patient Complaints</h4>
                      {complaints.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {complaints.map((item, idx) => (
                            <div key={idx} className="badge badge-lg badge-outline gap-2 p-3 bg-base-100">
                              <span className="font-semibold">{item.symptom}</span>
                              {item.durationInDays && (
                                <span className="text-xs opacity-70 border-l pl-2 border-base-content/20">
                                  {item.durationInDays} days
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-base-content/50 italic">No complaints recorded</p>
                      )}
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Clinical Notes</h4>
                      <div className="p-4 bg-base-200/30 rounded-xl border border-base-200 min-h-[100px]">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-base-content/80">
                          {notes || "No additional clinical notes."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Plan Section */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                  <div className="p-4 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaPrescriptionBottleAlt className="text-success w-5 h-5" />
                      <h3 className="font-bold text-lg text-base-content">Treatment Plan & Orders</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-2"
                        onClick={() => setIsInvestigationModalOpen(true)}
                      >
                        <FaFlask /> Order Labs
                      </button>
                      <button 
                        className="btn btn-sm btn-primary gap-2"
                        onClick={() => {
                          navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${consultationId}/prescription`, {
                             state: { from: fromIncoming ? "incoming" : "patients" } 
                          });
                        }}
                      >
                        <FaPrescriptionBottleAlt /> Prescribe
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
                  
                  {/* Lab Requests (Placeholder) */}
                    <div>
                      <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-info"></span>
                        Lab Investigations
                      </h4>
                      {labRequests.length > 0 ? (
                        <div className="grid gap-3">
                          {labRequests.map((lab, idx) => (
                            <div key={idx} className="border border-base-200 rounded-lg p-3 hover:shadow-sm transition-shadow bg-base-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`badge ${lab.status === 'in_progress' ? 'badge-info' : lab.status === 'completed' ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                                    {lab.status.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs text-base-content/50">
                                    Requested {new Date(lab.createdAt).toLocaleDateString()}
                                  </span>
                                  {lab.priority === 'urgent' && <span className="badge badge-error badge-outline badge-xs">Urgent</span>}
                                </div>
                              </div>
                              <div className="space-y-1">
                                {lab.tests?.map((test, tIdx) => (
                                  <div key={tIdx} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-base-content">{test.name}</span>
                                    {test.code && <span className="text-xs text-base-content/50">({test.code})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                          <p className="text-sm text-base-content/50">No lab investigations ordered yet</p>
                        </div>
                      )}
                    </div>

                    <div className="divider my-0"></div>


                    {/* Prescriptions */}
                    <div>
                      <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        Active Prescriptions
                      </h4>
                      {recentPrescriptions.length > 0 ? (
                        <div className="grid gap-3">
                          {recentPrescriptions.map((pres, idx) => (
                            <div key={idx} className="border border-base-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`badge ${pres.status === 'pending' ? 'badge-warning' : 'badge-success'} badge-sm`}>
                                    {pres.status}
                                  </span>
                                  <span className="text-xs text-base-content/50">
                                    Ordered {new Date(pres.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {pres.medications?.map((med, mIdx) => (
                                  <div key={mIdx} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-base-content">{med.drugName}</span>
                                    <span className="text-base-content/40">•</span>
                                    <span className="text-base-content/70">{med.dosage}</span>
                                    <span className="text-base-content/40">•</span>
                                    <span className="text-base-content/70">{med.frequency}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                          <p className="text-sm text-base-content/50">No prescriptions ordered yet</p>
                        </div>
                      )}
                    </div>

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
                          <span className="font-medium">{typeof item === 'object' ? item.title || item.name || JSON.stringify(item) : item}</span>
                          <span className="text-base-content/60 bg-base-200 px-2 py-0.5 rounded text-xs">
                            {idx + 1}
                          </span>
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
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{typeof item === 'object' ? item.procedure || item.title || item.name || JSON.stringify(item) : item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">None recorded</p>
                  )}
                </div>
              </div>

              {/* Allergies - Highlighted */}
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
                          <span className="font-medium">{typeof item === 'object' ? item.allergen || item.title || item.name || JSON.stringify(item) : item}</span>
                          <span className="text-xs opacity-75">(reaction)</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">None recorded</p>
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
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-base-content/70">{item.value}</span>
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
                          <span className="font-medium">{typeof item === 'object' ? item.habit || item.title || item.name || JSON.stringify(item) : item}</span>
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
          
          {/* Bottom Spacing */}
          <div className="h-12"></div>

        </div>
      </div>
    </div>
  );
};

export default ViewConsultation;
