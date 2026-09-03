import React, { useState, useEffect, useMemo } from 'react';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { DataTable } from '@/components/common';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { Skeleton } from '@heroui/skeleton';
import PatientCardTypeInfo from '@/components/common/PatientCardTypeInfo';
import ViewDependantsModal from '@/components/superadmin/patients/ViewDependantsModal';
import { FaUserFriends, FaUsers, FaUser, FaChild } from 'react-icons/fa';

const Patients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'primary', 'dependants'
  const [selectedPatientForDependants, setSelectedPatientForDependants] = useState(null);
  const [isDependantsModalOpen, setIsDependantsModalOpen] = useState(false);

  // Fetch patients from backend
  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
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
  const statusValue = Array.isArray(status) ? status[0] : status;

  const getBadgeClass = (val) => {
    switch (val?.toLowerCase()) {
      case 'registered':
      case 'active':
        return 'badge badge-success';
      case 'inactive':
        return 'badge badge-neutral';
      case 'awaiting_front_desk':
      case 'awaiting_payment':
      case 'awaiting_vitals':
      case 'awaiting_consultation':
      case 'awaiting_doctor':
      case 'awaiting_md':
      case 'awaiting_sampling':
      case 'awaiting_review':
      case 'awaiting_injection':
      case 'awaiting_cashier':
      case 'awaiting_hmo':
      case 'awaiting_nurse':
      case 'awaiting_lab':
      case 'awaiting_sonographer':
      case 'awaiting_radiology':
      case 'awaiting_pharmacy':
      case 'awaiting_admission':
      case 'awaiting_surgery':
        return 'badge badge-warning';
      case 'vitals_completed':
      case 'in_consultation':
      case 'consultation_completed':
      case 'pharmacy_completed':
      case 'completed':
        return 'badge badge-info';
      case 'admitted':
        return 'badge badge-primary';
      case 'cancelled':
        return 'badge badge-error';
      default:
        return 'badge badge-neutral';
    }
  };

  const displayValue = Array.isArray(status)
    ? status.map((s) => s.replace(/_/g, ' ')).join(', ')
    : status;

  return (
    <span className={`${getBadgeClass(statusValue)} text-xs capitalize`}>
      {displayValue || 'Active'}
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
    return age >= 0 ? `${age} yrs` : 'N/A';
  };

  // Process Primary Patients
  const primaryPatients = useMemo(() => {
    return patients.map((patient, index) => ({
      ...patient,
      id: patient.id || patient._id,
      serialNumber: index + 1,
      recordType: 'primary',
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient',
      fullName: `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim(),
      age: calculateAge(patient.dob || patient.dateOfBirth),
      dependantsCount: (patient.dependants || []).length,
      dependantsList: patient.dependants || [],
      cardType: patient.cardType || 'personal',
      familyName: patient.familyName || '',
      companyName: patient.companyName || '',
      status: patient.status || 'Active',
    }));
  }, [patients]);

  // Extract all dependants
  const dependantsOnly = useMemo(() => {
    const list = [];
    patients.forEach((patient) => {
      const deps = patient.dependants || [];
      const primaryName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Principal';
      deps.forEach((dep, depIdx) => {
        list.push({
          ...dep,
          id: dep._id || dep.id || `${patient.id || patient._id}-dep-${depIdx}`,
          primaryPatientId: patient.id || patient._id,
          primaryPatientName: primaryName,
          primaryPatientHospitalId: patient.hospitalId || '—',
          primaryCardType: patient.cardType || 'personal',
          primaryFamilyName: patient.familyName || patient.companyName || '',
          recordType: 'dependant',
          isDependant: true,
          hospitalId: dep.hospitalId || dep.dependantHospitalId || `${patient.hospitalId || 'HOS'}-D${depIdx + 1}`,
          name: `${dep.firstName || ''} ${dep.middleName || ''} ${dep.lastName || ''}`.trim() || 'Unnamed Dependant',
          age: calculateAge(dep.dob || dep.dateOfBirth),
          relationship: dep.relationshipType || dep.relationship || 'Dependant',
          gender: dep.gender || '—',
          phone: dep.phone || patient.phone || '—',
          email: dep.email || patient.email || '—',
          cardType: patient.cardType || 'personal',
          familyName: patient.familyName || '',
          companyName: patient.companyName || '',
          status: dep.status || patient.status || 'Active',
          dependantsCount: 0,
        });
      });
    });
    return list.map((item, index) => ({ ...item, serialNumber: index + 1 }));
  }, [patients]);

  // Combined records for All view
  const allRecords = useMemo(() => {
    const combined = [...primaryPatients];
    dependantsOnly.forEach((dep) => {
      combined.push(dep);
    });
    return combined.map((item, index) => ({ ...item, serialNumber: index + 1 }));
  }, [primaryPatients, dependantsOnly]);

  const activeData = useMemo(() => {
    if (viewMode === 'primary') return primaryPatients;
    if (viewMode === 'dependants') return dependantsOnly;
    return allRecords;
  }, [viewMode, primaryPatients, dependantsOnly, allRecords]);

  // Define table columns
  const columns = useMemo(() => [
    {
      key: 'serialNumber',
      title: 'S/n',
      sortable: true,
      className: 'text-base-content font-medium w-12'
    },
    {
      key: 'hospitalId',
      title: 'Hospital ID',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <span className="font-mono text-xs font-semibold">{value || '—'}</span>
      )
    },
    {
      key: 'name',
      title: 'Patient / Subject Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => {
        if (row.isDependant) {
          return (
            <div>
              <div className="font-semibold text-base-content">{value}</div>
              <div className="text-[11px] text-base-content/60 flex items-center gap-1 mt-0.5">
                <FaChild className="w-3 h-3 text-secondary" />
                <span>Dep. of <strong className="text-primary">{row.primaryPatientName}</strong></span>
              </div>
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/superadmin/patients/patientDetails/${row.id}`);
            }}
            className="font-semibold text-left bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline"
          >
            {value}
          </button>
        );
      }
    },
    {
      key: 'recordType',
      title: 'Type / Relation',
      className: 'text-base-content/70',
      render: (value, row) => {
        if (row.isDependant) {
          return (
            <span className="badge badge-sm badge-secondary gap-1 font-medium capitalize">
              <FaChild className="w-2.5 h-2.5" /> {row.relationship || 'Dependant'}
            </span>
          );
        }
        return (
          <span className="badge badge-sm badge-outline font-medium">
            <FaUser className="w-2.5 h-2.5 mr-1" /> Primary
          </span>
        );
      }
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
      key: 'dependantsCount',
      title: 'Dependants',
      className: 'text-base-content/70',
      render: (value, row) => {
        if (row.isDependant) {
          return (
            <span className="text-xs text-base-content/50">
              Guardian: {row.primaryPatientHospitalId}
            </span>
          );
        }
        if (row.dependantsCount > 0) {
          return (
            <button
              type="button"
              onClick={() => {
                setSelectedPatientForDependants(row);
                setIsDependantsModalOpen(true);
              }}
              className="btn btn-xs btn-primary gap-1 font-semibold rounded-full"
            >
              <FaUsers className="w-3 h-3" />
              {row.dependantsCount} Family
            </button>
          );
        }
        return <span className="text-xs text-base-content/40">—</span>;
      }
    },
    {
      key: 'phone',
      title: 'Phone Number',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'cardType',
      title: 'Card Type',
      className: 'text-base-content/70',
      render: (value, row) => (
        <PatientCardTypeInfo
          cardType={row.cardType}
          familyName={row.familyName}
          companyName={row.companyName}
        />
      )
    },
    {
      key: 'status',
      title: 'Status',
      className: 'text-base-content/70',
      render: (value) => <StatusBadge status={value} />
    }
  ], [navigate]);

  return (
    <div className="flex h-screen bg-base-300/20">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-opacity-50 lg:hidden"
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
      <div className="flex overflow-hidden flex-col flex-1">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-3 sm:p-6 h-full space-y-4">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Patient Directory</h1>
              <p className="text-xs sm:text-sm text-base-content/60">
                Manage, search, and review registered hospital patients and family dependants
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5">
                <FaUser className="text-primary w-3.5 h-3.5" />
                <span className="text-base-content/70">Primary:</span>
                <strong className="text-base-content">{primaryPatients.length}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5">
                <FaChild className="text-secondary w-3.5 h-3.5" />
                <span className="text-base-content/70">Dependants:</span>
                <strong className="text-base-content">{dependantsOnly.length}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5">
                <FaUsers className="text-success w-3.5 h-3.5" />
                <span className="text-base-content/70">Total:</span>
                <strong className="text-base-content">{allRecords.length}</strong>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center justify-between bg-base-100 p-2 rounded-xl border border-base-300 shadow-sm">
            <div className="flex items-center gap-1 bg-base-200 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'all'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-base-content/70 hover:text-base-content'
                }`}
              >
                <FaUsers className="w-3.5 h-3.5" />
                All Records ({allRecords.length})
              </button>
              <button
                onClick={() => setViewMode('primary')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'primary'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-base-content/70 hover:text-base-content'
                }`}
              >
                <FaUser className="w-3.5 h-3.5" />
                Primary Patients ({primaryPatients.length})
              </button>
              <button
                onClick={() => setViewMode('dependants')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'dependants'
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'text-base-content/70 hover:text-base-content'
                }`}
              >
                <FaChild className="w-3.5 h-3.5" />
                Dependants Only ({dependantsOnly.length})
              </button>
            </div>
            <div className="text-xs text-base-content/50 hidden md:block">
              {viewMode === 'dependants'
                ? 'Showing children, spouses & secondary beneficiaries'
                : viewMode === 'primary'
                ? 'Showing registered principal account holders'
                : 'Showing full hospital subject directory'}
            </div>
          </div>

          {/* Patients Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100 border border-base-300">
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
                    data={activeData}
                    columns={columns}
                    searchable={true}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={10}
                    maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
                    showEntries={true}
                    searchPlaceholder="Search patients, dependants, or hospital ID..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dependants Breakdown Modal */}
      <ViewDependantsModal
        isOpen={isDependantsModalOpen}
        onClose={() => {
          setIsDependantsModalOpen(false);
          setSelectedPatientForDependants(null);
        }}
        patient={selectedPatientForDependants}
      />
    </div>
  );
};

export default Patients;

