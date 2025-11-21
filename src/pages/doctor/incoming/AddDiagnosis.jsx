import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import { getPatientById } from "@/services/api/patientsAPI";
import { createConsultation } from "@/services/api/consultationAPI";
import toast from "react-hot-toast";

const AddDiagnosis = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(!!patientId && !snapshot);
  const [patient, setPatient] = useState(snapshot || null);
  const [isSurgery, setIsSurgery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "Consultation",
    visitReason: "",
    diagnosis: "",
    date: "",
    admission: "",
    symptoms: "",
    notes: "",
    procedureName: "",
    scheduledDate: "",
    startTime: "",
    endTime: "",
    procedureCode: "",
  });

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

  const onChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    if (!patientId) return;
    const payload = {
      patientId,
      visitReason: form.visitReason || form.type || "",
      symptoms: form.symptoms || "",
      diagnosis: form.diagnosis || "",
      notes: form.notes || "",
    };
    try {
      setSaving(true);
      await createConsultation(payload);
      toast.success("Consultation created successfully");
      navigate(`/dashboard/doctor/medical-history/${patientId}`, { replace: true, state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create consultation");
    } finally {
      setSaving(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar />
      </div>
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <PatientHeaderActions
            title="Add New Diagnosis"
            subtitle={patient ? `${patientName || "Unknown"} • ${patient?.hospitalId || patientId || "—"}` : ""}
            fromIncoming={fromIncoming}
            onBack={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}
          />

          <div className="shadow-xl card bg-base-100">
            <div className="p-4 card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Type</label>
                  <select className="select select-bordered w-full" value={form.type} onChange={(e) => onChange("type", e.target.value)}>
                    <option>Consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Diagnosis</label>
                  <input className="input input-bordered w-full" placeholder="Enter diagnosis" value={form.diagnosis} onChange={(e) => onChange("diagnosis", e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Admission</label>
                  <input className="input input-bordered w-full" placeholder="MM/DD" value={form.admission} onChange={(e) => onChange("admission", e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Date</label>
                  <input className="input input-bordered w-full" placeholder="MM/DD" value={form.date} onChange={(e) => onChange("date", e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-success">Is your patient undergoing any surgery? If yes toggle on here</span>
                  <input type="checkbox" className="toggle toggle-success toggle-sm" checked={isSurgery} onChange={(e) => setIsSurgery(e.target.checked)} />
                </div>
                {isSurgery && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Procedure Name</label>
                      <input className="input input-bordered w-full" placeholder="Enter procedure" value={form.procedureName} onChange={(e) => onChange("procedureName", e.target.value)} />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Scheduled Date</label>
                      <input className="input input-bordered w-full" placeholder="MM/DD/YY" value={form.scheduledDate} onChange={(e) => onChange("scheduledDate", e.target.value)} />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Start Time</label>
                      <input className="input input-bordered w-full" placeholder="12:00AM" value={form.startTime} onChange={(e) => onChange("startTime", e.target.value)} />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">End Time</label>
                      <input className="input input-bordered w-full" placeholder="12:00AM" value={form.endTime} onChange={(e) => onChange("endTime", e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1 text-sm text-base-content/70">Procedure Code</label>
                      <input className="input input-bordered w-full" placeholder="0101010" value={form.procedureCode} onChange={(e) => onChange("procedureCode", e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Visit Reason</label>
                  <input className="input input-bordered w-full" placeholder="Enter reason" value={form.visitReason} onChange={(e) => onChange("visitReason", e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Symptoms</label>
                  <input className="input input-bordered w-full" placeholder="Enter symptoms" value={form.symptoms} onChange={(e) => onChange("symptoms", e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <label className="block mb-1 text-sm text-base-content/70">Notes</label>
                <textarea className="textarea textarea-bordered w-full" placeholder="Enter Additional Notes" rows={5} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
              </div>

              <div className="mt-6 flex items-center gap-6">
                <button className="text-primary hover:underline text-sm">Send to cashier</button>
                <button className="text-primary hover:underline text-sm">Send to Pharmacy</button>
              </div>

              <div className="mt-6 flex justify-center">
                <button className={`btn btn-success px-10 ${saving ? "loading" : ""}`} onClick={onSave} disabled={saving}>Save Now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDiagnosis;