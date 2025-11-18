import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/common';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { LuUserRoundCheck } from 'react-icons/lu';
import { MdOutlineStore } from 'react-icons/md';
import { FiFileText } from 'react-icons/fi';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchMetrics } from '../../../store/slices/metricsSlice';
import { fetchVitals } from '../../../store/slices/vitalsSlice';

const SuperAdminDashboard = () => {

  
  // Skeleton loader for vitals table
  const VitalsTableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(7)].map((_, index) => (
        <div key={index} className="flex space-x-4 p-3 bg-base-200 rounded-lg animate-pulse">
          <div className="h-6 w-full bg-base-300 rounded"></div>
          <div className="h-6 w-full bg-base-300 rounded"></div>
          <div className="h-6 w-full bg-base-300 rounded"></div>
          <div className="h-6 w-full bg-base-300 rounded"></div>
          <div className="h-6 w-full bg-base-300 rounded"></div>
          <div className="h-6 w-full bg-base-300 rounded"></div>
        </div>
      ))}
    </div>
  );
  const dispatch = useAppDispatch();
  const { metrics, isLoading, error } = useAppSelector((state) => state.metrics);
  const { vitals, isLoading: vitalsLoading, error: vitalsError } = useAppSelector((state) => state.vitals);

  // Debug: Log metrics and vitals data
  useEffect(() => {
    console.log('📊 Dashboard - Metrics state:', metrics);
    console.log('📊 Dashboard - isLoading:', isLoading);
    console.log('📊 Dashboard - error:', error);
    console.log('🩺 Dashboard - Vitals state:', vitals);
    console.log('🩺 Dashboard - vitalsLoading:', vitalsLoading);
    console.log('🩺 Dashboard - vitalsError:', vitalsError);
  }, [metrics, isLoading, error, vitals, vitalsLoading, vitalsError]);

  useEffect(() => {
    // Fetch both metrics and vitals data
    dispatch(fetchMetrics());
    dispatch(fetchVitals());
  }, [dispatch]);

  const getCurrentDate = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
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

  // Define table columns for vitals
  const columns = useMemo(() => [
    {
      key: 'patientId',
      title: 'Patient ID',
      sortable: true,
      className: 'font-medium text-base-content'
    },
    {
      key: 'bp',
      title: 'Blood Pressure',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'temperature',
      title: 'Temperature',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => `${value}°F`
    },
    {
      key: 'pulse',
      title: 'Pulse',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => `${value} bpm`
    },
    {
      key: 'weight',
      title: 'Weight',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => `${value} kg`
    },
    {
      key: 'spo2',
      title: 'SpO2',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => `${value}%`
    },
    {
      key: 'createdAt',
      title: 'Recorded At',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => new Date(value).toLocaleString()
    }
  ], []);

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
          

          {/* Recent Vitals Data */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-primary 2xl:text-2xl">Recent Vitals Data</h2>
              <p className="text-xs 2xl:text-base text-base-content/70">Latest patient vital signs recorded in the system.</p>
            </div>
            
            {/* Error Display for Vitals */}
            {vitalsError && (
              <div className="alert alert-error mb-4">
                <span>Error loading vitals: {vitalsError}</span>
              </div>
            )}
            
            {/* Vitals Table */}
            {vitalsLoading ? (
              <VitalsTableSkeleton />
            ) : (
              <DataTable
                data={vitals || []}
                columns={columns}
                searchable={true}
                sortable={true}
                paginated={true}
                initialEntriesPerPage={5}
                maxHeight="max-h-96 sm:max-h-80 md:max-h-96 lg:max-h-80 2xl:max-h-100"
                showEntries={true}
                searchPlaceholder="Search vitals..."
              />
            )}
          </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;