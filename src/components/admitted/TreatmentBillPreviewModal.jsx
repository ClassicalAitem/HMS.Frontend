import React, { useEffect, useState } from 'react';
import { FaFileInvoiceDollar, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { previewTreatmentBill, createTreatmentBill } from '@/services/api/dispensesAPI';

const TreatmentBillPreviewModal = ({ isOpen, onClose, admissionId, onBillGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const groupItems = (items = []) => {
    const groups = {
      prescription: { title: 'Prescription / Treatment', items: [] },
      iv: { title: 'IV Fluids & Consumables', items: [] },
      blood: { title: 'Blood Transfusion & Prep & Consumables', items: [] },
    };

    items.forEach((item) => {
      const description = String(item?.description || '').toLowerCase();
      const category = String(item?.category || '').toLowerCase();
      const code = String(item?.code || '').toLowerCase();

      let bucket = 'prescription';

      if (category === 'iv fluid' || description.includes('iv fluid consumable') || code.includes('iv_') || code.includes('ivc')) {
        bucket = 'iv';
      } else if (
        category === 'blood transfusion' ||
        description.includes('blood transfusion') ||
        description.includes('blood giving set') ||
        description.includes('cannulla') && description.includes('blood') ||
        code.includes('bt_') ||
        code === 'blood_prep' ||
        code === 'blood_prep'
      ) {
        bucket = 'blood';
      }

      groups[bucket].items.push(item);
    });

    return Object.entries(groups)
      .filter(([, group]) => group.items.length > 0)
      .map(([key, group]) => ({
        key,
        title: group.title,
        items: group.items,
        total: group.items.reduce((sum, item) => sum + Number(item.total || 0), 0),
      }));
  };

  useEffect(() => {
    if (isOpen && admissionId) {
      loadPreview();
    } else {
      setPreviewData(null);
    }
  }, [isOpen, admissionId]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await previewTreatmentBill(admissionId);
      setPreviewData(res);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load bill preview');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!admissionId) return;
    setBilling(true);
    try {
      await createTreatmentBill(admissionId);
      toast.success('Patient billed successfully for all pending items!');
      if (onBillGenerated) onBillGenerated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to generate bill');
    } finally {
      setBilling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
      <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/30">
              <FaFileInvoiceDollar className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">Pending Bill Preview</h2>
              <p className="text-sm text-base-content/60">Review unbilled treatments & consumables before charging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 hover:text-error transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-base-content/60 font-medium">Gathering pending items...</p>
            </div>
          ) : previewData?.itemDetails?.length > 0 ? (
            <div className="space-y-5">
              {groupItems(previewData.itemDetails).map((group) => (
                <div key={group.key} className="overflow-hidden rounded-2xl border border-base-200 shadow-sm">
                  <div className="bg-base-200/60 px-4 py-3 flex items-center justify-between gap-3 border-b border-base-200">
                    <h3 className="font-bold text-sm text-base-content">{group.title}</h3>
                    <span className="text-sm font-bold text-primary">
                      ₦{group.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <table className="table table-zebra w-full">
                    <thead className="bg-base-200/30">
                      <tr>
                        <th>Item Description</th>
                        <th>Category</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Unit Price (₦)</th>
                        <th className="text-right">Total (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <tr key={`${group.key}-${idx}`} className="hover:bg-base-50/50 transition-colors">
                          <td className="font-medium">{item.description}</td>
                          <td>
                            <span className={`badge badge-sm font-semibold ${item.category === 'Consumables' ? 'badge-secondary badge-outline' : 'badge-primary badge-outline'}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="text-center font-semibold">{item.quantity}</td>
                          <td className="text-right text-base-content/70">{(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="text-right font-bold text-primary">{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="rounded-2xl border border-base-200 bg-base-200/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-base-content">Grand Total:</span>
                  <span className="text-xl font-black text-primary">
                    ₦{(previewData.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="bg-success/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMoneyBillWave className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-base-content mb-2">No Pending Payments!</h3>
              <p className="text-base-content/60 max-w-sm mx-auto">
                All dispensed medications, IV fluids, and consumables for this patient have already been billed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-200 bg-base-50 flex justify-end gap-3">
          <button
            className="btn btn-ghost rounded-xl font-bold"
            onClick={onClose}
          >
            Close
          </button>
          {previewData?.itemDetails?.length > 0 && (
            <button
              className="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/30 font-bold hover:-translate-y-0.5 transition-transform"
              onClick={handleGenerateBill}
              disabled={billing}
            >
              {billing ? 'Billing...' : 'Bill the Patient'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreatmentBillPreviewModal;
