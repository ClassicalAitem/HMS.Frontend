import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { getBillingbypatientId } from '@/services/api/billingAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { mergePatientStatus } from '@/utils/statusUtils';

const CashierActionModal = ({
  isOpen,
  onClose,
  patientId,
  currentStatus = [],
  defaultStatus = [PATIENT_STATUS.AWAITING_CASHIER],
  onUpdated,
  mode = 'confirm',
  totalAmount,
  itemsCount,
  patientLabel,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(defaultStatus);
  const [isSending, setIsSending] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  // Fetch billing data when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      const fetchBilling = async () => {
        try {
          setLoadingBilling(true);
          console.log('CashierActionModal: Fetching billing for patient', { patientId });
          const response = await getBillingbypatientId(patientId);
          console.log('CashierActionModal: Billing data response', response);
          
          // Handle various response formats
          const data = response?.data || response;
          console.log('CashierActionModal: Processed billing data', data);
          
          if (data) {
            setBillingData(data);
          } else {
            console.warn('CashierActionModal: No billing data found');
            setBillingData(null);
            toast.info('No billing data found for this patient');
          }
        } catch (error) {
          console.error('CashierActionModal: Error fetching billing data', error);
          toast.error('Could not load billing data: ' + (error?.message || 'Unknown error'));
          setBillingData(null);
        } finally {
          setLoadingBilling(false);
        }
      };
      fetchBilling();
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSending(true);
      const statusToSend = selectedStatus || defaultStatus;
      // Merge current status with new status (removes cashier-related statuses, adds new one)
      const mergedStatus = mergePatientStatus(currentStatus, 'cashier', statusToSend);
      const promise = updatePatientStatus(patientId, mergedStatus);
      toast.promise(promise, {
        loading: 'Sending to cashier...',
        success: 'Patient sent to cashier successfully',
        error: (err) => err?.response?.data?.message || 'Failed to send to cashier',
      });
      await promise;
      onClose();
      if (onUpdated) onUpdated();
    } catch (e) {
      // handled by toast
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">{mode === 'confirm' ? 'Confirm Send to Cashier' : 'Send to Cashier'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          {mode === 'confirm' ? (
            <>
              <p className="mb-4 text-sm text-base-content/70">
                Are you sure you want to send this billing information to the cashier? This action will notify the cashier to process payment{patientLabel ? ` for ${patientLabel}` : ''}.
              </p>
              
              {/* Loading state */}
              {loadingBilling && (
                <div className="rounded-lg border border-base-300 p-4 bg-base-200/30 flex items-center justify-center gap-3">
                  <span className="loading loading-spinner loading-md"></span>
                  <span className="text-sm text-base-content/70">Loading billing data...</span>
                </div>
              )}
              
              {/* Billing data display */}
              {!loadingBilling && billingData && (
                <div className="rounded-lg border border-base-300 p-4 bg-base-200/30 mb-4">
                  <h3 className="font-semibold text-base-content mb-3 text-sm">Billing Items</h3>
                  
                  {/* Items table */}
                  {billingData?.itemDetail && Array.isArray(billingData.itemDetail) && billingData.itemDetail.length > 0 ? (
                    <div className="overflow-x-auto mb-3">
                      <table className="table table-sm w-full">
                        <thead className="bg-base-100/50">
                          <tr>
                            <th className="text-xs">Description</th>
                            <th className="text-xs text-right">Qty</th>
                            <th className="text-xs text-right">Price</th>
                            <th className="text-xs text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingData.itemDetail.map((item, idx) => (
                            <tr key={idx} className="hover">
                              <td className="text-sm">{item?.description || item?.code || '—'}</td>
                              <td className="text-right text-sm">{item?.quantity || 1}</td>
                              <td className="text-right text-sm">₦{Number(item?.price || 0).toLocaleString()}</td>
                              <td className="text-right font-medium text-sm">₦{(Number(item?.total || (item?.price * item?.quantity) || 0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-base-content/60 italic">No billing items available</div>
                  )}
                  
                  {/* Total Amount */}
                  <div className="flex justify-end border-t border-base-300 pt-3 mt-3">
                    <div className="text-right">
                      <div className="text-xs text-base-content/70 mb-1">Grand Total</div>
                      <div className="text-xl font-bold text-primary">
                        ₦{(Number(billingData?.totalAmount || billingData?.itemDetail?.reduce((sum, item) => sum + Number(item?.total || 0), 0) || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback: Use provided props if billing data not loaded */}
              {!loadingBilling && !billingData && (totalAmount !== undefined || itemsCount !== undefined) && (
                <div className="rounded-lg border border-base-300 p-4 bg-base-200/30">
                  {totalAmount !== undefined && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-base-content/70">Total Amount</span>
                      <span className="font-medium text-base-content">{typeof totalAmount === 'number' ? `₦${totalAmount.toLocaleString()}` : String(totalAmount)}</span>
                    </div>
                  )}
                  {itemsCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/70">Number of Items</span>
                      <span className="font-medium text-base-content">{itemsCount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* No billing data message */}
              {!loadingBilling && !billingData && !totalAmount && !itemsCount && (
                <div className="alert alert-info">
                  <div>
                    <span className="text-sm">No billing data available yet. This patient may not have a bill created, or the bill is still being processed.</span>
                    <p className="text-xs text-base-content/70 mt-1">Patient ID: {patientId}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-base-content/70">Select the status for this patient:</p>
              <div className="space-y-2">
                {[PATIENT_STATUS.AWAITING_CASHIER, PATIENT_STATUS.AWAITING_PAYMENT].map(status => (
                  <label key={status} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="cashierStatus"
                      className="radio radio-primary"
                      checked={selectedStatus === status}
                      onChange={() => setSelectedStatus(status)}
                    />
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button className="btn" onClick={onClose} disabled={isSending}>Cancel</button>
            <button className="btn btn-success" disabled={isSending || loadingBilling} onClick={handleConfirm}>
              {isSending ? <span className="loading loading-spinner loading-sm"></span> : (mode === 'confirm' ? 'Confirm & Send' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierActionModal;