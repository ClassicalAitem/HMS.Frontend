/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { DataTable } from '@/components/common';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import PatientsDebug from '@/components/common/PatientsDebug';
import { Skeleton } from '@heroui/skeleton';

const Patients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch patients from backend
  useEffect(() => {
    console.log('🔄 Patients: Component mounted, fetching patients');
    dispatch(fetchPatients());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };


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

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Process patients data to match frontend expectations
  const processedPatients = useMemo(() => patients.map((patient, index) => ({
    ...patient,
    serialNumber: index + 1, // Serial number for display
    name: `${patient.firstName} ${patient.lastName}`.trim(),
    age: calculateAge(patient.dob),
    fullName: `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim(),
    nextOfKinName: patient.nextOfKin?.name || 'N/A',
    nextOfKinPhone: patient.nextOfKin?.phone || 'N/A',
    nextOfKinRelationship: patient.nextOfKin?.relationship || 'N/A',
    hmoCount: patient.hmos?.length || 0,
    dependantsCount: patient.dependants?.length || 0,
    createdAtFormatted: new Date(patient.createdAt).toLocaleDateString(),
    updatedAtFormatted: new Date(patient.updatedAt).toLocaleDateString(),
  })), [patients]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'serialNumber',
      title: 'S/n',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'hospitalId',
      title: 'Hospital ID',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'name',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/frontdesk/patients/${row.id}`);
          }}
          className="font-medium bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline"
        >
          {value}
        </button>
      )
    },
    {
      key: 'gender',
      title: 'Gender',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => (
        <span className="capitalize">{value || 'N/A'}</span>
      )
    },
    {
      key: 'age',
      title: 'Age',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'phone',
      title: 'Phone Number',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      className: 'text-base-content/70',
      truncate: true
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value, row) => <StatusBadge status={value} />
    }
  ], [navigate]);

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Patients</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">Manage and view all patient records</p>
            </div>
                <button 
                  onClick={() => navigate('/frontdesk/registration')}
                  className="btn btn-primary btn-sm 2xl:btn-md"
                >
                  <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs 2xl:text-sm">Add Patient</span>
                </button>
          </div>

          {/* Patients Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {isLoading ? (
                  <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                    <div className="overflow-auto max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110">
                      <table className="table w-full table-zebra">
                        <thead className="sticky top-0 z-10 bg-base-200">
                          <tr>
                            {columns.map((column) => (
                              <th key={column.key} className="border border-base-300 px-4 py-3 text-left text-xs font-medium 2xl:text-sm text-base-content/60 uppercase tracking-wider">
                                {column.title || column.key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 10 }).map((_, idx) => (
                            <tr key={idx} className="text-xs">
                              {columns.map((col) => (
                                <td key={`${idx}-${col.key}`} className={`border border-base-300 px-4 2xl:py-3 py-2 2xl:text-sm text-xs ${col.className || 'text-base-content/70'}`}>
                                  <Skeleton>
                                    <div className="h-3 w-24 rounded bg-base-300"></div>
                                  </Skeleton>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={processedPatients}
                    columns={columns}
                    searchable={true}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={10}
                    maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
                    showEntries={true}
                    searchPlaceholder="Search patients..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Debug Component - Remove in production */}
          {/* <PatientsDebug /> */}
        </div>
      );
    };

    export default Patients;
