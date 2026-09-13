import React, { useEffect, useState } from 'react';
import { getPatientBillHistory } from '@/services/api/billingAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import { FaFileInvoiceDollar } from 'react-icons/fa';

const PatientBillsHistory = ({ patientId }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchBills = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const data = await getPatientBillHistory(patientId);
        if (mounted) {
          setBills(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch bill history:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBills();
    return () => { mounted = false; };
  }, [patientId]);

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 p-6 flex justify-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-base-200 pb-3">
          <FaFileInvoiceDollar className="text-primary text-xl" />
          <h2 className="text-lg font-bold text-base-content">Billing History</h2>
        </div>

        {bills.length === 0 ? (
          <div className="py-8 text-center text-sm text-base-content/50 border border-dashed border-base-300 rounded-lg">
            No billing history found for this patient.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/50">
                  <th className="text-xs font-semibold">Date & Time</th>
                  <th className="text-xs font-semibold">Item(s) Billed</th>
                  <th className="text-xs font-semibold">Billed By</th>
                  <th className="text-xs font-semibold text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const billedBy = bill.createdBy?.name || bill.createdBy || bill.cashierName || bill.statusUser || 'System';
                  const dateStr = bill.createdAt || bill.created_at || bill.date;
                  
                  // Aggregate descriptions if there are multiple items
                  const items = Array.isArray(bill.itemDetail) 
                    ? bill.itemDetail.map(i => i.description || i.code).filter(Boolean).join(', ')
                    : (bill.description || 'General Bill');

                  return (
                    <tr key={bill.id || bill._id || Math.random().toString()} className="hover:bg-base-200/30 transition-colors">
                      <td className="whitespace-nowrap text-sm text-base-content/80">{dateStr ? formatNigeriaDateTime(dateStr) : '—'}</td>
                      <td className="text-sm max-w-xs truncate text-base-content/80" title={items}>{items || '—'}</td>
                      <td className="text-sm capitalize text-base-content/80">{billedBy}</td>
                      <td className="text-sm text-right font-medium text-base-content/80">
                        {Number(bill.totalAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientBillsHistory;
