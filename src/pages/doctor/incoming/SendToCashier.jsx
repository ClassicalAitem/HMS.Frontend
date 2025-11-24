import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import { getPatientById } from "@/services/api/patientsAPI";
import { CashierActionModal } from "@/components/modals";

const SendToCashier = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(!!patientId && !snapshot);
  const [patient, setPatient] = useState(snapshot || null);
  const [isCashierOpen, setIsCashierOpen] = useState(false);

  const [items, setItems] = useState([
    { id: 1, name: "General Consultation", note: "General Consultation", qty: 1, amount: 300000 },
    { id: 2, name: "Malaria", note: "Lab test", qty: 1, amount: 300000 },
    { id: 3, name: "General Consultation", note: "General Consultation", qty: 1, amount: 300000 },
  ]);
  const [newItem, setNewItem] = useState({ name: "", note: "", qty: 1, amount: 0 });
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");

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

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (Number(it.amount) || 0) * (Number(it.qty) || 1), 0), [items]);
  const vat = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const total = useMemo(() => subtotal + vat, [subtotal, vat]);

  const addItem = () => {
    if (!newItem.name || !newItem.amount) return;
    setItems((list) => ([...list, { id: Date.now(), ...newItem, qty: Number(newItem.qty) || 1, amount: Number(newItem.amount) || 0 }]));
    setNewItem({ name: "", note: "", qty: 1, amount: 0 });
  };
  const removeItem = (id) => setItems((list) => list.filter((i) => i.id !== id));

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
            title="Send To Cashier"
            subtitle={patient ? `${patientName || "Unknown"} • ${patient?.hospitalId || patientId || "—"}` : ""}
            fromIncoming={fromIncoming}
            onBack={() => navigate(`/dashboard/doctor/medical-history/${patientId}`/add, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}
          />

          <div className="flex gap-4 items-center mb-4">
            <button className="btn btn-success btn-sm">Send to Cashier</button>
            <button className="btn btn-outline btn-sm">Send to Pharmacy</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-4 text-lg font-medium text-base-content">Billable Items</h3>
                  <div className="space-y-3">
                    {items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center p-3 rounded-lg bg-base-200">
                        <div>
                          <div className="font-medium text-base-content">{it.name}</div>
                          <div className="text-sm text-base-content/70">{it.note}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">Qty:{it.qty}</span>
                          <span className="font-medium">₦{(it.amount || 0).toLocaleString()}</span>
                          <button className="btn btn-ghost btn-xs" onClick={() => removeItem(it.id)} title="Remove">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select className="select select-bordered w-full" value={newItem.note} onChange={(e) => setNewItem((ni) => ({ ...ni, note: e.target.value }))}>
                      <option value="">Select Service</option>
                      <option>General Consultation</option>
                      <option>Lab test</option>
                      <option>Surgery</option>
                    </select>
                    <input className="input input-bordered w-full sm:col-span-2" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem((ni) => ({ ...ni, name: e.target.value }))} />
                    <input className="input input-bordered w-full" type="number" placeholder="Qty" value={newItem.qty} onChange={(e) => setNewItem((ni) => ({ ...ni, qty: e.target.value }))} />
                    <input className="input input-bordered w-full" type="number" placeholder="Amount" value={newItem.amount} onChange={(e) => setNewItem((ni) => ({ ...ni, amount: e.target.value }))} />
                  </div>
                  <div className="mt-3">
                    <button className="btn btn-success btn-sm" onClick={addItem}>+ Add item</button>
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
                    <h3 className="mb-2 text-lg font-medium text-base-content">Treatment Notes</h3>
                    <textarea className="textarea textarea-bordered w-full" rows={6} placeholder="Enter treatment notes, prescriptions or special instructions" value={treatmentNotes} onChange={(e) => setTreatmentNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-3 text-lg font-medium text-base-content">Billing Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-base-content/70">Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-base-content/70">VAT (5%)</span><span>₦{vat.toLocaleString()}</span></div>
                    <div className="flex justify-between text-base font-semibold"><span>Total Amount</span><span>₦{total.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="mb-3 text-lg font-medium text-base-content">Visit Information</h3>
                  <div className="space-y-2 text-sm text-base-content/70">
                    <div className="flex justify-between"><span>Visit Date</span><span>{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span>Visit Time</span><span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                    <div className="flex justify-between"><span>Doctor</span><span>Dr. {patient?.doctorName || "—"}</span></div>
                  </div>
                </div>
              </div>
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <button className="btn btn-success w-full" onClick={() => setIsCashierOpen(true)}>Send to Cashier</button>
                </div>
              </div>
            </div>
          </div>

          <CashierActionModal
            isOpen={isCashierOpen}
            onClose={() => setIsCashierOpen(false)}
            patientId={patientId}
            defaultStatus="awaiting_cashier"
            mode="confirm"
            totalAmount={total}
            itemsCount={items.length}
            patientLabel={`${patientName || "Unknown"} (${patient?.hospitalId || patientId || "—"})`}
            onUpdated={() => navigate('/cashier/incoming')}
          />
        </div>
      </div>
    </div>
  );
};

export default SendToCashier;