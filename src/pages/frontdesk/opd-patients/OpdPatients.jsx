import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { DataTable } from '@/components/common';
import toast from 'react-hot-toast';
import { getAllOpdPatients, deleteOpdPatient } from '@/services/api/opdPatientAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { FaEdit, FaTrash } from 'react-icons/fa';
import KolakLoader from '@/components/common/KolakLoader';
import { showErrorToast } from '@/utils/errorHandler';

const OpdPatients = () => {
  const navigate = useNavigate();
  const [opdPatients, setOpdPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const patientsResponse = await getAllOpdPatients();
        const patientsData = Array.isArray(patientsResponse) ? patientsResponse : patientsResponse?.data ?? [];
        if (mounted) setOpdPatients(patientsData);
      } catch (error) {
        showErrorToast(error, 'Failed to load OPD patients');
        if (mounted) setOpdPatients([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this OPD patient?')) {
      try {
        await deleteOpdPatient(id);
        toast.success('OPD patient deleted successfully');
        setOpdPatients((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        showErrorToast(error, 'Failed to delete OPD patient');
      }
    }
  }, []);

  const processedPatients = useMemo(() => {
    return opdPatients.map((patient, index) => {
      return {
        ...patient,
        serialNumber: index + 1,
        gender: patient.gender || 'Not specified',
        dobFormatted: patient.dob ? formatNigeriaDate(patient.dob) : 'Not specified',
        createdAtFormatted: formatNigeriaDate(patient.createdAt),
        updatedAtFormatted: formatNigeriaDate(patient.updatedAt),
        actions: patient.id
      };
    });
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
      className: 'text-base-content font-medium'
    },
    {
      key: 'phone',
      title: 'Phone Number',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'gender',
      title: 'Gender',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'dobFormatted',
      title: 'Date of Birth',
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
      title: 'Actions',
      className: 'text-center',
      render: (patientId) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/frontdesk/opd-patients/${patientId}/edit`)}
            className="btn btn-ghost btn-xs text-info"
            title="Edit"
          >
            <FaEdit />
          </button>
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
  ], [ navigate, handleDelete]);

  return (
    <FrontdeskLayout>
      {isLoading && <KolakLoader fullscreen />}

      <div className="flex flex-col gap-3 items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">OPD Patients</h1>
          <p className="text-sm text-base-content/60 2xl:text-base">Patients without hospital cards needing attention</p>
        </div>
        <button 
          onClick={() => navigate('/frontdesk/opd-patients/new')}
          className="btn btn-primary btn-sm w-full sm:w-auto 2xl:btn-md"
        >
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs 2xl:text-sm">Add OPD Patient</span>
        </button>
      </div>

      <div className="flex flex-1 w-full min-h-0">
        <div className="w-full shadow-xl card bg-base-100">
          <div className="p-4 card-body 2xl:p-6">
            {isLoading ? (
              <KolakLoader />
            ) : opdPatients.length > 0 ? (
              <DataTable
                data={processedPatients}
                columns={columns}
                searchable={true}
                sortable={true}
                paginated={true}
                initialEntriesPerPage={10}
                maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
                showEntries={true}
                searchPlaceholder="Search OPD patients..."
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-base-content/60 mb-4">No OPD patients found</p>
                <button
                  onClick={() => navigate('/frontdesk/opd-patients/new')}
                  className="btn btn-primary btn-sm"
                >
                  Add First OPD Patient
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FrontdeskLayout>
  );
};

export default OpdPatients;
