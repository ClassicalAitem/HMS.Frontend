import React, { useState, useEffect } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { FaUsers, FaFileInvoiceDollar } from 'react-icons/fa';
import { GoCreditCard } from "react-icons/go";
import { LuUser } from "react-icons/lu";
import cashierData from '@/data/cashierData.json';
import StatCard from '@/components/cashier/dashboard/StatCard';
import RecentActivity from '@/components/cashier/dashboard/RecentActivity';
import { Link } from 'react-router-dom';

const CashierDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    setDashboardData(cashierData.dashboard);
  }, []);

  return (
    <CashierLayout>
      {/* Page Header: actions */}
      <div className="flex items-center justify-between mb-2 2xl:mb-6">
        <div className="mb-2">
          <h1 className="text-2xl font-regular text-primary">Welcome, Cashier John!</h1>
          <p className="text-xs text-base-content/70">Manage hospital finances, process payments, and track transactions.</p>
        </div>
        <Link to="/cashier/patients" className=" hidden btn btn-outline btn-sm">
          All Patients
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-2 2xl:gap-6 mb-4 2xl:mb-8 md:grid-cols-2">
        <StatCard
          title="Today's Check-ins"
          value={`${dashboardData?.todayCheckIns ?? 40} Patients`}
          subtitle={undefined}
          icon={LuUser}
          to="/cashier/patients"
        />
        <StatCard
          title="Pending Invoices"
          value={dashboardData?.pendingInvoices ?? 56}
          subtitle={`${dashboardData?.overdueInvoices ?? 3} overdue`}
          icon={GoCreditCard}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity
        items={dashboardData?.recentActivity || []}
        lastUpdated={dashboardData?.lastUpdated || '1/1/01 12:00AM'}
      />
    </CashierLayout>
  );
};

export default CashierDashboard;
