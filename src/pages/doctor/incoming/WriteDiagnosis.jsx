import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getConsultationById, updateConsultation } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { IoCloseCircleOutline } from "react-icons/io5";
import toast from "react-hot-toast";

// Modals
import AddDiagnosisItemModal from "./modals/AddDiagnosisItemModal";
import AddPrescriptionModal from "./modals/AddPrescriptionModal";
import AddLabTestModal from "./modals/AddLabTestModal";

const WriteDiagnosis = () => {
  const { patientId, consultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [notes, setNotes] = useState("");
  const [sendTo, setSendTo] = useState({ cashier: true, pharmacy: true });

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'diagnosis', 'prescription', 'lab'

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // Fetch consultation details to context
        const res = await getConsultationById(consultationId);
        const data = res?.data ?? res;
        
        if (mounted) {
          setConsultation(data);
          
          const pid = patientId || data?.patientId;
          if (pid) {
            const pRes = await getPatientById(pid);
            const pData = pRes?.data ?? pRes;
            if (mounted) setPatient(pData);
          } else if (data?.patient) {
             setPatient(data.patient);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
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

  // Handlers
  const handleAddDiagnosis = (item) => setDiagnoses([...diagnoses, item]);
  const handleAddPrescription = (item) => setPrescriptions([...prescriptions, item]);
  const handleAddLabTest = (item) => setLabTests([...labTests, item]);

  const removeDiagnosis = (idx) => setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  const removePrescription = (idx) => setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  const removeLabTest = (idx) => setLabTests(labTests.filter((_, i) => i !== idx));

  const handleSave = () => {
    // Placeholder save logic
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Diagnosis and Prescription Saved!");
      // Navigate back or to success page
      // navigate(`/dashboard/doctor/medical-history/${patientId}`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50 justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
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
                  <h1 className="text-2xl font-semibold text-base-content">Add New Consultation</h1>
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

          {/* Diagnosis Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Diagnosis</h3>
              <button 
                className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" 
                onClick={() => setActiveModal('diagnosis')}
              >
                <span className="text-lg">+</span> Add Diagnosis
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="font-medium text-gray-500 py-4 pl-6 w-1/2">Diagnosis Name</th>
                    <th className="font-medium text-gray-500 py-4 w-1/2">Severity</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses.length > 0 ? (
                    diagnoses.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 pl-6 font-medium text-gray-800">{item.name}</td>
                        <td className="py-4 text-gray-600">{item.severity}</td>
                        <td className="py-4 pr-6 text-right">
                          <button onClick={() => removeDiagnosis(idx)} className="btn btn-ghost btn-xs text-error hover:bg-error/10">
                            <span className="text-lg font-bold">−</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-8 text-gray-400">No diagnosis added</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommended Prescription */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Recommended Prescription</h3>
              <button 
                className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" 
                onClick={() => setActiveModal('prescription')}
              >
                <span className="text-lg">+</span> Add Prescription
              </button>
            </div>
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              {prescriptions.map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm hover:border-gray-300 transition-colors">
                  <span className="font-medium">{item.name}</span>
                  <button onClick={() => removePrescription(idx)} className="text-error hover:text-red-700 ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                    <IoCloseCircleOutline className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {prescriptions.length === 0 && <span className="text-sm text-gray-400 italic">No prescriptions added</span>}
            </div>
          </div>

          {/* Recommended Lab Test */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Recommended Lab Test</h3>
              <button 
                className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" 
                onClick={() => setActiveModal('lab')}
              >
                <span className="text-lg">+</span> Add Lab Test
              </button>
            </div>
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              {labTests.map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm hover:border-gray-300 transition-colors">
                  <span className="font-medium">{item.name}</span>
                  <button onClick={() => removeLabTest(idx)} className="text-error hover:text-red-700 ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                    <IoCloseCircleOutline className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {labTests.length === 0 && <span className="text-sm text-gray-400 italic">No lab tests added</span>}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes</h3>
              <textarea 
                className="textarea textarea-bordered w-full text-base min-h-[150px] focus:outline-none focus:border-[#00943C] resize-y rounded-md" 
                placeholder="Enter Additional Notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>
          </div>

          {/* Send To Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <button 
                  className="text-left group w-full"
                  onClick={() => setSendTo(prev => ({ ...prev, cashier: !prev.cashier }))}
                >
                  <h4 className={`text-lg font-medium mb-1 underline decoration-1 underline-offset-4 ${sendTo.cashier ? 'text-[#00943C]' : 'text-gray-400'}`}>
                    Send to cashier
                  </h4>
                  <p className="text-sm text-gray-500">(send to cashier for payments)</p>
                </button>
              </div>
              
              <div className="flex-1">
                <button 
                  className="text-left group w-full"
                  onClick={() => setSendTo(prev => ({ ...prev, pharmacy: !prev.pharmacy }))}
                >
                  <h4 className={`text-lg font-medium mb-1 underline decoration-1 underline-offset-4 ${sendTo.pharmacy ? 'text-[#00943C]' : 'text-gray-400'}`}>
                    Send to Pharmacy
                  </h4>
                  <p className="text-sm text-gray-500">(send to Pharmacy for Prescription)</p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer/Action */}
          <div className="flex justify-between max-w-2xl mx-auto w-full pt-4 pb-12 gap-4">
            <button 
              className="btn bg-[#00943C] hover:bg-[#007a31] text-white px-12 h-12 text-lg font-normal normal-case rounded-md w-full sm:w-auto"
              onClick={() => navigate(-1)}
            >
              Previous
            </button>
            <button 
              className={`btn bg-[#00943C] hover:bg-[#007a31] text-white px-12 h-12 text-lg font-normal normal-case rounded-md w-full sm:w-auto ${saving ? "loading" : ""}`}
              onClick={handleSave}
              disabled={saving}
            >
              Save Now
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDiagnosisItemModal 
        isOpen={activeModal === 'diagnosis'}
        onClose={() => setActiveModal(null)}
        onAdd={handleAddDiagnosis}
      />
      <AddPrescriptionModal 
        isOpen={activeModal === 'prescription'}
        onClose={() => setActiveModal(null)}
        onAdd={handleAddPrescription}
      />
      <AddLabTestModal 
        isOpen={activeModal === 'lab'}
        onClose={() => setActiveModal(null)}
        onAdd={handleAddLabTest}
      />
    </div>
  );
};

export default WriteDiagnosis;