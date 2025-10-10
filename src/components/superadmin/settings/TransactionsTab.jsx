import React from 'react';
import { FaDownload, FaEye } from 'react-icons/fa';

const TransactionsTab = () => {
  // Sample data for transactions
  const transactions = [
    {
      id: 1,
      patient: 'John Doe',
      service: 'Consultation',
      amount: 5000,
      date: '2024-01-15',
      paymentMethod: 'Cash',
      status: 'Completed'
    },
    {
      id: 2,
      patient: 'Jane Smith',
      service: 'Blood Test',
      amount: 15000,
      date: '2024-01-15',
      paymentMethod: 'Card',
      status: 'Completed'
    },
    {
      id: 3,
      patient: 'Mike Johnson',
      service: 'X-Ray',
      amount: 25000,
      date: '2024-01-14',
      paymentMethod: 'Insurance',
      status: 'Pending'
    },
    {
      id: 4,
      patient: 'Sarah Wilson',
      service: 'Surgery',
      amount: 150000,
      date: '2024-01-14',
      paymentMethod: 'Bank Transfer',
      status: 'Completed'
    },
    {
      id: 5,
      patient: 'David Brown',
      service: 'Emergency Care',
      amount: 30000,
      date: '2024-01-13',
      paymentMethod: 'Cash',
      status: 'Completed'
    }
  ];

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
      case 'Completed':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Failed':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-base-content">Transactions</h2>
        <div className="flex space-x-3">
          <button className="btn btn-outline">
            <FaEye className="w-4 h-4 mr-2" />
            All transactions
          </button>
          <button className="btn btn-primary">
            <FaDownload className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary/10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary/70 mb-1">Today's Revenue</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(125000)}</p>
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
              <p className="text-2xl font-bold text-warning">{formatCurrency(45000)}</p>
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
              <p className="text-2xl font-bold text-success">{formatCurrency(2500000)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success font-bold">₦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
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
            {transactions.map((transaction) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTab;
