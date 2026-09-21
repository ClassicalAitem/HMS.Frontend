import React, { useEffect, useState } from 'react';
import { FaFileInvoiceDollar, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { previewTreatmentBill, createTreatmentBill } from '@/services/api/dispensesAPI';

const TreatmentBillPreviewModal = ({ isOpen, onClose, admissionId, onBillGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-base-200 shadow-sm">
                <table className="table table-zebra w-full">
                  <thead className="bg-base-200/50">
                    <tr>
                      <th>Item Description</th>
                      <th>Category</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price (₦)</th>
                      <th className="text-right">Total (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.itemDetails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-base-50/50 transition-colors">
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
                  <tfoot className="bg-base-200/80">
                    <tr>
                      <td colSpan={4} className="text-right font-bold text-base-content">Grand Total:</td>
                      <td className="text-right font-black text-lg text-primary">
                        ₦{(previewData.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
