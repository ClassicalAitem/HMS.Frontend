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
import { getAllBillings, getAllReceipts } from '@/services/api/billingAPI';

const CashierDashboard = () => {
  console.error("🎯 CashierDashboard: Component rendering - ERROR level!");
  console.log("🎯 CashierDashboard: Component rendering - LOG level!");
  console.warn("🎯 CashierDashboard: Component rendering - WARN level!");
  const [dashboardData, setDashboardData] = useState([]);
  const { user } = useAppSelector((state) => state.auth);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalPendingInvoice, setTotalPendingInvoice] = useState(0);
  const [billingData, setBillingData] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setDashboardData(billingData);
  }, [billingData]);

  const {patients, isLoading, error} = useAppSelector((state) =>  state.patients)


  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        const res = await getMetrics();
        const data = res?.data || {};
        // const count = Number(data.totalPatients) || 0;
        // if (mounted) setTotalPatients(count);
        const invoiceCount = Number(data.totalPendingReceipt) || 0;
        if(mounted) setTotalPendingInvoice(invoiceCount)
        const filteredPatient = patients.filter(
          (p) => p.status === 'awaiting_cashier' || p.status === 'awaiting_payment'
        );

        console.log({filteredPatient, patients});
        const countPatient = filteredPatient.length || 0;
        if (mount) setTotalPatients(countPatient)
      } catch (e) {
        if (mounted) setTotalPatients(0);
        if (mounted) setTotalPatients(0)
      } finally {
        if (mounted) setMetricsLoading(false);
      }
    };
    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch billing data for recent activity
  useEffect(() => {
    let mounted = true;
    const fetchBillingData = async () => {
      try {
        setBillingLoading(true);
        const response = await getAllReceipts({ limit: 10, sort: 'createdAt:desc' });

        if (response.data?.success && mounted) {
          const receiptRecords = response.data.data || [];

          // Transform receipt data to match activity item format
          const transformedActivities = receiptRecords.map((receipt, index) => {
            // Get the first item detail or use a default description
            const firstItem = receipt.billing.itemDetails?.[0];
            const serviceDescription = firstItem
              ? `${firstItem.description || firstItem.code} - ${firstItem.quantity}x`
              : 'Medical Service';

            // Format amount with currency
            const formattedAmount = `₦${Number(receipt.amountPaid || 0).toLocaleString()}`;

            // Format date/time
            const createdDate = new Date(receipt.createdAt);
            const timeString = createdDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            return {
              id: receipt.id || index,
              patientName: receipt.billing.patient ? `${receipt.billing.patient.firstName} ${receipt.billing.patient.lastName}` : 'N/A',
              patientPhoto: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${20 + index}.jpg`,
              service: serviceDescription,
              status: receipt.status,
              paidBy: receipt.paidBy,
              amount: formattedAmount,
              time: timeString,
              createdAt: receipt.createdAt
            };
          });

          setBillingData(transformedActivities);
          setLastUpdated(new Date().toLocaleString());
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        // if (mounted) {
        //   // Fallback to mock data if API fails
        //   setBillingData(dashboardData?.recentActivity || []);
        //   setLastUpdated(dashboardData?.lastUpdated || '1/1/01 12:00AM');
        // }
      } finally {
        if (mounted) setBillingLoading(false);
      }
    };


    fetchBillingData();


    return () => {
      mounted = false;
    };
  }, [user]);

  console.log(dashboardData);


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
          value={totalPendingInvoice}
          subtitle={undefined}
          icon={GoCreditCard}
          loading={!dashboardData}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity
        items={dashboardData || []}
        lastUpdated={lastUpdated || '1/1/01 12:00AM'}
        loading={!dashboardData}
      />
    </CashierLayout>
  );
};

export default CashierDashboard;
