import React, { useState, useEffect } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { FaUsers, FaFileInvoiceDollar } from 'react-icons/fa';
import { GoCreditCard } from "react-icons/go";
import { LuUser } from "react-icons/lu";
import cashierData from '@/data/cashierData.json';
import StatCard from '@/components/cashier/dashboard/StatCard';
import RecentActivity from '@/components/cashier/dashboard/RecentActivity';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { getMetrics } from '@/services/api/metricsAPI';

const CashierDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const { user } = useAppSelector((state) => state.auth);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);

  useEffect(() => {
    setDashboardData(cashierData.dashboard);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        const res = await getMetrics();
        const data = res?.data || {};
        const count = Number(data.totalPatients) || 0;
        if (mounted) setTotalPatients(count);
      } catch (e) {
        if (mounted) setTotalPatients(0);
      } finally {
        if (mounted) setMetricsLoading(false);
      }
    };
    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CashierLayout>
      {/* Page Header: actions */}
      <div className="flex items-center justify-between mb-2 2xl:mb-6">
        <div className="mb-2">
          <h1 className="text-lg 2xl:text-2xl font-semibold 2xl:font-regular text-primary">{`Welcome, Cashier: ${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}`}</h1>
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
          value={`${(totalPatients || dashboardData?.todayCheckIns || 0)} Patients`}
          subtitle={undefined}
          icon={LuUser}
          to="/cashier/patients"
          loading={metricsLoading}
        />
        <StatCard
          title="Pending Invoices"
          value={dashboardData?.pendingInvoices ?? 56}
          subtitle={`${dashboardData?.overdueInvoices ?? 3} overdue`}
          icon={GoCreditCard}
          loading={!dashboardData}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity
        items={dashboardData?.recentActivity || []}
        lastUpdated={dashboardData?.lastUpdated || '1/1/01 12:00AM'}
        loading={!dashboardData}
      />
    </CashierLayout>
  );
};

export default CashierDashboard;
