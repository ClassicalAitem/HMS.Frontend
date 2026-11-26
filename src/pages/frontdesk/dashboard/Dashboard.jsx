import React, { useState, useEffect, useCallback } from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { 
  RecentlyAttendedPatients
} from '@/components/frontdesk';
import KolakLoader from '@/components/common/KolakLoader';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { 
  FaUserPlus, 
  FaCalendarPlus, 
  FaUsers, 
  FaUserCheck, 
  FaCalendarCheck, 
  FaHospitalUser,
  FaReceipt
} from 'react-icons/fa';
import { RiRefreshLine } from 'react-icons/ri';
import metricsAPI from '@/services/api/metricsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const FrontdeskDashboard = () => {
  const { user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [statsLoading, setStatsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    registeredToday: 0,
    upcomingAppointments: 0,
    attendedToday: 0,
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await metricsAPI.getOverallMetrics({ type: 'frontdesk' });
      const data = res?.data || res;
      if (data) {
        setMetrics({
          totalPatients: data.totalPatients || 0,
          registeredToday: data.registeredToday || 0,
          attendedToday: data.attendedToday || 0,
          upcomingAppointments: data.upcomingAppointments || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load frontdesk dashboard metrics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const officerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Front Desk Officer';
  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <FrontdeskLayout>
      {authLoading && <KolakLoader fullscreen />}

      <div className="space-y-6">
        {/* Modern Welcome Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-md border border-emerald-700/30">
          {/* Subtle Decorative Pattern */}
          <div className="absolute -right-8 -bottom-8 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute right-32 -top-12 w-40 h-40 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-sm bg-white/15 text-white border-none font-bold uppercase tracking-wider text-[11px] px-2.5 py-1">
                  Front Desk Operations
                </span>
                <span className="text-xs text-emerald-200/90 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live System Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Welcome, {officerName}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
                {currentDateStr} · Manage patient check-ins, registrations, schedule doctor appointments, and coordinate hospital intake.
              </p>
            </div>

            {/* Fast Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link 
                to="/frontdesk/registration" 
                className="btn btn-sm bg-white hover:bg-emerald-50 text-emerald-900 font-bold border-none shadow-sm gap-1.5"
              >
                <FaUserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>New Patient</span>
              </Link>
              <Link 
                to="/frontdesk/appointments" 
                className="btn btn-sm btn-outline border-white/40 text-white hover:bg-white/10 hover:border-white font-semibold gap-1.5"
              >
                <FaCalendarPlus className="w-3.5 h-3.5" />
                <span>Appointments</span>
              </Link>
              <Link 
                to="/frontdesk/payment-records" 
                className="btn btn-sm btn-outline border-white/40 text-white hover:bg-white/10 hover:border-white font-semibold gap-1.5"
              >
                <FaReceipt className="w-3.5 h-3.5" />
                <span>Payment Records</span>
              </Link>
              <button
                type="button"
                onClick={fetchDashboardStats}
                disabled={statsLoading}
                className="btn btn-sm btn-circle btn-ghost text-white/80 hover:text-white hover:bg-white/10"
                title="Refresh stats"
              >
                <RiRefreshLine className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Patients */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Total Patients
              </span>
              <h3 className="text-2xl font-black text-base-content mt-1">
                {statsLoading ? '—' : metrics.totalPatients.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Primary & dependants</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FaUsers className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Registered Today */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Registered Today
              </span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {statsLoading ? '—' : metrics.registeredToday.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">New intake records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <FaUserCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Upcoming Appointments */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Appointments
              </span>
              <h3 className="text-2xl font-black text-info mt-1">
                {statsLoading ? '—' : metrics.upcomingAppointments.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Active doctor bookings</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0">
              <FaCalendarCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Attended Today */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Attended Today
              </span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {statsLoading ? '—' : metrics.attendedToday.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Checked-in & attended</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <FaHospitalUser className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Recently Attended To Patients Table */}
        <div className="w-full">
          <RecentlyAttendedPatients />
        </div>
      </div>
    </FrontdeskLayout>
  );
};

export default FrontdeskDashboard;
