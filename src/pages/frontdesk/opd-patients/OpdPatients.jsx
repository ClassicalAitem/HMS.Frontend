import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { DataTable } from '@/components/common';
import toast from 'react-hot-toast';
import { getAllOpdPatients, deleteOpdPatient } from '@/services/api/opdPatientAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { FaEdit, FaTrash } from 'react-icons/fa';
import SendPatientModal from '@/components/modals/SendPatientModal';

const OpdPatients = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        setOpdPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
  }, [opdPatients, serviceCharges]);

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
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">OPD Patients</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">Patients without hospital cards needing attention</p>
            </div>
            <button 
              onClick={() => navigate('/frontdesk/opd-patients/new')}
              className="btn btn-primary btn-sm 2xl:btn-md"
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
        </div>
      </div>
    </div>
  );
};

export default OpdPatients;
