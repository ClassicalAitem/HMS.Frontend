import React, { useEffect, useState, useMemo } from 'react';
import { FaDownload, FaEye, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getAllReceipts } from '@/services/api/billingAPI';

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchReceipt = async() => {
      try {
        setLoading(true);
        // Fetch more items to support client-side pagination/filtering for now
        // In a real app with large data, this should be server-side
        const res = await getAllReceipts({limit: 100, sort: 'createdAt:desc'});

        const raw = res?.data.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw.receipts ?? []);
        const mapped = list.map((a, idx) => ({
          id: a.id,
          patient: a.billing.patient ? `${a.billing.patient.firstName} ${a.billing.patient.lastName}` : 'Unknown Patient',
          service: a.billing.itemDetails && a.billing.itemDetails.length > 0
            ? `${a.billing.itemDetails[0].description || a.billing.itemDetails[0].code} - ${a.billing.itemDetails[0].quantity}x` : 'Medical Service',
            amount: a.amountPaid,
            date: new Date(a.paidAt).toISOString().split('T')[0],
            paymentMethod: a.paymentMethod,
            status: a.status
        }))

        console.log('Fetched Receipts:', mapped);
        setTransactions(mapped);

      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReceipt()
  }, [])

  // Filter transactions based on search term
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      const searchLower = searchTerm.toLowerCase();
      return (
        txn.patient.toLowerCase().includes(searchLower) ||
        txn.service.toLowerCase().includes(searchLower) ||
        txn.paymentMethod.toLowerCase().includes(searchLower) ||
        txn.status.toLowerCase().includes(searchLower)
      );
    });
  }, [transactions, searchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const monthlyRevenue = () => {
    // Calculate monthly revenue from transactions
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(txn => new Date(txn.date).getMonth() === currentMonth && txn.status === 'paid')
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  const pendingBills = () => {
    return transactions
      .filter(txn => txn.status === 'pending')
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  const todayRevenue = () => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(txn => txn.date === today && txn.status === 'paid')
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'failed':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-base-content">Transactions</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search transactions..."
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-outline">
              <FaEye className="w-4 h-4 mr-2" />
              All
            </button>
            <button className="btn btn-primary">
              <FaDownload className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary/10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary/70 mb-1">Today's Revenue</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(todayRevenue())}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">₦</span>
            </div>
          </div>
        </div>

        <div className="bg-warning/10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning/70 mb-1">Pending Bills</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(pendingBills())}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="text-warning font-bold">!</span>
            </div>
          </div>
        </div>

        <div className="bg-success/10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success/70 mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(monthlyRevenue())}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success font-bold">₦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table Container with Scroll */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="table table-zebra w-full relative">
            <thead className="sticky top-0 bg-base-100 z-10 shadow-sm">
              <tr>
                <th className="text-base-content/70">Patient</th>
                <th className="text-base-content/70">Service</th>
                <th className="text-base-content/70">Amount</th>
                <th className="text-base-content/70">Date</th>
                <th className="text-base-content/70">Payment Method</th>
                <th className="text-base-content/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Loader
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td>
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
                    <td>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </td>
                    <td>
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </td>
                  </tr>
                ))
              ) : currentItems.length > 0 ? (
                currentItems.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="font-medium text-base-content">
                        {transaction.patient}
                      </div>
                    </td>
                    <td>
                      <div className="text-base-content/70">
                        {transaction.service}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-primary">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td>
                      <div className="text-base-content/70">
                        {formatDate(transaction.date)}
                      </div>
                    </td>
                    <td>
                      <div className="text-base-content/70">
                        {transaction.paymentMethod}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-base-content/50">
                    No transactions found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <div className="text-sm text-base-content/70">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} entries
          </div>
          <div className="join">
            <button 
              className="join-item btn btn-sm"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              // Show limited page numbers logic could go here for many pages
              // For now showing all pages or a simple range
              if (totalPages > 5 && (i + 1 !== 1 && i + 1 !== totalPages && Math.abs(currentPage - (i + 1)) > 1)) {
                 if (i + 1 === 2 || i + 1 === totalPages - 1) return <button key={i} className="join-item btn btn-sm btn-disabled">...</button>;
                 return null;
              }
              return (
                <button
                  key={i}
                  className={`join-item btn btn-sm ${currentPage === i + 1 ? 'btn-active' : ''}`}
                  onClick={() => paginate(i + 1)}
                >
                  {i + 1}
                </button>
              );
            })}
            
            <button 
              className="join-item btn btn-sm"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
