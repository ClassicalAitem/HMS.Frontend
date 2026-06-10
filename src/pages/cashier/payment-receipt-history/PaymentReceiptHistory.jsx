import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaArrowLeft, FaFileInvoice, FaSearch } from 'react-icons/fa';
import { getAllReceiptByPatientId } from '@/services/api/billingAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';

const PaymentReceiptHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setIsLoading(true);
        const res = await getAllReceiptByPatientId(patientId);
        const receiptsData = res?.data?.data || res?.data || [];
        const receiptsList = Array.isArray(receiptsData) ? receiptsData : [];
        setReceipts(receiptsList);
      } catch (err) {
        console.error('Error fetching receipts:', err);
        setError(err.message || 'Failed to load receipts');
        toast.error('Failed to load receipt history');
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchReceipts();
    }
  }, [patientId]);

  // Filter and sort receipts
  useEffect(() => {
    let filtered = [...receipts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.paidBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-desc':
          return Number(b.amountPaid) - Number(a.amountPaid);
        case 'amount-asc':
          return Number(a.amountPaid) - Number(b.amountPaid);
        default:
          return 0;
      }
    });

    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, statusFilter, sortBy]);

  const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
  const totalReceeipts = receipts.length;

  if (isLoading) {
    return (
      <CashierLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </CashierLayout>
    );
  }

  if (error) {
    return (
      <CashierLayout>
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-error text-lg font-semibold mb-2">Error Loading Receipts</div>
          <div className="text-base-content/70 mb-4">{error}</div>
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

        <h2 className="text-2xl font-regular text-base-content mb-6">Payment Receipt History</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-base-100 rounded-xl shadow-lg p-6">
            <p className="text-sm text-base-content/60 uppercase tracking-wide mb-2">Total Receipts</p>
            <p className="text-3xl font-bold text-primary">{totalReceeipts}</p>
          </div>
          <div className="bg-base-100 rounded-xl shadow-lg p-6">
            <p className="text-sm text-base-content/60 uppercase tracking-wide mb-2">Total Amount Paid</p>
            <p className="text-3xl font-bold text-success">₦{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-base-100 rounded-xl shadow-lg p-6">
            <p className="text-sm text-base-content/60 uppercase tracking-wide mb-2">Last Payment</p>
            <p className="text-lg font-bold text-base-content">
              {receipts.length > 0 ? formatNigeriaDate(receipts[0].createdAt) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium">Search</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Reference, method..."
                  className="input input-bordered input-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
               
              </div>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium">Status</span>
              </label>
              <select
                className="select select-bordered select-sm w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {/* Sort */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium">Sort By</span>
              </label>
              <select
                className="select select-bordered select-sm w-full"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="form-control flex justify-end">
              <label className="label">
                <span className="label-text text-sm font-medium">&nbsp;</span>
              </label>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('date-desc');
                }}
                className="btn btn-outline btn-sm w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          {filteredReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-base-200/50">
                  <tr>
                    <th>Receipt Reference</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th className="text-right">Amount Paid</th>
                    <th>Payment Method</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Paid By</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt, index) => {
                    const date = formatNigeriaDate(receipt.createdAt);
                    const time = formatNigeriaTime(receipt.createdAt);

                    return (
                      <tr key={index} className="text-sm hover:bg-base-200/30">
                        <td className="font-medium">
                          <span className="text-primary">{receipt.reference}</span>
                        </td>
                        <td>{date}</td>
                        <td>{time}</td>
                        <td className="text-right font-semibold">
                          ₦ {Number(receipt.amountPaid).toLocaleString()}
                        </td>
                        <td>{receipt.paymentMethod}</td>
                        <td>{receipt.paymentDestination}</td>
                        <td>
                          <span className={`badge badge-sm ${
                            receipt.status === "paid" ? "badge-success" :
                            receipt.status === "pending" ? "badge-info" :
                            receipt.status === "approved" ? "badge-success" :
                            receipt.status === "partial" ? "badge-warning" :
                            "badge-neutral"
                          }`}>
                            {receipt.status}
                          </span>
                        </td>
                        <td>{receipt.paidBy}</td>
                        <td className="text-center">
                          <button
                            onClick={() => navigate(`/cashier/receipt-details/${receipt.id}`, { state: { receiptData: receipt } })}
                            className="btn btn-ghost btn-xs text-primary"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-base-content/50">
              <FaFileInvoice className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No receipts found</p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'This patient has no payment receipts yet'}
              </p>
            </div>
          )}

          {/* Pagination Summary */}
          {filteredReceipts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-base-200">
              <p className="text-sm text-base-content/70">
                Showing <span className="font-semibold">{filteredReceipts.length}</span> of <span className="font-semibold">{receipts.length}</span> receipts
              </p>
            </div>
          )}
        </div>
      </div>
    </CashierLayout>
  );
};

export default PaymentReceiptHistory;
