import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { DataTable } from '@/components/common';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { Skeleton } from '@heroui/skeleton';
import KolakLoader from '@/components/common/KolakLoader';
import PatientCardTypeInfo from '@/components/common/PatientCardTypeInfo';
import ViewDependantsModal from '@/components/superadmin/patients/ViewDependantsModal';
import { FaUsers, FaUser, FaChild } from 'react-icons/fa';

const Patients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all');
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
    const currentStatus = Array.isArray(status) ? status[status.length - 1] : status;

  const getBadgeClass = (statusValue) => {
    switch (statusValue?.toLowerCase()) {
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
      case 'awaiting_discharge_approval':
      case 'awaiting_follow_up':
        return 'badge badge-warning';

      case 'vitals_completed':
      case 'in_consultation':
      case 'consultation_completed':
      case 'sampling_completed':
      case 'review_completed':
      case 'injection_completed':
      case 'lab_in_progress':
      case 'lab_completed':
      case 'sonography_completed':
      case 'radiology_in_progress':
      case 'radiology_completed':
      case 'pharmacy_completed':
      case 'discharge_in_progress':
      case 'post_surgery_recovery':
      case 'post_surgery_observation':
        return 'badge badge-info';

      case 'admitted':
      case 'under_observation':
        return 'badge badge-primary';

      case 'hmo_approved':
      case 'payment_completed':
      case 'surgery_completed':
      case 'discharged':
      case 'follow_up_completed':
      case 'completed':
        return 'badge badge-success';

      case 'surgery_in_progress':
      case 'isolated':
        return 'badge badge-error';

      case 'hmo_rejected':
      case 'no_show':
      case 'cancelled':
        return 'badge badge-error';

      case 'transferred':
      case 'referred':
      case 'deceased':
        return 'badge badge-neutral';

      default:
        return 'badge badge-neutral';
    }
  };

    const displayValue = Array.isArray(status)
      ? status.map((value) => value.replace(/_/g, ' ')).join(', ')
      : status;

    return (
    <span className={`${getBadgeClass(currentStatus)} text-xs capitalize`}>
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
    return age;
  };

  const primaryPatients = useMemo(() => patients.map((patient, index) => ({
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
  })), [patients]);

  const dependantsOnly = useMemo(() => patients.flatMap((patient) => (
    (patient.dependants || []).map((dependant, index) => ({
      ...dependant,
      id: dependant._id || dependant.id || `${patient.id || patient._id}-dep-${index}`,
      primaryPatientId: patient.id || patient._id,
      primaryPatientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Principal',
      primaryPatientHospitalId: patient.hospitalId || '—',
      recordType: 'dependant',
      isDependant: true,
      hospitalId: dependant.hospitalId || dependant.dependantHospitalId || `${patient.hospitalId || 'HOS'}-D${index + 1}`,
      name: `${dependant.firstName || ''} ${dependant.middleName || ''} ${dependant.lastName || ''}`.trim() || 'Unnamed Dependant',
      age: calculateAge(dependant.dob || dependant.dateOfBirth),
      relationship: dependant.relationshipType || dependant.relationship || 'Dependant',
      gender: dependant.gender || '—',
      phone: dependant.phone || patient.phone || '—',
      email: dependant.email || patient.email || '—',
      cardType: patient.cardType || 'personal',
      familyName: patient.familyName || '',
      companyName: patient.companyName || '',
      status: dependant.status || patient.status || 'Active',
      dependantsCount: 0,
    }))
  )).map((item, index) => ({ ...item, serialNumber: index + 1 })), [patients]);

  const allRecords = useMemo(() => [...primaryPatients, ...dependantsOnly]
    .map((item, index) => ({ ...item, serialNumber: index + 1 })), [primaryPatients, dependantsOnly]);

  const activeData = viewMode === 'primary' ? primaryPatients : viewMode === 'dependants' ? dependantsOnly : allRecords;

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
      title: 'Patient / Subject Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => row.isDependant ? (
        <div>
          <div className="font-semibold text-base-content">{value}</div>
          <div className="text-[11px] text-base-content/60">Dep. of <strong className="text-primary">{row.primaryPatientName}</strong></div>
        </div>
      ) : (
        <button type="button" onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          navigate(`/frontdesk/patients/${row.id}`);
        }} className="font-semibold text-left bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline">
          {value}
        </button>
      )
    },
    {
      key: 'recordType',
      title: 'Type / Relation',
      className: 'text-base-content/70',
      render: (value, row) => row.isDependant ? (
        <span className="badge badge-sm badge-secondary gap-1 font-medium capitalize"><FaChild className="w-2.5 h-2.5" /> {row.relationship}</span>
      ) : (
        <span className="badge badge-sm badge-outline gap-1 font-medium"><FaUser className="w-2.5 h-2.5" /> Primary</span>
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
    },
    {
      key: 'dependantsCount',
      title: 'Dependants',
      className: 'text-base-content/70',
      render: (value, row) => row.isDependant ? (
        <span className="text-xs text-base-content/50">Guardian: {row.primaryPatientHospitalId}</span>
      ) : value > 0 ? (
        <button type="button" onClick={() => {
          setSelectedPatientForDependants(row);
          setIsDependantsModalOpen(true);
        }} className="btn btn-xs btn-primary gap-1 font-semibold rounded-full"><FaUsers className="w-3 h-3" /> {value} Family</button>
      ) : <span className="text-xs text-base-content/40">—</span>
    },
    {
      key: 'cardType',
      title: 'Card Type',
      sortable: true,
      className: 'text-base-content/70',
      render: (value, row) => (
        <PatientCardTypeInfo cardType={value} familyName={row.familyName} companyName={row.companyName} />
      )
    }
  ], [navigate]);

  return (
    <div className="flex h-screen">
            {isLoading && <KolakLoader fullscreen />}

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
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="flex flex-col gap-3 items-start justify-between mb-6 sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Patients</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">Manage and view all patient records</p>
            </div>
                <button 
                  onClick={() => navigate('/frontdesk/registration')}
                  className="btn btn-primary btn-sm w-full sm:w-auto 2xl:btn-md"
                >
                  <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs 2xl:text-sm">Add Patient</span>
                </button>
          </div>

          <div className="flex items-center gap-2 mb-4 text-xs overflow-x-auto">
            <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
              <FaUser className="text-primary w-3.5 h-3.5" /> Primary: <strong>{primaryPatients.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
              <FaChild className="text-secondary w-3.5 h-3.5" /> Dependants: <strong>{dependantsOnly.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
              <FaUsers className="text-success w-3.5 h-3.5" /> Total: <strong>{allRecords.length}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between bg-base-100 p-2 rounded-xl border border-base-300 shadow-sm mb-4 gap-2">
            <div className="flex items-center gap-1 bg-base-200 p-1 rounded-lg overflow-x-auto">
              {[
                ['all', 'All Records', allRecords.length, FaUsers],
                ['primary', 'Primary Patients', primaryPatients.length, FaUser],
                ['dependants', 'Dependants Only', dependantsOnly.length, FaChild],
              ].map(([mode, label, count, Icon]) => (
                <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${viewMode === mode ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/70 hover:text-base-content'}`}>
                  <Icon className="w-3.5 h-3.5" /> {label} ({count})
                </button>
              ))}
            </div>
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
                    data={activeData}
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
