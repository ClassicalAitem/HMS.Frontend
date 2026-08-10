/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { useParams } from 'react-router-dom';
import { getBillingById } from '@/services/api/billingAPI';
import toast from 'react-hot-toast';

const BillingDetails = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);
  const { billingId } = useParams();

  useEffect(() => {
    const load = async () => {
      if (!billingId) {
        toast.error('Missing billing ID');
        return;
      }
      setLoading(true);
      try {
        const res = await getBillingById(billingId);
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
  }, [billingId]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <CashierLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary">Billing Details</h1>
        <p className="text-sm text-base-content/70">Details for billing ID {billingId}</p>
      </div>

      <div className="w-full card bg-base-100 shadow-xl">
        <div className="card-body p-4 sm:p-6">
          {loading && <div className="text-base-content/70">Loading...</div>}
          {!loading && billing && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-base-content/70">Billing ID</p>
                  <p className="text-base font-semibold">{billing.id || billing.billingId || billing._id}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Patient ID</p>
                  <p className="text-base font-semibold">{billing.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Payment Method</p>
                  <p className="text-base font-semibold">{billing.paymentMethod || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70">Status</p>
                  <p className="text-base font-semibold">{billing.status || '—'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(billing.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.category}</td>
                          <td>{it.description}</td>
                          <td className="text-right">₦{Number(it.rate || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="p-4 rounded-lg bg-base-200">
                  <p className="text-sm text-base-content/70">Total Amount</p>
                  <p className="text-2xl font-bold">₦{Number(billing.totalAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !billing && (
            <div className="text-base-content/70">No billing data found.</div>
          )}
        </div>
      </div>
    </CashierLayout>
  );
};

export default BillingDetails;