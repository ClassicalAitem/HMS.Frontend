import React, { useEffect, useState } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { useParams, useNavigate } from 'react-router-dom';
import { getBillingById } from '@/services/api/billingAPI';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';
import KolakLoader from '@/components/common/KolakLoader';

const BillingDetails = () => {
  const { id, billingId } = useParams();
  const effectiveBillingId = id || billingId;
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!effectiveBillingId) {
        toast.error('Missing billing ID');
        return;
      }
      setLoading(true);
      try {
        const res = await getBillingById(effectiveBillingId);
        const data = res?.data?.data || res?.data;
        setBilling(data);
      } catch (error) {
        console.error('BillingDetails: failed to fetch billing', error);
        toast.error(error?.response?.data?.message || 'Failed to load billing');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [effectiveBillingId]);

  return (
    <CashierLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" title="Go back">
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Billing Details</h1>
          <p className="text-sm text-base-content/70">Details for billing ID {effectiveBillingId}</p>
        </div>
      </div>

      <div className="w-full card bg-base-100 shadow-xl min-w-0">
        <div className="card-body p-4 sm:p-6 min-w-0">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <KolakLoader size="lg" />
            </div>
          ) : billing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-base-content/70">Billing ID</p>
                  <p className="text-base font-semibold font-mono">{billing.id || billing.billingId || billing._id}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Patient ID</p>
                  <p className="text-base font-semibold font-mono">{billing.patientId || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Payment Method</p>
                  <p className="text-base font-semibold">{billing.paymentMethod || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Status</p>
                  <p className="text-base font-semibold capitalize">{billing.status || (billing.isCleared ? 'Cleared' : 'Pending')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                <div className="overflow-x-auto w-full min-w-0">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(billing.items || billing.itemDetails || []).map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.category || it.code || '—'}</td>
                          <td>{it.description || '—'}</td>
                          <td className="text-right">₦{Number(it.rate || it.total || it.price || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="p-4 rounded-lg bg-base-200">
                  <p className="text-sm text-base-content/70">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">₦{Number(billing.totalAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-base-content/60">
              No billing information found.
            </div>
          )}
        </div>
      </div>
    </CashierLayout>
  );
};

export default BillingDetails;
