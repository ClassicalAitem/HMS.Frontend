import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import toast from "react-hot-toast";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { createBilling } from "@/services/api/billingAPI";
import { SelectServiceChargeModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";

const SendToCashier = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patient, setPatient] = useState(snapshot || null);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingCreated, setBillingCreated] = useState(false);

  const [items, setItems] = useState([]);
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
        const res = await getPatientById(patientId);
        const data = res?.data ?? res;
        if (mounted) setPatient(data);
      } finally {
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

  const addOrMergeItem = (item) => {
    setItems((list) => {
      const code = item.code;
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const idx = list.findIndex((i) => i.note === code && Number(i.amount) === price);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...next[idx], qty: (Number(next[idx].qty) || 0) + quantity };
        return next;
      }
      return [...list, { id: Date.now(), name: item.description, note: code, qty: quantity, amount: price }];
    });
  };
  const removeItem = (id) => setItems((list) => list.filter((i) => i.id !== id));

  const handleSendToCashier = async () => {
    if (!patientId) return;
    if (items.length === 0) {
      toast.error('Add at least one billable item');
      return;
    }
    setIsSubmitting(true);
    try {
      if (!billingCreated) {
        const itemDetail = items.map((i) => ({
          code: i.note,
          description: i.name,
          quantity: Number(i.qty) || 1,
          price: Number(i.amount) || 0,
          total: (Number(i.amount) || 0) * (Number(i.qty) || 1),
        }));
        const createPromise = createBilling(patientId, { itemDetail, totalAmount: subtotal });
        await toast.promise(createPromise, {
          loading: 'Creating bill...',
          success: 'Bill created',
          error: (err) => err?.response?.data?.message || 'Failed to create bill',
        });
        setBillingCreated(true);
      }
      const statusPromise = updatePatientStatus(patientId, 'awaiting_cashier');
      await toast.promise(statusPromise, {
        loading: 'Updating status...',
        success: 'Patient sent to cashier',
        error: (err) => err?.response?.data?.message || 'Failed to update status',
      });
      navigate('/cashier/incoming');
    } catch {
      // toasts handle messages
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
            title="Send To Cashier"
            subtitle={patient ? `${patientName || "Unknown"} • ${patient?.hospitalId || patientId || "—"}` : ""}
            fromIncoming={fromIncoming}
            onBack={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })}
          />

          <div className="flex gap-4 items-center mb-4 justify-between">
            <div className="flex gap-4 items-center">
              <button className="btn btn-success btn-sm">Send to Cashier</button>
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

                  <div className="mt-4">
                    <button className="btn btn-success btn-sm" onClick={() => setIsSelectModalOpen(true)}>+ Add item</button>
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
                    <div className="flex justify-between"><span>Doctor</span><span>Dr. {user ? `${user.firstName} ${user.lastName}` : "—"}</span></div>
                  </div>
                </div>
              </div>
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <button className="btn btn-success w-full" disabled={isSubmitting} onClick={handleSendToCashier}>Send to Cashier</button>
                </div>
              </div>
            </div>
          </div>

          <SelectServiceChargeModal
            isOpen={isSelectModalOpen}
            onClose={() => setIsSelectModalOpen(false)}
            onAddItem={addOrMergeItem}
          />
        </div>
      </div>
    </div>
  );
};

export default SendToCashier;
