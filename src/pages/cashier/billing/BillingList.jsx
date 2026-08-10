/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/common';
import { CashierLayout } from '@/layouts/cashier';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllBillings } from '@/services/api/billingAPI';
import toast from 'react-hot-toast';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';

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
    { key: 'createdAt', title: 'Created At', sortable: true, className: 'text-base-content/70', render: (v) => formatNigeriaDateTime(v) },
    { key: 'actions', title: 'Actions', className: 'text-base-content/70', render: (value, row) => (
      <button onClick={() => handleView(row)} className="btn btn-ghost btn-xs" title="View">
        <FaEye className="w-3 h-3" />
      </button>
    )}
  ], []);

  return (
    <CashierLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary">Billing</h1>
        <p className="text-sm text-base-content/70">View all generated bills</p>
      </div>

      <div className="card bg-base-100 shadow-xl w-full">
        <div className="card-body p-2 sm:p-4">
          <div className="overflow-x-auto">
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
    </CashierLayout>
  );
};

export default BillingList;