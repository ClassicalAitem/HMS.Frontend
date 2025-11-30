import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/common';
import { CashierLayout } from '@/layouts/cashier';
import { FaUsers } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';

const CashierPatients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);

  // console log retrieved patients
  console.log('🔍 CashierPatients: Retrieved patients', patients);

  // Fetch patients from backend
  useEffect(() => {
    console.log('🔄 CashierPatients: Component mounted, fetching patients');
    dispatch(fetchPatients());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch]);

  const StatusBadge = ({ status }) => {
    const getBadgeClass = (status) => {
      switch (status?.toLowerCase()) {
        case 'registered':
          return 'badge badge-success';
        case 'active':
          return 'badge badge-success';
        case 'inactive':
          return 'badge badge-neutral';
        default:
          return 'badge badge-neutral';
      }
    };

    return (
      <span className={getBadgeClass(status)}>
        {status || 'Unknown'}
      </span>
    );
  };

  const columns = useMemo(() => [
    {
      key: 'id',
      title: 'Patient ID',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'firstName',
      title: 'First Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'lastName',
      title: 'Last Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'phone',
      title: 'Phone',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      className: 'text-center',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/cashier/patient-details/${row.patientId}`)}
          className="text-primary hover:text-primary/80 hover:underline text-sm font-medium"
        >
          View Details
        </button>
      )
    }
  ], [navigate]);

  return (
    <CashierLayout>
          {/* Page Header */}
          <div className="flex items-center mb-8 space-x-3">
            <FaUsers className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-normal text-primary 2xl:text-4xl">All Patients</h1>
              <p className="text-sm text-base-content/70 2xl:text-base">View the list of all Patients.</p>
            </div>
          </div>

          {/* Patients Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col justify-center items-center h-64 text-center">
                    <div className="text-error text-lg font-semibold mb-2">Error Loading Patients</div>
                    <div className="text-base-content/70 mb-4">{error}</div>
                    <button
                      onClick={() => dispatch(fetchPatients())}
                      className="btn btn-primary btn-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <DataTable
                    data={patients}
                    columns={columns}
                    searchable={true}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={14}
                    maxHeight="max-h-96 sm:max-h-80 md:max-h-100dvh lg:min-h-[50vh] 2xl:min-h-[60vh]"
                    showEntries={true}
                    searchPlaceholder="Search patients..."
                  />
                )}
              </div>
            </div>
          </div>
    </CashierLayout>
  );
};

export default CashierPatients;
