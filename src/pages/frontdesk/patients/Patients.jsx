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
import { getConsultations } from '@/services/api/consultationAPI';
import { getAllAnteNatalRecords } from '@/services/api/anteNatalAPI';
import { FaUsers, FaUser, FaChild, FaClipboardList } from 'react-icons/fa';

const unwrapList = (response, collectionKey) => {
  const data = response?.data?.data ?? response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[collectionKey])) return data[collectionKey];
  return [];
};

const getMonthBounds = (month) => {
  if (!month) return null;
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) return null;
  return {
    start: new Date(year, monthNumber - 1, 1),
    end: new Date(year, monthNumber, 1),
  };
};

const getHistoryDateBounds = (filter, fromMonth, toMonth) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') {
    return { start: today, end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) };
  }
  if (filter === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
  }
  if (filter === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  if (filter === 'range') {
    const startBounds = getMonthBounds(fromMonth);
    const endBounds = getMonthBounds(toMonth);
    if (!startBounds || !endBounds || startBounds.start > endBounds.start) return null;
    return { start: startBounds.start, end: endBounds.end };
  }
  return null;
};

const Patients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyFromMonth, setHistoryFromMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [historyToMonth, setHistoryToMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [selectedPatientForDependants, setSelectedPatientForDependants] = useState(null);
  const [isDependantsModalOpen, setIsDependantsModalOpen] = useState(false);

  // Fetch patients from backend
  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    if (viewMode !== 'attended') return undefined;

    let mounted = true;
    const loadAttendanceHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const [consultationsResponse, antenatalResponse] = await Promise.all([
          getConsultations(),
          getAllAnteNatalRecords(),
        ]);
        if (!mounted) return;

        const patientsById = new Map();
        const dependantsById = new Map();
        patients.forEach((patient) => {
          const patientId = patient.id || patient._id;
          if (patientId) patientsById.set(String(patientId), patient);
          (patient.dependants || []).forEach((dependant) => {
            const dependantId = dependant.id || dependant._id;
            if (dependantId) dependantsById.set(String(dependantId), dependant);
          });
        });

        const entries = [];
        unwrapList(consultationsResponse, 'consultations').forEach((consultation) => {
          const patientId = consultation.patientId || consultation.patient?.id || consultation.patient?._id;
          const dependantId = consultation.dependantId || consultation.dependant?.id || consultation.dependant?._id;
          const patient = consultation.patient || patientsById.get(String(patientId));
          const dependant = consultation.dependant || dependantsById.get(String(dependantId));
          const subject = dependantId ? dependant : patient;
          const date = consultation.createdAt;
          if (!patientId || !subject || !date || Number.isNaN(new Date(date).getTime())) return;

          entries.push({
            patientId: String(patientId),
            dependantId: dependantId ? String(dependantId) : null,
            name: `${subject.firstName || ''} ${subject.middleName || ''} ${subject.lastName || ''}`.trim() || 'Unknown',
            hospitalId: patient?.hospitalId || subject.hospitalId || '—',
            patientSnapshot: patient,
            dependantSnapshot: dependantId ? dependant : null,
            recordType: 'Consultation',
            doctor: `${consultation.doctor?.firstName || ''} ${consultation.doctor?.lastName || ''}`.trim() || '—',
            date: new Date(date),
          });
        });

        unwrapList(antenatalResponse, 'anteNatalRecords').forEach((antenatal) => {
          const patientId = antenatal.patientId || antenatal.patient?.id || antenatal.patient?._id;
          const patient = antenatal.patient || patientsById.get(String(patientId));
          (antenatal.anteNatalRecords || []).forEach((record) => {
            const dependantId = record.dependantId || record.dependant?.id || record.dependant?._id;
            const dependant = record.dependant || dependantsById.get(String(dependantId));
            const subject = dependantId ? dependant : patient;
            const date = record.createdAt || antenatal.createdAt;
            if (!patientId || !subject || !date || Number.isNaN(new Date(date).getTime())) return;

            entries.push({
              patientId: String(patientId),
              dependantId: dependantId ? String(dependantId) : null,
              name: `${subject.firstName || ''} ${subject.middleName || ''} ${subject.lastName || ''}`.trim() || 'Unknown',
              hospitalId: patient?.hospitalId || subject.hospitalId || '—',
              patientSnapshot: patient,
              dependantSnapshot: dependantId ? dependant : null,
              recordType: 'Antenatal',
              doctor: `${record.doctor?.firstName || ''} ${record.doctor?.lastName || ''}`.trim() || '—',
              date: new Date(date),
            });
          });
        });

        setHistoryRecords(entries);
      } catch (loadError) {
        console.error('Failed to load attended-patient history', loadError);
        if (mounted) setHistoryError(getErrorMessage(loadError, 'Failed to load attendance history'));
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    };

    loadAttendanceHistory();
    return () => { mounted = false; };
  }, [viewMode, historyRefreshKey, patients]);

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
    isOldPatient: patient.isOldPatient || false,
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
      isOldPatient: patient.isOldPatient || false,
      dependantsCount: 0,
    }))
  )).map((item, index) => ({ ...item, serialNumber: index + 1 })), [patients]);

  const allRecords = useMemo(() => [...primaryPatients, ...dependantsOnly]
    .map((item, index) => ({ ...item, serialNumber: index + 1 })), [primaryPatients, dependantsOnly]);

  const activeData = viewMode === 'primary' ? primaryPatients : viewMode === 'dependants' ? dependantsOnly : allRecords;
  const historyBounds = getHistoryDateBounds(historyFilter, historyFromMonth, historyToMonth);
  const attendedPatients = useMemo(() => {
    if (historyFilter === 'range' && !historyBounds) return [];
    const filteredEntries = historyRecords.filter(({ date }) => (
      !historyBounds || (date >= historyBounds.start && date < historyBounds.end)
    ));
    const grouped = new Map();

    filteredEntries.forEach((entry) => {
      const key = `${entry.patientId}:${entry.dependantId || 'primary'}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.visitCount += 1;
        existing.recordTypes.add(entry.recordType);
        if (entry.date > existing.lastAttendedAt) {
          existing.lastAttendedAt = entry.date;
          existing.lastAttendedBy = entry.doctor;
        }
      } else {
        grouped.set(key, {
          ...entry,
          visitCount: 1,
          recordTypes: new Set([entry.recordType]),
          lastAttendedAt: entry.date,
          lastAttendedBy: entry.doctor,
        });
      }
    });

    return Array.from(grouped.values())
      .map((entry, index) => ({
        ...entry,
        serialNumber: index + 1,
        recordType: Array.from(entry.recordTypes).join(', '),
        lastAttendedAt: entry.lastAttendedAt.toLocaleString(),
        lastAttendedTimestamp: entry.lastAttendedAt.getTime(),
        attendedSearch: `${entry.name} ${entry.hospitalId} ${entry.recordType} ${entry.lastAttendedBy}`.toLowerCase(),
      }))
      .sort((a, b) => b.lastAttendedTimestamp - a.lastAttendedTimestamp);
  }, [historyRecords, historyBounds, historyFilter]);

  const attendanceColumns = useMemo(() => [
    { key: 'serialNumber', title: 'S/n', sortable: true, className: 'text-base-content font-medium' },
    { key: 'hospitalId', title: 'Hospital ID', sortable: true, className: 'text-base-content font-medium' },
    {
      key: 'name',
      title: 'Patient / Subject Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div>
          <button
            type="button"
            onClick={() => navigate(`/frontdesk/patients/${row.patientId}`, {
              state: {
                patientSnapshot: row.patientSnapshot,
                dependantId: row.dependantId,
                dependantSnapshot: row.dependantSnapshot,
              },
            })}
            className="font-semibold text-left text-primary hover:underline"
          >
            {value}
          </button>
          {row.dependantId && <div className="text-[11px] text-base-content/60">Dependant</div>}
        </div>
      ),
    },
    { key: 'recordType', title: 'Record Type(s)', sortable: true, className: 'text-base-content/70' },
    { key: 'visitCount', title: 'Visits', sortable: true, className: 'text-base-content/70' },
    {
      key: 'lastAttendedTimestamp',
      title: 'Last Attended',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => new Date(value).toLocaleString(),
    },
    { key: 'lastAttendedBy', title: 'Doctor', sortable: true, className: 'text-base-content/70' },
    { key: 'attendedSearch', title: '', className: 'hidden' },
  ], [navigate]);

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
        <div className="flex items-center gap-1">
          <button type="button" onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            navigate(`/frontdesk/patients/${row.id}`);
          }} className="font-semibold text-left bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline">
            {value}
          </button>
          {row.isOldPatient && <span className="badge badge-neutral badge-xs uppercase text-[9px] font-bold">Old Patient</span>}
        </div>
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
                ['attended', 'Attended Patients', attendedPatients.length, FaClipboardList],
              ].map(([mode, label, count, Icon]) => (
                <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${viewMode === mode ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/70 hover:text-base-content'}`}>
                  <Icon className="w-3.5 h-3.5" /> {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'attended' && (
            <div className="flex flex-col gap-3 mb-4 rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label htmlFor="attendance-date-filter" className="mb-1 block text-xs font-semibold text-base-content/70">
                  Attendance period
                </label>
                <select
                  id="attendance-date-filter"
                  className="select select-bordered select-sm w-full sm:w-48"
                  value={historyFilter}
                  onChange={(event) => setHistoryFilter(event.target.value)}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="range">Month range</option>
                </select>
              </div>
              {historyFilter === 'range' && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div>
                    <label htmlFor="attendance-from-month" className="mb-1 block text-xs font-semibold text-base-content/70">
                      From month
                    </label>
                    <input
                      id="attendance-from-month"
                      type="month"
                      className="input input-bordered input-sm w-full"
                      value={historyFromMonth}
                      onChange={(event) => setHistoryFromMonth(event.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="attendance-to-month" className="mb-1 block text-xs font-semibold text-base-content/70">
                      To month
                    </label>
                    <input
                      id="attendance-to-month"
                      type="month"
                      className="input input-bordered input-sm w-full"
                      value={historyToMonth}
                      onChange={(event) => setHistoryToMonth(event.target.value)}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-base-content/60">
                Showing patients with a consultation or antenatal record in the selected period.
              </p>
            </div>
          )}

          {/* Patients Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {viewMode === 'attended' ? (
                  historyLoading ? (
                    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-base-content/60">
                      <span className="loading loading-spinner loading-md" />
                      Loading attendance history...
                    </div>
                  ) : historyError ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <p className="text-sm text-error">{historyError}</p>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setHistoryRefreshKey((key) => key + 1)}
                      >
                        Retry
                      </button>
                    </div>
                  ) : historyFilter === 'range' && !historyBounds ? (
                    <div className="py-12 text-center text-sm text-warning">
                      The start month must be the same as or earlier than the end month.
                    </div>
                  ) : (
                    <DataTable
                      data={attendedPatients}
                      columns={attendanceColumns}
                      searchable={true}
                      sortable={true}
                      paginated={true}
                      initialEntriesPerPage={10}
                      maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110"
                      showEntries={true}
                      searchPlaceholder="Search attended patients..."
                    />
                  )
                ) : isLoading ? (
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
