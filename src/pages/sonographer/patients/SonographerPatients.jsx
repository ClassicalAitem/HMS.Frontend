import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Header } from '@/components/common';
import Sidebar from '@/components/sonographer/dashboard/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearPatientsError, fetchPatients } from '@/store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { Skeleton } from '@heroui/skeleton';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const getStatusClass = (status) => {
  const value = String(Array.isArray(status) ? status[status.length - 1] : status || '').toLowerCase();

  if (['registered', 'active', 'hmo_approved', 'payment_completed', 'surgery_completed', 'discharged', 'follow_up_completed', 'completed'].includes(value)) {
    return 'badge badge-success';
  }
  if (value.startsWith('awaiting_')) return 'badge badge-warning';
  if (['admitted', 'under_observation'].includes(value)) return 'badge badge-primary';
  if (['surgery_in_progress', 'isolated', 'hmo_rejected', 'no_show', 'cancelled'].includes(value)) return 'badge badge-error';
  if (['transferred', 'referred', 'deceased', 'inactive'].includes(value)) return 'badge badge-neutral';
  return 'badge badge-info';
};

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const SonographerPatients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch]);

  const processedPatients = useMemo(() => patients.map((patient, index) => ({
    ...patient,
    serialNumber: index + 1,
    name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
    age: calculateAge(patient.dob),
    createdAtFormatted: formatNigeriaDate(patient.createdAt),
    cardType: patient.cardType || 'N/A',
  })), [patients]);

  const columns = useMemo(() => [
    { key: 'serialNumber', title: 'S/n', sortable: true, className: 'text-base-content font-medium' },
    { key: 'hospitalId', title: 'Hospital ID', sortable: true, className: 'text-base-content font-medium' },
    {
      key: 'name',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => navigate(`/dashboard/sonographer/incoming/${row.id || row._id}`)}
          className="font-medium bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline"
        >
          {value || 'N/A'}
        </button>
      ),
    },
    { key: 'gender', title: 'Gender', sortable: true, className: 'text-base-content/70', render: (value) => <span className="capitalize">{value || 'N/A'}</span> },
    { key: 'age', title: 'Age', sortable: true, className: 'text-base-content/70' },
    { key: 'phone', title: 'Phone Number', sortable: true, className: 'text-base-content/70' },
    { key: 'email', title: 'Email', sortable: true, className: 'text-base-content/70', truncate: true },
    { key: 'status', title: 'Status', className: 'text-base-content/70', render: (value) => <span className={getStatusClass(value)}>{Array.isArray(value) ? value[value.length - 1] : value || 'Unknown'}</span> },
    { key: 'cardType', title: 'Card Type', sortable: true, className: 'text-base-content/70', render: (value) => <span className="capitalize">{value}</span> },
  ], [navigate]);

  return (
    <div className="flex h-screen">
      <div className="hidden lg:block"><Sidebar /></div>
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content">Patients</h1>
            <p className="text-sm text-base-content/60">Manage and view all patient records</p>
          </div>
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {isLoading ? (
                  <div className="overflow-auto rounded-lg border border-base-300/40">
                    <table className="table w-full table-zebra">
                      <thead className="sticky top-0 z-10 bg-base-200"><tr>{columns.map((column) => <th key={column.key}>{column.title}</th>)}</tr></thead>
                      <tbody>{Array.from({ length: 10 }).map((_, index) => <tr key={index}>{columns.map((column) => <td key={column.key}><Skeleton><div className="h-3 w-24 rounded bg-base-300" /></Skeleton></td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ) : (
                  <DataTable data={processedPatients} columns={columns} searchable sortable paginated initialEntriesPerPage={10} maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110" showEntries searchPlaceholder="Search patients..." />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonographerPatients;