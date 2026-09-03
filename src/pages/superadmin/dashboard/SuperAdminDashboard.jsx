import React, { useState, useEffect, useMemo } from 'react';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { Link } from 'react-router-dom';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { LuUserRoundCheck } from 'react-icons/lu';
import { MdOutlineStore } from 'react-icons/md';
import { FiFileText, FiArrowUpRight, FiSettings, FiUserPlus, FiActivity } from 'react-icons/fi';
import { FaCalendarAlt, FaHospital, FaClipboardCheck, FaUsersCog } from 'react-icons/fa';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchMetrics } from '../../../store/slices/metricsSlice';

const SuperAdminDashboard = () => {

  
  const dispatch = useAppDispatch();
  const { metrics, isLoading, error } = useAppSelector((state) => state.metrics);

  useEffect(() => {
    dispatch(fetchMetrics());
  }, [dispatch]);

  const getCurrentDate = () => {
    return formatNigeriaDate(new Date());
  };

  // Skeleton loader component for metrics cards
  const MetricsSkeleton = () => (
    <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
      <div className="flex flex-col justify-between items-center">
        <div className="flex justify-start items-center rounded-lg bg-primary/10">
          <div className="w-6 h-6 bg-base-300 animate-pulse rounded"></div>
        </div>
        <div className="flex flex-col justify-center items-center mt-2">
          <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
          <div className="h-8 w-16 bg-base-300 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );

  const operationalActions = [
    { label: 'Patient Directory', description: 'Review patients and dependants', path: '/superadmin/patients/Patients', icon: FaHospital, tone: 'text-primary bg-primary/10' },
    { label: 'Manage Users', description: 'Control staff access and roles', path: '/superadmin/users', icon: FaUsersCog, tone: 'text-secondary bg-secondary/10' },
    { label: 'Appointments', description: 'Review the hospital schedule', path: '/superadmin/appointments', icon: FaCalendarAlt, tone: 'text-info bg-info/10' },
    { label: 'Registration', description: 'Register a new patient', path: '/superadmin/registration', icon: FiUserPlus, tone: 'text-success bg-success/10' },
    { label: 'Generate Reports', description: 'Export operational insights', path: '/superadmin/reports', icon: FaClipboardCheck, tone: 'text-warning bg-warning/10' },
    { label: 'System Settings', description: 'Configure hospital operations', path: '/superadmin/settings', icon: FiSettings, tone: 'text-error bg-error/10' },
  ];

  return (
    <SuperAdminLayout>
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-lg font-medium text-primary 2xl:text-2xl">Super Admin Dashboard</h1>
            <p className="text-xs text-base-content/70 2xl:text-base">
              Welcome back, Super Admin. Here's a summary of your hospital's current status for {getCurrentDate()}.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>Error loading metrics: {error}</span>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Patients */}
            {isLoading ? (
              <MetricsSkeleton />
            ) : (
              <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
                <div className="flex flex-col justify-between items-center">
                  <div className="flex justify-start items-center rounded-lg bg-primary/10">
                    <PiUsersThreeDuotone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-base-content/70">Total Patients</p>
                    <p className="mt-1 text-2xl font-semibold text-content">
                      {metrics?.totalPatients ? metrics.totalPatients.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Staff */}
            {isLoading ? (
              <MetricsSkeleton />
            ) : (
              <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
                <div className="flex flex-col justify-between items-center">
                  <div className="flex justify-start items-center rounded-lg bg-primary/10">
                    <LuUserRoundCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-base-content/70">Total Staff</p>
                    <p className="mt-1 text-2xl font-semibold text-content">
                      {metrics?.totalActiveStaff ? metrics.totalActiveStaff.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Departments */}
            {isLoading ? (
              <MetricsSkeleton />
            ) : (
              <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
                <div className="flex flex-col justify-between items-center">
                  <div className="flex justify-start items-center rounded-lg bg-primary/10">
                    <MdOutlineStore className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-base-content/70">Total Departments</p>
                    <p className="mt-1 text-2xl font-semibold text-content">
                      {metrics?.totalDepartments ? metrics.totalDepartments.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Admitted Patients */}
            {isLoading ? (
              <MetricsSkeleton />
            ) : (
              <div className="p-6 rounded-lg border shadow-lg bg-base-100 border-content/40">
                <div className="flex flex-col justify-between items-center">
                  <div className="flex justify-start items-center rounded-lg bg-primary/10">
                    <FiFileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-base-content/70">Admitted Patients</p>
                    <p className="mt-1 text-2xl font-semibold text-content">
                      {metrics?.totalAdmittedPatients ? metrics.totalAdmittedPatients.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>
            )}



          </div>
          

          {/* Operations command center */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="p-6 rounded-2xl border border-base-200 shadow-lg bg-base-100">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Command Center</p>
                  <h2 className="mt-1 text-xl font-bold text-base-content">Keep the hospital moving</h2>
                  <p className="mt-1 text-sm text-base-content/60">Jump into the workflows that need attention today.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 text-success text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Systems operational
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {operationalActions.map(({ label, description, path, icon: Icon, tone }) => (
                  <Link key={path} to={path} className="group flex items-center gap-3 p-4 rounded-xl border border-base-200 hover:border-primary/40 hover:bg-base-200/50 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-base-content">{label}</p>
                      <p className="text-xs text-base-content/55 truncate">{description}</p>
                    </div>
                    <FiArrowUpRight className="w-4 h-4 text-base-content/30 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="relative overflow-hidden p-6 rounded-2xl bg-neutral text-neutral-content shadow-lg">
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full border-[20px] border-white/10" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-content/70">
                  <FiActivity className="w-4 h-4" /> Hospital pulse
                </div>
                <h2 className="mt-3 text-2xl font-bold">Today at a glance</h2>
                <p className="mt-1 text-sm text-neutral-content/65">A quick operational readout for {getCurrentDate()}.</p>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-3 rounded-xl bg-white/10"><p className="text-2xl font-black">{metrics?.totalPatients || 0}</p><p className="text-xs text-neutral-content/65">Patients in system</p></div>
                  <div className="p-3 rounded-xl bg-white/10"><p className="text-2xl font-black">{metrics?.totalActiveStaff || 0}</p><p className="text-xs text-neutral-content/65">Active staff</p></div>
                  <div className="p-3 rounded-xl bg-white/10"><p className="text-2xl font-black">{metrics?.totalDepartments || 0}</p><p className="text-xs text-neutral-content/65">Departments</p></div>
                  <div className="p-3 rounded-xl bg-white/10"><p className="text-2xl font-black">{metrics?.totalAdmittedPatients || 0}</p><p className="text-xs text-neutral-content/65">Currently admitted</p></div>
                </div>
                <Link to="/superadmin/settings/audit-logs" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-primary-content hover:underline">Review system activity <FiArrowUpRight /></Link>
              </div>
            </section>
          </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;