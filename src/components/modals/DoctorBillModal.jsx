import React, { useEffect, useState } from 'react';
import { FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getBillingbypatientId } from '@/services/api/billingAPI';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { mergePatientStatus } from '@/utils/statusUtils';

const DoctorBillModal = ({
  isOpen,
  onClose,
  patientId,
  currentStatus = [],
  onSuccess,
  patientLabel = '',
}) => {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch bills created by doctor when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
const fetchBilling = async () => {
  try {
    setLoading(true);

    const response = await getBillingbypatientId(patientId);
    const data = response?.data?.data || [];

    if (Array.isArray(data) && data.length > 0) {
      setBillingData(data[0]);
    } else {
      toast('No bill found for this patient');
      setBillingData(null);
    }

  } catch (error) {
    console.error('DoctorBillModal: Error fetching billing', error);
    toast.error('Could not load bill data');
    setBillingData(null);
  } finally {
    setLoading(false);
  }
      };
      fetchBilling();
    }
  }, [isOpen, patientId]);

  const handleSendToCashier = async () => {
    try {
      setIsSending(true);
      const mergedStatus = mergePatientStatus(currentStatus, 'cashier',{ status: PATIENT_STATUS.AWAITING_CASHIER });
      const promise = updatePatientStatus(patientId, mergedStatus);
      
      toast.promise(promise, {
        loading: 'Sending to cashier...',
        success: 'Bill sent to cashier successfully',
        error: (err) => err?.response?.data?.message || 'Failed to send to cashier',
      });
      
      await promise;
      onClose();
      if (onSuccess) onSuccess();
    } catch (e) {
      // handled by toast
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;
const grandTotal =
  billingData?.totalAmount ||
  billingData?.itemDetails?.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  ) ||
  0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-base-100 rounded-xl shadow-2xl overflow-hidden border border-base-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaMoneyBillWave className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">Preview Doctor's Bill</h2>
              <p className="text-xs text-base-content/60">
                {patientLabel ? `Bill for ${patientLabel}` : 'Viewing bill created by doctor'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-base-200">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="text-base-content/70">Loading bill data...</span>
            </div>
          ) : billingData ? (
            <>
              {/* Table of items */}
              <div className="overflow-x-auto border border-base-200 rounded-lg mb-6">
                <table className="table table-sm w-full">
                  <thead className="bg-base-200/50">
                    <tr>
                      <th className="w-1/3">Description</th>
                      <th>Code</th>
                      <th className="w-20 text-center">Qty</th>
                      <th className="w-32 text-right">Price</th>
                      <th className="w-32 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData?.itemDetails && Array.isArray(billingData.itemDetails) && billingData.itemDetails.length > 0 ? (
                      billingData.itemDetails.map((item, index) => {
                        const qty = Number(item.quantity) || 1;
                        const price = Number(item.price) || 0;
                        const total = Number(item.total || (qty * price)) || 0;

                        return (
                          <tr key={index} className="hover:bg-base-50/50 bg-base-50/30">
                            <td className="p-3">
                              <div className="text-sm font-medium">{item?.description || '—'}</div>
                            </td>
                            <td className="text-sm">{item?.code || '—'}</td>
                            <td className="text-center text-sm">{qty}</td>
                            <td className="text-right text-sm">₦{price.toLocaleString()}</td>
                            <td className="text-right font-medium text-sm">₦{total.toLocaleString()}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center p-4 text-base-content/60">
                          No items in this bill
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-base-content">Grand Total:</span>
                  <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
                </div>
                {billingData?.id && (
                  <div className="text-xs text-base-content/60 mt-2">
                    Bill ID: {billingData.id}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="alert alert-info text-center py-8">
              <div>
                <span className="text-sm">No bill found for this patient yet</span>
                <p className="text-xs text-base-content/70 mt-1">Please ensure the doctor has created a bill</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-base-200 bg-base-50 flex justify-between items-center">
          <div className="text-sm text-base-content/70">
            {billingData ? 'Ready to send to cashier' : 'No bill available'}
          </div>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={onClose} disabled={isSending}>
              Close
            </button>
            {billingData && (
              <button 
                className="btn btn-success" 
                disabled={isSending}
                onClick={handleSendToCashier}
              >
                {isSending ? <span className="loading loading-spinner loading-sm"></span> : 'Send to Cashier'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorBillModal;
