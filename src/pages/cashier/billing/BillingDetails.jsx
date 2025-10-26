/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
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
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">Billing Details</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">Details for billing ID {billingId}</p>
          </div>

          <div className="w-full shadow-xl card bg-base-100">
            <div className="p-6 card-body">
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
        </div>
      </div>
    </div>
  );
};

export default BillingDetails;