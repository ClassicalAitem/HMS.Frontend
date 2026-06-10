import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaArrowLeft, FaFileInvoice } from 'react-icons/fa';
import { getAllBillings } from '@/services/api/billingAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';

const ReceiptDetails = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Try to get receipt from location state first
  const receiptFromState = location?.state?.receiptData || null;

  useEffect(() => {

    const loadReceipt = async () => {
      try {
        setIsLoading(true);
        
        if (receiptFromState) {
          let enrichedReceipt = { ...receiptFromState };
          
          // If receipt doesn't have items, fetch them from the associated billing
          if (!enrichedReceipt.items || enrichedReceipt.items.length === 0) {

            enrichedReceipt.items = receiptFromState?.billing?.itemDetails || [];
            try {
              // Fetch all billings to find the one associated with this receipt
              const billingsRes = await getAllBillings({ patientId: receiptFromState.patientId });
              const billings = billingsRes?.data?.data || billingsRes?.data || [];
              
              // Find billing(s) that match this receipt by checking if receipt.id is in billing.receiptIds
              const matchingBillings = billings.filter(b => 
                b.receiptIds?.includes(receiptFromState.id) || 
                b.receiptId === receiptFromState.id
              );
              
              // Combine all items from matching billings
              const allItems = matchingBillings.flatMap(b => b.itemDetails || []);
              
              if (allItems.length > 0) {
                enrichedReceipt.items = allItems;
              }
            } catch (err) {
              console.error('Error fetching billing items for receipt:', err);
              // Continue without items, they might not be available
            }
          }
          
          setReceipt(enrichedReceipt);
        } else {
          // Fallback: fetch from API if needed
          toast.error('Receipt data not found');
          setError('Receipt data not found');
        }
      } catch (err) {
        console.error('Error loading receipt:', err);
        setError(err.message || 'Failed to load receipt');
        toast.error('Failed to load receipt');
      } finally {
        setIsLoading(false);
      }
    };

    loadReceipt();
  }, [receiptId, receiptFromState]);

  if (isLoading) {
    return (
      <CashierLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </CashierLayout>
    );
  }

  if (error || !receipt) {
    return (
      <CashierLayout>
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-error text-lg font-semibold mb-2">Error Loading Receipt</div>
          <div className="text-base-content/70 mb-4">{error || 'Receipt not found'}</div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary btn-sm"
          >
            Go Back
          </button>
        </div>
      </CashierLayout>
    );
  }

  const date = formatNigeriaDate(receipt.createdAt);
  const time = formatNigeriaTime(receipt.createdAt);

  const totalAmount = (receipt.items || []).reduce((sum, item) => {
    return sum + Number(item.total || 0);
  }, 0);

  const hmoCoveredTotal = (receipt.items || []).reduce((sum, item) => {
    return sum + Number(item.hmoCovered || 0);
  }, 0);

  return (
    <CashierLayout>
      <div className="mb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-base-content/70 hover:text-primary transition-colors mb-4"
        >
          <FaArrowLeft className="w-4 h-4 mr-2" />
          Back to Patient
        </button>

        <h2 className="text-2xl font-regular text-base-content mb-6">Receipt Details</h2>

        {/* Receipt Header Card */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <FaFileInvoice className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-base-content">Receipt: {receipt.reference}</h3>
                <p className="text-sm text-base-content/60">{date} at {time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-base-content/60">Status</p>
              <span className={`badge badge-sm ${
                receipt.status === "paid" ? "badge-success" :
                receipt.status === "pending" ? "badge-info" :
                "badge-neutral"
              }`}>
                {receipt.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-base-200/50 p-4 rounded-lg">
              <p className="text-xs text-base-content/60 uppercase tracking-wide">Amount Paid</p>
              <p className="text-lg font-bold text-primary">₦{Number(receipt.amountPaid).toLocaleString()}</p>
            </div>
            <div className="bg-base-200/50 p-4 rounded-lg">
              <p className="text-xs text-base-content/60 uppercase tracking-wide">Payment Method</p>
              <p className="text-lg font-bold text-base-content">{receipt.paymentMethod}</p>
            </div>
            <div className="bg-base-200/50 p-4 rounded-lg">
              <p className="text-xs text-base-content/60 uppercase tracking-wide">Destination</p>
              <p className="text-lg font-bold text-base-content">{receipt.paymentDestination}</p>
            </div>
            <div className="bg-base-200/50 p-4 rounded-lg">
              <p className="text-xs text-base-content/60 uppercase tracking-wide">Paid By</p>
              <p className="text-lg font-bold text-base-content">{receipt.paidBy}</p>
            </div>
          </div>
        </div>

        {/* Receipt Items */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-primary mb-4">Items Paid For</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/50">
                <tr>
                  <th>Description</th>
                  <th>Code</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">HMO Covered</th>
                  <th>HMO Status</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.items || []).length > 0 ? (
                  (receipt.items || []).map((item, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="font-medium">{item.description}</td>
                      <td>{item.code}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₦ {Number(item.price).toLocaleString()}</td>
                      <td className="text-right font-semibold">₦ {Number(item.total).toLocaleString()}</td>
                      <td className="text-right text-success font-semibold">₦ {Number(item.hmoCovered || 0).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          item.hmoStatus === 'approved' ? 'badge-success' :
                          item.hmoStatus === 'partial' ? 'badge-warning' :
                          item.hmoStatus === 'rejected' ? 'badge-error' :
                          'badge-neutral'
                        }`}>
                          {item.hmoStatus || 'self-pay'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-base-content/50 py-8">
                      No items found for this receipt
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-base-200 flex justify-end">
            <div className="space-y-2 text-right">
              <div className="flex justify-between gap-12">
                <span className="text-base-content/70">Subtotal:</span>
                <span className="font-medium">₦{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-12 text-success">
                <span className="text-base-content/70">HMO Covered:</span>
                <span className="font-medium">₦{hmoCoveredTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-12 text-lg font-bold border-t border-base-200 pt-2">
                <span>Total Amount:</span>
                <span className="text-primary">₦{Number(receipt.amountPaid).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default ReceiptDetails;
