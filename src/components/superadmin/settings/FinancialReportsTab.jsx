import React, { useEffect, useState, useMemo } from 'react';
import {
  FaFileAlt,
  FaChartBar,
  FaDownload,
  FaMoneyBillWave,
  FaCreditCard,
  FaCalendarAlt,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaChartPie,
  FaSyncAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAllReceipts, getAllBillings } from '@/services/api/billingAPI';
import { exportRowsToCsv } from '@/pages/superadmin/reports/reportUtils';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { showErrorToast } from '@/utils/errorHandler';

const FinancialReportsTab = () => {
  const [receipts, setReceipts] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptsRes, billingsRes] = await Promise.all([
        getAllReceipts({ sort: 'createdAt:desc' }),
        getAllBillings(),
      ]);

      const rawReceipts = receiptsRes?.data?.data ?? receiptsRes?.data ?? [];
      const listReceipts = Array.isArray(rawReceipts)
        ? rawReceipts
        : rawReceipts.receipts ?? [];
      setReceipts(listReceipts);

      const rawBillings = billingsRes?.data?.data ?? billingsRes?.data ?? [];
      const listBillings = Array.isArray(rawBillings)
        ? rawBillings
        : rawBillings.billings ?? [];
      setBillings(listBillings);
    } catch (error) {
      showErrorToast(error, 'Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter receipts by timeframe
  const filteredReceipts = useMemo(() => {
    if (timeframe === 'all') return receipts;
    const now = Date.now();
    const days =
      timeframe === 'today'
        ? 1
        : timeframe === 'last-7-days'
        ? 7
        : timeframe === 'last-30-days'
        ? 30
        : timeframe === 'last-90-days'
        ? 90
        : 365;

    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return receipts.filter((r) => {
      const date = new Date(r.paidAt || r.createdAt).getTime();
      return date >= cutoff;
    });
  }, [receipts, timeframe]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCollected = filteredReceipts.reduce(
      (sum, r) => sum + (Number(r.amountPaid) || 0),
      0
    );

    const totalBilled = billings.reduce(
      (sum, b) => sum + (Number(b.totalAmount) || 0),
      0
    );

    const totalOutstanding = billings.reduce(
      (sum, b) => sum + (Number(b.outstandingBill) || 0),
      0
    );

    const collectionRate =
      totalBilled > 0
        ? Math.min(100, Math.round(((totalBilled - totalOutstanding) / totalBilled) * 100))
        : 100;

    // Payment methods breakdown
    const methods = { Cash: 0, POS: 0, Transfer: 0, HMO: 0, Other: 0 };
    filteredReceipts.forEach((r) => {
      const m = String(r.paymentMethod || '').toUpperCase();
      const amt = Number(r.amountPaid) || 0;
      if (m.includes('CASH')) methods.Cash += amt;
      else if (m.includes('POS')) methods.POS += amt;
      else if (m.includes('TRANSFER') || m.includes('BANK')) methods.Transfer += amt;
      else if (m.includes('HMO') || m.includes('INSURANCE')) methods.HMO += amt;
      else methods.Other += amt;
    });

    // Categories breakdown
    const categoriesMap = {
      Pharmacy: 0,
      Laboratory: 0,
      Consultation: 0,
      Surgery: 0,
      Admission: 0,
      Other: 0,
    };

    billings.forEach((b) => {
      const items = b.itemDetails || [];
      const amt = Number(b.totalAmount) || 0;
      if (!items.length) {
        categoriesMap.Other += amt;
      } else {
        const itemCat = String(items[0]?.category || '').toLowerCase();
        const desc = String(items[0]?.description || items[0]?.code || '').toLowerCase();
        if (itemCat.includes('pharm') || desc.includes('drug') || desc.includes('med'))
          categoriesMap.Pharmacy += amt;
        else if (itemCat.includes('lab') || desc.includes('test') || desc.includes('scan'))
          categoriesMap.Laboratory += amt;
        else if (itemCat.includes('surg') || desc.includes('theatre') || desc.includes('op'))
          categoriesMap.Surgery += amt;
        else if (itemCat.includes('admiss') || desc.includes('ward') || desc.includes('bed'))
          categoriesMap.Admission += amt;
        else if (itemCat.includes('consult'))
          categoriesMap.Consultation += amt;
        else categoriesMap.Other += amt;
      }
    });

    return {
      totalCollected,
      totalBilled,
      totalOutstanding,
      collectionRate,
      methods,
      categoriesMap,
    };
  }, [filteredReceipts, billings]);

  const handleExportReport = () => {
    if (!filteredReceipts.length) {
      toast.error('No transaction data to export.');
      return;
    }

    const columns = [
      { key: 'receiptNumber', label: 'Receipt ID' },
      { key: 'patientName', label: 'Patient Name' },
      { key: 'amountPaid', label: 'Amount (₦)' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paidAt', label: 'Date Paid' },
      { key: 'cashier', label: 'Cashier / Officer' },
    ];

    const rows = filteredReceipts.map((r, i) => ({
      receiptNumber: r.receiptNumber || r.id || `RCPT-${i + 1}`,
      patientName: r.billing?.patient
        ? `${r.billing.patient.firstName || ''} ${r.billing.patient.lastName || ''}`.trim()
        : r.patientName || 'Medical Patient',
      amountPaid: r.amountPaid,
      paymentMethod: r.paymentMethod || 'Cash',
      paidAt: r.paidAt ? formatNigeriaDate(r.paidAt) : '—',
      cashier: r.cashierName || r.attendedBy || 'Cashier Desk',
    }));

    exportRowsToCsv(rows, columns, `revenue_report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Financial revenue report exported successfully!');
  };

  if (loading) {
    return (
      <div className="bg-base-100 rounded-2xl border border-base-200 p-8 flex flex-col items-center justify-center min-h-[350px]">
        <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
        <p className="text-sm font-medium text-base-content/60">Compiling financial analytics & ledger records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
            <FaChartBar className="text-primary" /> Financial Reports & Revenue Analytics
          </h2>
          <p className="text-xs text-base-content/60 mt-0.5">
            Real-time revenue reconciliation from cashier receipts, bills, and HMO claims
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-base-200/70 p-1 rounded-xl border border-base-300/60 text-xs font-semibold">
            {['all', 'today', 'last-7-days', 'last-30-days', 'last-90-days'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  timeframe === tf
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                }`}
              >
                {tf.replace(/-/g, ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="btn btn-primary btn-sm rounded-xl px-4 shadow-sm shadow-primary/20"
          >
            <FaDownload className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Collected Collections
            </span>
            <span className="text-2xl font-black text-primary">
              ₦{metrics.totalCollected.toLocaleString()}
            </span>
            <span className="text-[11px] text-base-content/50 block mt-1">
              {filteredReceipts.length} verified receipts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            <FaMoneyBillWave />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Gross Invoiced Total
            </span>
            <span className="text-2xl font-black text-base-content">
              ₦{metrics.totalBilled.toLocaleString()}
            </span>
            <span className="text-[11px] text-base-content/50 block mt-1">
              {billings.length} total hospital bills
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold">
            <FaCreditCard />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Outstanding Receivables
            </span>
            <span className="text-2xl font-black text-error">
              ₦{metrics.totalOutstanding.toLocaleString()}
            </span>
            <span className="text-[11px] text-error/70 block mt-1">Pending patient balances</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center text-xl font-bold">
            <FaHandHoldingUsd />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Clearance / Collection Rate
            </span>
            <span className="text-2xl font-black text-success">
              {metrics.collectionRate}%
            </span>
            <span className="text-[11px] text-success/70 block mt-1">Billed amounts realized</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center text-xl font-bold">
            <FaCheckCircle />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channels */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <FaCreditCard className="text-primary w-4 h-4" /> Collections by Payment Method
            </h3>
            <span className="text-xs text-base-content/50 font-mono">Real-time breakdown</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {Object.entries(metrics.methods).map(([method, amount]) => {
              const pct =
                metrics.totalCollected > 0
                  ? Math.round((amount / metrics.totalCollected) * 100)
                  : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-base-content">{method}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base-content">
                        ₦{amount.toLocaleString()}
                      </span>
                      <span className="badge badge-sm badge-ghost text-[10px]">{pct}%</span>
                    </div>
                  </div>
                  <progress
                    className="progress progress-primary w-full h-2 rounded-full"
                    value={pct}
                    max="100"
                  ></progress>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Service Breakdown */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <FaChartPie className="text-secondary w-4 h-4" /> Invoiced Volume by Department
            </h3>
            <span className="text-xs text-base-content/50 font-mono">Service charges</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {Object.entries(metrics.categoriesMap).map(([category, amount]) => {
              const pct =
                metrics.totalBilled > 0
                  ? Math.round((amount / metrics.totalBilled) * 100)
                  : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-base-content">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base-content">
                        ₦{amount.toLocaleString()}
                      </span>
                      <span className="badge badge-sm badge-ghost text-[10px]">{pct}%</span>
                    </div>
                  </div>
                  <progress
                    className="progress progress-secondary w-full h-2 rounded-full"
                    value={pct}
                    max="100"
                  ></progress>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportsTab;
