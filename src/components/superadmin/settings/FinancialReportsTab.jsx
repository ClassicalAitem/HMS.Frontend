import React, { useState } from 'react';
import { FaFileAlt, FaChartBar } from 'react-icons/fa';

const FinancialReportsTab = () => {
  const [reportType, setReportType] = useState('');
  const [dataRange, setDataRange] = useState('');
  const [analyticsType, setAnalyticsType] = useState('');
  const [period, setPeriod] = useState('');

  const handleGenerateReport = () => {
    console.log('Generate report:', { reportType, dataRange });
    // TODO: Implement report generation
  };

  const handleViewAnalytics = () => {
    console.log('View analytics:', { analyticsType, period });
    // TODO: Implement analytics view
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-base-content mb-6">Financial Reports</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Reports Section */}
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
              <FaFileAlt className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-base-content">Revenue Reports</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select report type</option>
                <option value="daily">Daily Revenue Report</option>
                <option value="weekly">Weekly Revenue Report</option>
                <option value="monthly">Monthly Revenue Report</option>
                <option value="yearly">Yearly Revenue Report</option>
                <option value="custom">Custom Period Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Data Range
              </label>
              <select
                value={dataRange}
                onChange={(e) => setDataRange(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select data range</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              className="btn btn-primary w-full"
              disabled={!reportType || !dataRange}
            >
              <FaFileAlt className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Payment Analytics Section */}
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-success/10">
              <FaChartBar className="w-5 h-5 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-base-content">Payment Analytics</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Analytics Type
              </label>
              <select
                value={analyticsType}
                onChange={(e) => setAnalyticsType(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select analytics type</option>
                <option value="payment-methods">Payment Methods Analysis</option>
                <option value="service-revenue">Service Revenue Analysis</option>
                <option value="patient-spending">Patient Spending Analysis</option>
                <option value="trend-analysis">Revenue Trend Analysis</option>
                <option value="comparison">Period Comparison</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select period</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>

            <button
              onClick={handleViewAnalytics}
              className="btn btn-success w-full"
              disabled={!analyticsType || !period}
            >
              <FaChartBar className="w-4 h-4 mr-2" />
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Sample Report Data */}
      <div className="mt-8 p-6 bg-base-200 rounded-lg">
        <h4 className="text-lg font-semibold text-base-content mb-4">Recent Reports</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-base-100 p-4 rounded-lg">
            <h5 className="font-medium text-base-content">Daily Revenue Report</h5>
            <p className="text-sm text-base-content/70">Generated: Jan 15, 2024</p>
            <p className="text-primary font-semibold">₦125,000</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg">
            <h5 className="font-medium text-base-content">Weekly Payment Analysis</h5>
            <p className="text-sm text-base-content/70">Generated: Jan 14, 2024</p>
            <p className="text-success font-semibold">₦875,000</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg">
            <h5 className="font-medium text-base-content">Monthly Summary</h5>
            <p className="text-sm text-base-content/70">Generated: Jan 1, 2024</p>
            <p className="text-primary font-semibold">₦2,500,000</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportsTab;
