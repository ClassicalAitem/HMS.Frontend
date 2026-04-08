import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { DataTable } from '@/components/common';
import toast from 'react-hot-toast';
import { deleteOpdPatient, getAllOpdPatients } from '@/services/api/opdPatientAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';

const CashierOpdPatients = () => {
  const navigate = useNavigate();
  const [opdPatients, setOpdPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceCharges, setServiceCharges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const patientsResponse = await getAllOpdPatients();
        const patientsData = Array.isArray(patientsResponse) ? patientsResponse : patientsResponse?.data ?? [];
        setOpdPatients(patientsData);

        try {
          const chargesResponse = await getServiceCharges();
          const chargesData = chargesResponse?.data ?? chargesResponse ?? [];
          const labCharges = chargesData.filter(
            (item) => (item.category || '').toLowerCase() === 'laboratory'
          );
          setServiceCharges(labCharges);
        } catch (error) {
          console.error('Failed to load service charges:', error);
        }
      } catch (error) {
        console.error('Failed to fetch OPD patients:', error);
        toast.error('Failed to load OPD patients');
        setOpdPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processedPatients = useMemo(() => {
    return opdPatients.map((patient, index) => ({
      ...patient,
      serialNumber: index + 1,
      createdAtFormatted: formatNigeriaDate(patient.createdAt),
      actions: patient.id
    }));
  }, [opdPatients]);

  
    const handleDelete = useCallback(async (id) => {
      if (window.confirm('Are you sure you want to delete this OPD patient?')) {
        try {
          await deleteOpdPatient(id);
          toast.success('OPD patient deleted successfully');
          setOpdPatients(opdPatients.filter((p) => p.id !== id));
        } catch (error) {
          console.error('Failed to delete OPD patient:', error);
          toast.error('Failed to delete OPD patient');
        }
      }
    }, [opdPatients]);

  const columns = useMemo(() => [
    {
      key: 'serialNumber',
      title: 'S/n',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'fullName',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/cashier/opd-patient-details/${row.id}`)}
          className="text-left link link-primary hover:underline"
        >
          {value}
        </button>
      )
    },
    {
      key: 'phone',
      title: 'Phone Number',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'createdAtFormatted',
      title: 'Date Added',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'actions',
      title: 'Action',
      className: 'text-center',
      render: (patientId) => (
        <div className="flex items-center justify-center gap-2">
          {/* <button
            onClick={() => navigate(`/frontdesk/opd-patients/${patientId}/edit`)}
            className="btn btn-ghost btn-xs text-info"
            title="Edit"
          >
            <FaEdit />
          </button> */}
          <button
            onClick={() => handleDelete(patientId)}
            className="btn btn-ghost btn-xs text-error"
            title="Delete"
          >
            <FaTrash />
          </button>
           
        </div>
      )
    }
  ], [navigate, handleDelete]);

  return (
    <CashierLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content">OPD Patients</h1>
          <p className="text-sm text-base-content/70">Manage payments for out-of-pocket patients</p>
        </div>
        <button
          onClick={() => navigate('/cashier/opd-patients/new')}
          className="btn btn-primary btn-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create OPD Patient
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : opdPatients.length > 0 ? (
            <DataTable
              data={processedPatients}
              columns={columns}
              searchable={true}
              sortable={true}
              paginated={true}
              initialEntriesPerPage={10}
              maxHeight="max-h-96"
              showEntries={true}
              searchPlaceholder="Search OPD patients..."
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-base-content/60 mb-4">No OPD patients found</p>
            </div>
          )}
        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierOpdPatients;
