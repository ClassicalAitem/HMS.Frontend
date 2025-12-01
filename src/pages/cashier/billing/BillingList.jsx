/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react';
import { Header, DataTable } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllBillings } from '@/services/api/billingAPI';
import toast from 'react-hot-toast';

const BillingList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAllBillings();
        const data = res?.data?.data || res?.data || [];
        setBillings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('BillingList: failed to fetch billings', error);
        toast.error(error?.response?.data?.message || 'Failed to load billings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleView = (row) => {
    const id = row?.id || row?.billingId || row?._id;
    if (!id) {
      toast.error('Missing billing ID');
      return;
    }
    navigate(`/cashier/billing/${id}`);
  };

  const columns = useMemo(() => [
    { key: 'id', title: 'Billing ID', sortable: true, className: 'text-base-content font-medium' },
    { key: 'patientId', title: 'Patient ID', sortable: true, className: 'text-base-content/70' },
    { key: 'totalAmount', title: 'Total', sortable: true, className: 'text-base-content/70', render: (v) => `₦${Number(v||0).toLocaleString()}` },
    { key: 'status', title: 'Status', sortable: true, className: 'text-base-content/70' },
    { key: 'createdAt', title: 'Created At', sortable: true, className: 'text-base-content/70', render: (v) => new Date(v).toLocaleString() },
    { key: 'actions', title: 'Actions', className: 'text-base-content/70', render: (value, row) => (
      <button onClick={() => handleView(row)} className="btn btn-ghost btn-xs" title="View">
        <FaEye className="w-3 h-3" />
      </button>
    )}
  ], []);

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
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">Billing</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">View all generated bills</p>
          </div>

          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                <DataTable
                  data={billings}
                  columns={columns}
                  searchable={true}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={7}
                  maxHeight="max-h-96 sm:max-h-80 md:max-h-96 lg:max-h-80 2xl:max-h-96"
                  showEntries={true}
                  searchPlaceholder="Search billings..."
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingList;