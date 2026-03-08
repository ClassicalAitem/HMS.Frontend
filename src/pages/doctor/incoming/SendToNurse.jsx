import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import toast from "react-hot-toast";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { useAppSelector } from "@/store/hooks";

const SendToNurse = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patient, setPatient] = useState(snapshot || null);
  const { user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tasks, setTasks] = useState([
    { id: 1, name: "Record Vitals", description: "BP, Temperature, Pulse, O2 Saturation, Respiratory Rate" },
  ]);
  const [newTask, setNewTask] = useState({ name: "", description: "" });
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [monitoringNotes, setMonitoringNotes] = useState("");

  const taskOptions = [
    { name: "Record Vitals", description: "BP, Temperature, Pulse, O2 Saturation, Respiratory Rate" },
    { name: "Administer Injection", description: "Follow prescription and dosage instructions" },
    { name: "Blood Sampling", description: "Collect blood samples for lab testing" },
    { name: "Wound Care", description: "Dressing change and wound assessment" },
    { name: "Patient Monitoring", description: "Continuous monitoring and observation" },
    { name: "IV Setup", description: "Intravenous line insertion and management" },
    { name: "Catheterization", description: "Urinary catheterization if required" },
    { name: "Physical Examination", description: "Basic physical examination and assessment" },
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (snapshot) {
          setPatient(snapshot);
          return;
        }
        if (!patientId) return;
        const res = await getPatientById(patientId);
        const data = res?.data ?? res;
        if (mounted) setPatient(data);
      } catch (err) {
        console.error("SendToNurse: patient fetch error", err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId, snapshot]);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const addTask = () => {
    if (!newTask.name) return;
    setTasks((list) => [...list, { id: Date.now(), ...newTask }]);
    setNewTask({ name: "", description: "" });
  };
  const removeTask = (id) => setTasks((list) => list.filter((t) => t.id !== id));
  const getStatusForTask = (taskName) => {
    if (!taskName) return ['awaiting_injection'];
    const name = taskName.toLowerCase();
    if (name.includes('vital')) return ['awaiting_vitals'];
    if (name.includes('injection') || name.includes('iv')) return ['awaiting_injection'];
    if (name.includes('blood') || name.includes('sampling')) return ['awaiting_sampling'];
    if (name.includes('wound') || name.includes('catheter') || name.includes('examination')) return ['awaiting_review'];
    if (name.includes('monitor')) return ['under_observation'];
    // fallback
    return ['awaiting_injection'];
  };

  const handleSendToNurse = async () => {
    if (!patientId) return;
    if (tasks.length === 0) {
      toast.error('Add at least one task');
      return;
    }
    setIsSubmitting(true);
    try {
      // Use primary task to determine patient status
      const primaryTask = tasks[0];
      const statusToSet = getStatusForTask(primaryTask?.name);
      const statusPromise = updatePatientStatus(patientId, statusToSet);
      await toast.promise(statusPromise, {
        loading: `Sending to nurse (${primaryTask?.name || 'task'})...`,
        success: `Patient assigned to nurse for ${primaryTask?.name || 'task'}`,
        error: (err) => err?.response?.data?.message || `Failed to send to nurse for ${primaryTask?.name || 'task'}`,
      });
      navigate('/dashboard/doctor/incoming');
    } catch (err) {
      console.error("SendToNurse: error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar />
      </div>
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <PatientHeaderActions
            title="Send To Nurse"
            subtitle={patient ? `${patientName || "Unknown"} • ${patient?.hospitalId || patientId || "—"}` : ""}
            fromIncoming={fromIncoming}
            onBack={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}
          />

          <div className="flex gap-4 items-center mb-4 justify-between">
            <div className="flex gap-4 items-center">
              <button className="btn btn-success btn-sm">Send to Nurse</button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/doctor/send-to-cashier/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}>Send to Cashier</button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/doctor/send-to-pharmacy/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}>Send to Pharmacy</button>
            </div>

            <div className="hidden">
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}>Back</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-4 text-lg font-medium text-base-content">Nursing Tasks</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-base-300 p-3 bg-base-200/40 text-sm">
                      {tasks.length === 0 ? (
                        <div className="text-base-content/70">No tasks added</div>
                      ) : (
                        <ul className="list-disc list-inside space-y-2">
                          {tasks.map((t) => (
                            <li key={t.id} className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{t.name}</span>
                                {t.description && (<span className="ml-2 text-base-content/70 text-xs block">{t.description}</span>)}
                              </div>
                              <button className="btn btn-ghost btn-xs" onClick={() => removeTask(t.id)}>Remove</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block text-base-content">Task</label>
                        <select
                          className="select select-bordered w-full"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const selected = taskOptions.find(opt => opt.name === e.target.value);
                              if (selected) setNewTask(selected);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Select a task...</option>
                          {taskOptions.map((opt) => (
                            <option key={opt.name} value={opt.name}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block text-base-content">Custom Description</label>
                        <input 
                          className="input input-bordered w-full" 
                          placeholder="Additional details..." 
                          value={newTask.description} 
                          onChange={(e) => setNewTask((nt) => ({ ...nt, description: e.target.value }))} 
                        />
                      </div>
                    </div>
                    <div>
                      <button className="btn btn-success btn-sm" onClick={addTask}>+ Add Task</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="shadow-xl card bg-base-100">
                  <div className="p-4 card-body">
                    <h3 className="mb-2 text-lg font-medium text-base-content">Special Instructions</h3>
                    <textarea className="textarea textarea-bordered w-full" rows={6} placeholder="Enter any special instructions or precautions..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
                  </div>
                </div>
                <div className="shadow-xl card bg-base-100">
                  <div className="p-4 card-body">
                    <h3 className="mb-2 text-lg font-medium text-base-content">Monitoring Notes</h3>
                    <textarea className="textarea textarea-bordered w-full" rows={6} placeholder="Enter any specific points to monitor or watch for..." value={monitoringNotes} onChange={(e) => setMonitoringNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-3 text-lg font-medium text-base-content">Allergy & Sensitivity Check</h3>
                  <div className="text-sm text-base-content/70">Please verify patient allergies and sensitivities before proceeding with any procedures or injections</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-3 text-lg font-medium text-base-content">Assignment Information</h3>
                  <div className="space-y-2 text-sm text-base-content/70">
                    <div className="flex justify-between"><span>Assignment Date</span><span>{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>Assignment Time</span><span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                    <div className="flex justify-between"><span>Assigned By</span><span>Dr. {user ? `${user.firstName} ${user.lastName}` : "—"}</span></div>
                    <div className="flex justify-between"><span>Total Tasks</span><span>{tasks.length}</span></div>
                  </div>
                </div>
              </div>
            
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <button 
                    className="btn btn-success w-full" 
                    disabled={isSubmitting || tasks.length === 0} 
                    onClick={handleSendToNurse}
                  >
                    {isSubmitting ? "Sending..." : "Send to Nurse"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendToNurse;
