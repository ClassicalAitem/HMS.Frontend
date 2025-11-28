import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import { getPatientById } from "@/services/api/patientsAPI";
import { PharmacyActionModal } from "@/components/modals";

const SendToPharmacy = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(!!patientId && !snapshot);
  const [patient, setPatient] = useState(snapshot || null);
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);

  const [meds, setMeds] = useState([
    { id: 1, name: "Paracetamol", dosage: "500mg", frequency: "2x daily", duration: "3 days", instructions: "After meals" },
  ]);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });
  const [diagnosis, setDiagnosis] = useState("");
  const [pharmacyNotes, setPharmacyNotes] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (snapshot) {
          setPatient(snapshot);
          setLoadingPatient(false);
          return;
        }
        if (!patientId) return;
        setLoadingPatient(true);
        const res = await getPatientById(patientId);
        const data = res?.data ?? res;
        if (mounted) setPatient(data);
      } finally {
        if (mounted) setLoadingPatient(false);
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

  const addMedication = () => {
    if (!newMed.name) return;
    setMeds((list) => ([...list, { id: Date.now(), ...newMed }]));
    setNewMed({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });
  };
  const removeMedication = (id) => setMeds((list) => list.filter((m) => m.id !== id));

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
            title="Send To Pharmacy"
            subtitle={patient ? `${patientName || "Unknown"} • ${patient?.hospitalId || patientId || "—"}` : ""}
            fromIncoming={fromIncoming}
            onBack={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}
          />

          <div className="flex gap-4 items-center mb-4 justify-between">
            <div className="flex gap-4 items-center">
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/doctor/send-to-cashier/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}>Send to Cashier</button>
              <button className="btn btn-success btn-sm">Send to Pharmacy</button>
            </div>
            <div className="hidden">
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}>Back</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-4 text-lg font-medium text-base-content">Prescriptions</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-base-300 p-3 bg-base-200/40 text-sm">
                      {meds.length === 0 ? (
                        <div className="text-base-content/70">No medications added</div>
                      ) : (
                        <ul className="list-disc list-inside">
                          {meds.map((m) => (
                            <li key={m.id} className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{m.name}</span>
                                <span className="ml-2 text-base-content/70">{[m.dosage, m.frequency, m.duration].filter(Boolean).join(' • ')}</span>
                                {m.instructions && (<span className="ml-2 text-base-content/60">{m.instructions}</span>)}
                              </div>
                              <button className="btn btn-ghost btn-xs" onClick={() => removeMedication(m.id)}>Remove</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input className="input input-bordered w-full" placeholder="Medication name" value={newMed.name} onChange={(e) => setNewMed((nm) => ({ ...nm, name: e.target.value }))} />
                      <input className="input input-bordered w-full" placeholder="Dosage (e.g., 500mg)" value={newMed.dosage} onChange={(e) => setNewMed((nm) => ({ ...nm, dosage: e.target.value }))} />
                      <input className="input input-bordered w-full" placeholder="Frequency (e.g., 2x daily)" value={newMed.frequency} onChange={(e) => setNewMed((nm) => ({ ...nm, frequency: e.target.value }))} />
                      <input className="input input-bordered w-full" placeholder="Duration (e.g., 3 days)" value={newMed.duration} onChange={(e) => setNewMed((nm) => ({ ...nm, duration: e.target.value }))} />
                      <div className="sm:col-span-2">
                        <input className="input input-bordered w-full" placeholder="Special instructions (optional)" value={newMed.instructions} onChange={(e) => setNewMed((nm) => ({ ...nm, instructions: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <button className="btn btn-success btn-sm" onClick={addMedication}>+ Add Medication</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="shadow-xl card bg-base-100">
                  <div className="p-4 card-body">
                    <h3 className="mb-2 text-lg font-medium text-base-content">Diagnosis</h3>
                    <textarea className="textarea textarea-bordered w-full" rows={6} placeholder="Enter diagnosis details..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                  </div>
                </div>
                <div className="shadow-xl card bg-base-100">
                  <div className="p-4 card-body">
                    <h3 className="mb-2 text-lg font-medium text-base-content">Pharmacy Notes</h3>
                    <textarea className="textarea textarea-bordered w-full" rows={6} placeholder="Enter any special instructions for the pharmacist" value={pharmacyNotes} onChange={(e) => setPharmacyNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-3 text-lg font-medium text-base-content">Allergy Check</h3>
                  <div className="text-sm text-base-content/70">Please verify patient allergies before dispensing medication</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-3 text-lg font-medium text-base-content">Prescription Information</h3>
                  <div className="space-y-2 text-sm text-base-content/70">
                    <div className="flex justify-between"><span>Visit Date</span><span>{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>Prescribing Doctor</span><span>Dr. {patient?.doctorName || "—"}</span></div>
                    <div className="flex justify-between"><span>Total Medications</span><span>{meds.length}</span></div>
                  </div>
                </div>
              </div>
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button className="btn btn-outline">Print Prescription</button>
                    <button className="btn btn-outline">Download Prescription</button>
                    <button className="btn btn-success">New Patient</button>
                  </div>
                </div>
              </div>
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <button className="btn btn-success w-full" onClick={() => setIsPharmacyOpen(true)}>Send to Pharmacy</button>
                </div>
              </div>
            </div>
          </div>

          <PharmacyActionModal
            isOpen={isPharmacyOpen}
            onClose={() => setIsPharmacyOpen(false)}
            patientId={patientId}
            defaultStatus="awaiting_pharmacy"
            itemsCount={meds.length}
            medicationNames={meds.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}`)}
            patientLabel={`${patientName || "Unknown"} (${patient?.hospitalId || patientId || "—"})`}
          />
        </div>
      </div>
    </div>
  );
};

export default SendToPharmacy;
