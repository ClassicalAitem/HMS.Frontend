import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import toast from 'react-hot-toast';
import { getOpdPatientById } from '@/services/api/opdPatientAPI';
import { getBillingsByObdPatientId, getReceiptsByObdPatientId, createReceipt, createBillForObd } from '@/services/api/billingAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { createInvestigationRequestForCashier } from '@/services/api/investigationRequestAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import ReceiptModal from '@/components/modals/ReceiptModal';
import SendPatientModal from '@/components/modals/SendPatientModal';

// ─── Searchable test input ────────────────────────────────────────────────────
const TestSearchInput = ({ serviceCharges, onSelect, placeholder = 'Search lab test...' }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = serviceCharges.filter(s =>
    !search || (s.service || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDropdown = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className="input input-bordered input-sm w-full"
        placeholder={placeholder}
        value={search}
        onFocus={openDropdown}
        onChange={(e) => { setSearch(e.target.value); if (!open) openDropdown(); }}
        autoComplete="off"
      />
      {open && (
        <div style={dropdownStyle} className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-sm">No matches found</div>
          ) : filtered.map(s => (
            <div
              key={s.id || s._id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s);
                setSearch('');
                setOpen(false);
              }}
            >
              <span className="font-medium">{s.service}</span>
              <span className="text-gray-400 text-xs ml-2">₦{Number(s.amount || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CashierOpdPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]); // { charge, qty }
  const [priority, setPriority] = useState('normal');

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [patientRes, billingsRes, receiptsRes] = await Promise.allSettled([
        getOpdPatientById(patientId),
        getBillingsByOpdPatientId(patientId),
        getReceiptsByOpdPatientId(patientId),
      ]);

      if (patientRes.status === 'fulfilled') {
        setPatient(patientRes.value?.data ?? patientRes.value);
      }
      if (billingsRes.status === 'fulfilled') {
        setBillings(billingsRes.value?.data?.data ?? []);
      }
      if (receiptsRes.status === 'fulfilled') {
        setReceipts(receiptsRes.value?.data?.data ?? []);
      }
    } catch (err) {
      toast.error('Failed to load patient details');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => { if (patientId) loadAll(); }, [patientId, loadAll]);

  // Load service charges for additional tests
  useEffect(() => {
    const loadCharges = async () => {
      try {
        const res = await getServiceCharges();
        const data = res?.data ?? res ?? [];
        const labs = data.filter(i => (i.category || '').toLowerCase() === 'laboratory');
        setServiceCharges(labs);
      } catch (err) {
        console.error('Failed to load service charges', err);
      }
    };
    loadCharges();
  }, []);

  const handleAddTest = (charge) => {
    // Prevent duplicates
    if (selectedTests.find(t => (t.charge.id || t.charge._id) === (charge.id || charge._id))) {
      toast.error('Test already added');
      return;
    }
    setSelectedTests(prev => [...prev, { charge, qty: 1 }]);
  };

  const handleRemoveTest = (index) => {
    setSelectedTests(prev => prev.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, qty) => {
    setSelectedTests(prev => prev.map((t, i) => i === index ? { ...t, qty: Math.max(1, Number(qty) || 1) } : t));
  };

  const handleCreateAdditionalBill = async () => {
    if (selectedTests.length === 0) {
      toast.error('Please add at least one test');
      return;
    }

    try {
      const itemDetail = selectedTests.map(t => ({
        code: t.charge.category || 'LAB',
        description: t.charge.service,
        quantity: t.qty,
        price: Number(t.charge.amount || 0),
        total: Number(t.charge.amount || 0) * t.qty,
        serviceChargeId: t.charge.id || t.charge._id,
      }));

      // Create the bill
      await toast.promise(
        createBillForObd(patientId, { itemDetail }),
        {
          loading: 'Creating additional bill...',
          success: 'Additional bill created successfully!',
          error: (e) => e?.response?.data?.message || 'Failed to create bill',
        }
      );

      // Create investigation request for the tests
      const investigationData = {
        obdPatientId: patientId,
        priority,
        tests: selectedTests.map(t => ({
          name: t.charge.service,
        })),
      };

      await toast.promise(
        createInvestigationRequestForCashier(investigationData),
        {
          loading: 'Creating investigation request...',
          success: 'Investigation request created successfully!',
          error: (e) => e?.response?.data?.message || 'Failed to create investigation request',
        }
      );

      // Clear selected tests and refresh data
      setSelectedTests([]);
      await loadAll();
    } catch (error) {
      console.error('Error creating additional bill and investigation:', error);
    }
  };

  const handleReceiptSubmit = async (receiptData) => {
    try {
      await toast.promise(
        createReceipt(selectedBillingId, receiptData),
        {
          loading: 'Processing payment...',
          success: 'Payment recorded!',
          error: (e) => e?.response?.data?.message || 'Payment failed',
        }
      );
      setIsReceiptModalOpen(false);
      await loadAll(); // refresh
    } catch { /* handled by toast */ }
  };

  const getReceiptBillingId = (receipt) => {
    return receipt.billingId ?? receipt.billing?.id ?? receipt.billing?._id ?? receipt.billId ?? receipt.billing_id;
  };

  const matchesBilling = (receipt, bill) => {
    const receiptBillingId = getReceiptBillingId(receipt);
    const billId = bill.id ?? bill._id;
    return receiptBillingId && billId && String(receiptBillingId) === String(billId);
  };

  const totalOutstanding = billings.reduce((sum, b) => {
    const receiptsForBill = receipts.filter(r => matchesBilling(r, b));
    const totalPaid = receiptsForBill.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
    const outstandingAmount = Number(b.totalAmount || 0) - totalPaid;
    return sum + Math.max(0, outstandingAmount);
  }, 0);
  const allPaid = billings.length > 0 && totalOutstanding === 0;

  if (isLoading) {
    return (
      <CashierLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/cashier/opd-patients')} className="btn btn-ghost btn-sm">
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-base-content">OPD Patient Details</h1>
          <p className="text-sm text-base-content/70">{patient?.fullName}</p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-base-content/50 text-xs uppercase tracking-wide">Name</p>
              <p className="font-semibold">{patient?.fullName || '—'}</p>
            </div>
            <div>
              <p className="text-base-content/50 text-xs uppercase tracking-wide">Phone</p>
              <p className="font-semibold">{patient?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-base-content/50 text-xs uppercase tracking-wide">Address</p>
              <p className="font-semibold">{patient?.address || '—'}</p>
            </div>
            <div>
              <p className="text-base-content/50 text-xs uppercase tracking-wide">Status</p>
              <span className={`badge badge-sm ${
                patient?.status === 'paid' ? 'badge-success' :
                patient?.status === 'tested' ? 'badge-info' : 'badge-warning'
              }`}>
                {patient?.status || 'registered'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Additional Lab Tests */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">Add Additional Lab Tests</h2>
          <p className="text-sm text-base-content/60 mb-4">Add more tests if the patient needs additional investigations.</p>

          {/* Search input */}
          <TestSearchInput
            serviceCharges={serviceCharges}
            onSelect={handleAddTest}
            placeholder="Search and add additional lab test..."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Investigation Priority</span>
              </label>
              <select
                className="select select-bordered"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Selected tests list */}
          {selectedTests.length > 0 ? (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-base-content/50 uppercase tracking-wide font-semibold mb-1">Additional Tests to Bill</div>
              {selectedTests.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 border border-base-200 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{t.charge.service}</span>
                    <span className="text-xs text-base-content/50 ml-2">₦{Number(t.charge.amount || 0).toLocaleString()} each</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={t.qty}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="input input-bordered input-xs w-16 text-center"
                    />
                    <span className="text-sm font-medium text-primary w-24 text-right">
                      ₦{(Number(t.charge.amount || 0) * t.qty).toLocaleString()}
                    </span>
                    <button type="button" onClick={() => handleRemoveTest(idx)}
                      className="btn btn-ghost btn-xs text-error">
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total and Create Bill Button */}
              <div className="flex justify-between items-center pt-3 border-t border-base-200 mt-3">
                <span className="font-semibold text-base-content">
                  Additional Total: ₦{selectedTests.reduce((sum, t) => sum + Number(t.charge.amount || 0) * t.qty, 0).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleCreateAdditionalBill}
                  className="btn btn-primary btn-sm"
                >
                  <FaPlus className="w-4 h-4 mr-1" />
                  Create Additional Bill
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-4 border border-dashed border-base-300 rounded-lg text-base-content/40 text-sm">
              No additional tests added yet.
            </div>
          )}
        </div>
      </div>

      {/* Billings */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h3 className="text-xl font-bold text-primary mb-4">Billings</h3>
          {billings.length === 0 ? (
            <p className="text-base-content/50 text-sm">No bills found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th></th>
                    <th>Billing ID</th>
                    <th>Total</th>
                    <th>Outstanding</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map(bill => (
                    <React.Fragment key={bill.id}>
                      <tr className="text-sm">
                        <td
                          className="cursor-pointer select-none"
                          onClick={() => setOpenRow(openRow === bill.id ? null : bill.id)}
                        >
                          {openRow === bill.id ? '▼' : '▶'}
                        </td>
                        <td className="font-medium font-mono text-xs">{bill.id?.slice(-12)}</td>
                        <td>₦{Number(bill.totalAmount).toLocaleString()}</td>
                        <td>
                          {(() => {
                            const receiptsForBill = receipts.filter(r => matchesBilling(r, bill));
                            const totalPaid = receiptsForBill.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
                            const outstandingAmount = Number(bill.totalAmount || 0) - totalPaid;
                            return (
                              <span className={outstandingAmount <= 0 ? 'text-success font-medium' : 'text-error font-medium'}>
                                ₦{outstandingAmount.toLocaleString()}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const receiptsForBill = receipts.filter(r => matchesBilling(r, bill));
                            const totalPaid = receiptsForBill.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
                            const outstandingAmount = Number(bill.totalAmount || 0) - totalPaid;

                            if (outstandingAmount <= 0) {
                              return <button className="btn btn-sm btn-ghost btn-success" disabled>Completed</button>;
                            }

                            if (totalPaid > 0) {
                              return (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => { setSelectedBillingId(bill.id); setIsReceiptModalOpen(true); }}
                                >
                                  Pay Remaining  </button>
                              );
                            }

                            return (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => { setSelectedBillingId(bill.id); setIsReceiptModalOpen(true); }}
                              >
                                Pay Now </button>
                            );
                          })()}
                        </td>
                      </tr>

                      {openRow === bill.id && (
                        <tr>
                          <td colSpan={5} className="bg-base-200">
                            <div className="p-3">
                              <h4 className="font-semibold mb-2">Item Details</h4>
                              <table className="table table-sm w-full">
                                <thead>
                                  <tr>
                                    <th>Test</th>
                                    <th>Code</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bill.itemDetails?.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.description}</td>
                                      <td>{item.code}</td>
                                      <td>₦{Number(item.price).toLocaleString()}</td>
                                      <td>{item.quantity}</td>
                                      <td>₦{Number(item.total).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-base-300">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${totalOutstanding === 0 ? 'bg-success' : 'bg-error'}`}></span>
              <span className={`font-semibold ${totalOutstanding === 0 ? 'text-success' : 'text-error'}`}>
                {totalOutstanding === 0 ? 'All bills paid' : `Outstanding: ₦${totalOutstanding.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {receipts.length > 0 && (
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="text-xl font-bold text-primary mb-4">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-base-200">
                  <tr className="text-xs text-base-content/60 uppercase tracking-wide">
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r, i) => (
                    <tr key={i} className="text-sm">
                      <td className="font-medium">{r.reference}</td>
                      <td>{formatNigeriaDate(r.createdAt)}</td>
                      <td>₦{Number(r.amountPaid).toLocaleString()}</td>
                      <td>{r.paymentMethod}</td>
                      <td>
                        <span className={`badge badge-sm ${r.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{formatNigeriaTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Post-payment — Send to Lab (only show after payment) */}
      {/* {allPaid && ( */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="text-xl font-bold text-primary mb-2">Send to Lab</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Payment received. Send patient to the lab for testing.
            </p>
            <SendPatientModal
              patientId={patient?.id || patientId}
              onUpdated={() => navigate('/cashier/opd-patients')}
              allowedRoles={['labtechnician']}
              isObdPatient={true}
            />
          </div>
        </div>
      

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        billingId={selectedBillingId}
        patientId={patient?.id || patientId}
        bill={billings.find(b => b.id === selectedBillingId)}
        onSubmit={handleReceiptSubmit}
      />
    </CashierLayout>
  );
};

export default CashierOpdPatientDetails;