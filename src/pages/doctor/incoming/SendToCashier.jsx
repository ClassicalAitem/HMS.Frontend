import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import { getPatientById } from "@/services/api/patientsAPI";
import { useAppSelector } from "@/store/hooks";
import { getServiceCharges } from "@/services/api/serviceChargesAPI";
import { createBilling } from "@/services/api/billingAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import toast from "react-hot-toast";

const SendToCashier = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const { user } = useAppSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patient, setPatient] = useState(snapshot || null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");

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
      } finally {
        // no-op
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

  const openAddItem = async () => {
    try {
      setIsAddItemOpen(true);
      setServiceLoading(true);
      const res = await getServiceCharges();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setServiceCharges(list);
    } catch {
      setServiceCharges([]);
    } finally {
      setServiceLoading(false);
    }
  };
  const removeItem = (id) => setItems((list) => list.filter((i) => i.id !== id));

  const addSelectedServiceItem = (svc, qty, price, desc, code) => {
    const quantity = Math.max(1, Number(qty) || 1);
    const unitPrice = Math.max(0, Number(price) || 0);
    const item = {
      id: Date.now(),
      code: code || (svc?.category || ""),
      name: svc?.service || desc || "Item",
      description: desc || svc?.service || "",
      note: svc?.category || "",
      qty: quantity,
      amount: unitPrice,
    };
    setItems((list) => {
      const idx = list.findIndex((it) => (it.code === item.code) && (Number(it.amount) === Number(item.amount)));
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], qty: Number(updated[idx].qty) + item.qty };
        return updated;
      }
      return [...list, item];
    });
    setIsAddItemOpen(false);
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
                      <div className="text-xs text-base-content/70">Code: {it.code || '—'}</div>
                      <div className="text-sm text-base-content/70">{it.note}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        className="input input-bordered input-xs w-16"
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          setItems((list) => list.map((x) => x.id === it.id ? { ...x, qty: val } : x));
                        }}
                        title="Quantity"
                      />
                      <input
                        className="input input-bordered input-xs w-28"
                        type="number"
                        min={0}
                        value={it.amount}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setItems((list) => list.map((x) => x.id === it.id ? { ...x, amount: val } : x));
                        }}
                        title="Unit price"
                      />
                      <span className="font-medium">₦{((Number(it.amount) || 0) * (Number(it.qty) || 1)).toLocaleString()}</span>
                      <button className="btn btn-ghost btn-xs" onClick={() => removeItem(it.id)} title="Remove">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button className="btn btn-success btn-sm" onClick={openAddItem}>+ Add item</button>
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
                    <div className="flex justify-between"><span>Doctor</span><span>Dr. {`${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}`}</span></div>
                  </div>
                </div>
              </div>
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <button
                    className="btn btn-success w-full"
                    onClick={async () => {
                      try {
                        if (!items.length) {
                          toast.error('Add at least one billable item');
                          return;
                        }
                        const itemDetail = items.map((it) => ({
                          code: String(it.code || '').toLowerCase(),
                          description: it.description || it.name || '',
                          quantity: String(it.qty),
                          price: String(it.amount),
                          total: String((Number(it.amount) || 0) * (Number(it.qty) || 1)),
                        }));
                        await toast.promise(
                          createBilling(patientId, { itemDetail }),
                          { loading: 'Creating billing...', success: 'Billing created', error: (e) => e?.response?.data?.message || 'Failed to create billing' }
                        );
                        await toast.promise(
                          updatePatientStatus(patientId, 'awaiting_cashier'),
                          { loading: 'Sending to cashier...', success: 'Patient sent to cashier', error: (e) => e?.response?.data?.message || 'Failed to update status' }
                        );
                        navigate('/cashier/incoming');
                      } catch {
                        // already handled by toasts; offer retry via UI if needed
                      }
                    }}
                  >
                    Send to Cashier
                  </button>
                </div>
              </div>
            </div>
          </div>
          {isAddItemOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsAddItemOpen(false)} />
              <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-base-content">Add Billable Item</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsAddItemOpen(false)}>Close</button>
                  </div>
                  <div className="mb-3">
                    {serviceLoading ? (
                      <div className="skeleton h-10 w-full" />
                    ) : (
                      <div className="rounded-lg border border-base-300 p-3 max-h-64 overflow-y-auto">
                        {serviceCharges.length === 0 ? (
                          <div className="text-sm text-base-content/70">No service charges found. You can enter manually.</div>
                        ) : (
                          <table className="table table-zebra w-full text-sm">
                            <thead>
                              <tr>
                                <th>Service</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {serviceCharges.map((svc) => (
                                <tr key={svc.id}>
                                  <td>{svc.service}</td>
                                  <td>{svc.category}</td>
                                  <td>₦{Number(svc.amount || 0).toLocaleString()}</td>
                                  <td>
                                    <button
                                      className="btn btn-primary btn-xs"
                                      onClick={() => {
                                        const price = Number(svc.amount || 0);
                                        const desc = svc.service;
                                        const code = svc.category;
                                        const qty = 1;
                                        addSelectedServiceItem(svc, qty, price, desc, code);
                                      }}
                                    >
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-base-content/70">Selected items can be edited in the list (quantity and price). To merge duplicates we combine by code and price.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendToCashier;
