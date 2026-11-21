import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { DataTable } from '@/components/common';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import KolakLoader from '@/components/common/KolakLoader';
import PatientCardTypeInfo from '@/components/common/PatientCardTypeInfo';
import ViewDependantsModal from '@/components/superadmin/patients/ViewDependantsModal';
import { getConsultations } from '@/services/api/consultationAPI';
import { getAllAnteNatalRecords } from '@/services/api/anteNatalAPI';
import { FaUsers, FaUser, FaChild, FaClipboardList, FaCalendarAlt } from 'react-icons/fa';

const unwrapList = (response, collectionKey) => {
  const data = response?.data?.data ?? response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[collectionKey])) return data[collectionKey];
  return [];
};

// Day-level date bounds calculation (supports custom exact day ranges, not just months)
const getDateBounds = (filter, fromDate, toDate) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filter === 'today') {
    return { start: startOfToday, end: endOfToday };
  }
  if (filter === 'week') {
    const dayOfWeek = (startOfToday.getDay() + 6) % 7; // Monday = 0
    const start = new Date(startOfToday);
    start.setDate(startOfToday.getDate() - dayOfWeek);
    return { start, end: endOfToday };
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { start, end: endOfToday };
  }
  if (filter === 'range' || filter === 'custom') {
    if (!fromDate && !toDate) return null;
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : new Date(0);
    const end = toDate ? new Date(`${toDate}T23:59:59.999`) : new Date();
    if (start > end) return null;
    return { start, end };
  }
  return null;
};

const Patients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);
  const [viewMode, setViewMode] = useState('all');

  // Registration date filter state
  const [regDateFilter, setRegDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'range'
  const [regFromDate, setRegFromDate] = useState('');
  const [regToDate, setRegToDate] = useState('');

  // Attendance history date filter state (day-level)
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'range'
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');

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

  // Sort patients so the latest registered/added is ALWAYS at the top (newest first)
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const at = new Date(a.createdAt || a.registrationDate || 0).getTime();
      const bt = new Date(b.createdAt || b.registrationDate || 0).getTime();
      return bt - at;
    });
  }, [patients]);

  const primaryPatients = useMemo(() => sortedPatients.map((patient, index) => {
    const firstName = (patient.firstName || '').trim();
    const middleName = (patient.middleName || '').trim();
    const lastName = (patient.lastName || '').trim();
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const displayName = fullName || 'Unknown Patient';
    const patientId = patient.id || patient._id;

    return {
      ...patient,
      id: patientId,
      patientId,
      primaryPatientId: patientId,
      serialNumber: index + 1,
      recordType: 'primary',
      isDependant: false,
      firstName,
      middleName,
      lastName,
      name: displayName,
      fullName,
      reversedName: [lastName, firstName, middleName].filter(Boolean).join(' '),
      dependantsCount: (patient.dependants || []).length,
      dependantsList: patient.dependants || [],
      cardType: patient.cardType || 'personal',
      cardTypes: patient.cardTypes || (patient.cardType ? [patient.cardType] : ['personal']),
      familyName: patient.familyName || '',
      companyName: patient.companyName || '',
      status: patient.status || 'Active',
      isOldPatient: patient.isOldPatient || false,
      patientSnapshot: patient,
      createdAtDate: new Date(patient.createdAt || patient.registrationDate || 0),
    };
  }), [sortedPatients]);

  const dependantsOnly = useMemo(() => sortedPatients.flatMap((patient) => {
    const guardianFirstName = (patient.firstName || '').trim();
    const guardianMiddleName = (patient.middleName || '').trim();
    const guardianLastName = (patient.lastName || '').trim();
    const guardianName = [guardianFirstName, guardianMiddleName, guardianLastName].filter(Boolean).join(' ') || 'Unknown Principal';
    const guardianId = patient.id || patient._id;

    return (patient.dependants || []).map((dependant, index) => {
      const depFirstName = (dependant.firstName || '').trim();
      const depMiddleName = (dependant.middleName || '').trim();
      const depLastName = (dependant.lastName || '').trim();
      const depFullName = [depFirstName, depMiddleName, depLastName].filter(Boolean).join(' ');
      const depDisplayName = depFullName || 'Unnamed Dependant';
      const depId = dependant._id || dependant.id || `${guardianId}-dep-${index}`;

      return {
        ...dependant,
        id: depId,
        dependantId: depId,
        patientId: guardianId,
        primaryPatientId: guardianId,
        primaryPatientName: guardianName,
        primaryPatientHospitalId: patient.hospitalId || '—',
        patientSnapshot: patient,
        dependantSnapshot: dependant,
        recordType: 'dependant',
        isDependant: true,
        hospitalId: dependant.hospitalId || dependant.dependantHospitalId || `${patient.hospitalId || 'HOS'}-D${index + 1}`,
        firstName: depFirstName,
        middleName: depMiddleName,
        lastName: depLastName,
        name: depDisplayName,
        fullName: depFullName,
        reversedName: [depLastName, depFirstName, depMiddleName].filter(Boolean).join(' '),
        relationship: dependant.relationshipType || dependant.relationship || 'Dependant',
        gender: dependant.gender || '—',
        phone: dependant.phone || patient.phone || '—',
        email: dependant.email || patient.email || '—',
        cardType: dependant.cardType || patient.cardType || 'personal',
        cardTypes: dependant.cardTypes || (dependant.cardType ? [dependant.cardType] : (patient.cardTypes || [patient.cardType || 'personal'])),
        individualCardType: dependant.cardType || null,
        guardianCardType: patient.cardType || 'personal',
        familyName: dependant.familyName || patient.familyName || '',
        companyName: dependant.companyName || patient.companyName || '',
        status: dependant.status || patient.status || 'Active',
        isOldPatient: patient.isOldPatient || false,
        dependantsCount: 0,
        createdAtDate: new Date(dependant.createdAt || patient.createdAt || 0),
      };
    });
  }).sort((a, b) => b.createdAtDate.getTime() - a.createdAtDate.getTime())
    .map((item, index) => ({ ...item, serialNumber: index + 1 })), [sortedPatients]);

  const allRecords = useMemo(() => {
    return [...primaryPatients, ...dependantsOnly]
      .sort((a, b) => b.createdAtDate.getTime() - a.createdAtDate.getTime())
      .map((item, index) => ({ ...item, serialNumber: index + 1 }));
  }, [primaryPatients, dependantsOnly]);

  const activeBaseData = viewMode === 'primary' ? primaryPatients : viewMode === 'dependants' ? dependantsOnly : allRecords;

  // Registration Date Bounds
  const regDateBounds = useMemo(() => {
    return getDateBounds(regDateFilter, regFromDate, regToDate);
  }, [regDateFilter, regFromDate, regToDate]);

  // Filtered active registered patients
  const activeData = useMemo(() => {
    if (regDateFilter === 'all') return activeBaseData;
    if (!regDateBounds) {
      if (regDateFilter === 'range') return [];
      return activeBaseData;
    }

    return activeBaseData
      .filter((item) => {
        const t = item.createdAtDate?.getTime() || 0;
        return t >= regDateBounds.start.getTime() && t <= regDateBounds.end.getTime();
      })
      .map((item, index) => ({ ...item, serialNumber: index + 1 }));
  }, [activeBaseData, regDateFilter, regDateBounds]);

  // History Date Bounds (day-level range)
  const historyBounds = useMemo(() => {
    return getDateBounds(historyFilter, historyFromDate, historyToDate);
  }, [historyFilter, historyFromDate, historyToDate]);

  const attendedPatients = useMemo(() => {
    if (historyFilter === 'range' && !historyBounds) return [];
    const filteredEntries = historyRecords.filter(({ date }) => (
      !historyBounds || (date >= historyBounds.start && date <= historyBounds.end)
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
    { key: 'hospitalId', title: 'Hospital ID', sortable: true, className: 'text-base-content font-medium font-mono' },
    {
      key: 'name',
      title: 'Patient / Subject Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div>
          <button
            type="button"
            onClick={() => navigate(`/frontdesk/patients/${row.patientId}${row.dependantId ? `?dependantId=${row.dependantId}` : ''}`, {
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

  // Define table columns (Age and Phone Number removed per user request)
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
      className: 'text-base-content font-medium font-mono'
    },
    {
      key: 'name',
      title: 'Patient / Subject Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => row.isDependant ? (
        <div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigate(`/frontdesk/patients/${row.primaryPatientId || row.patientId}?dependantId=${row.dependantId || row.id}`, {
                state: {
                  patientSnapshot: row.patientSnapshot,
                  dependantId: row.dependantId || row.id,
                  dependantSnapshot: row.dependantSnapshot || row,
                },
              });
            }}
            className="font-semibold text-left bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline"
            title="View Dependant Profile"
          >
            {value}
          </button>
          <div className="text-[11px] text-base-content/60">
            Dep. of{' '}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                navigate(`/frontdesk/patients/${row.primaryPatientId || row.patientId}`);
              }}
              className="text-primary hover:underline font-semibold"
              title="View Guardian Profile"
            >
              {row.primaryPatientName}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigate(`/frontdesk/patients/${row.id}`);
            }}
            className="font-semibold text-left bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline"
            title="View Patient Profile"
          >
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
      render: (value) => <StatusBadge status={value} />
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
        <div className="flex flex-col items-start gap-1">
          <PatientCardTypeInfo cardType={value} familyName={row.familyName} companyName={row.companyName} />
          {row.isDependant && row.individualCardType && row.guardianCardType === 'family' && (
            <span className="text-[10px] text-base-content/60">Guardian family coverage remains</span>
          )}
        </div>
      )
    }
  ], [navigate]);

  return (
    <FrontdeskLayout>
      {isLoading && <KolakLoader fullscreen />}

      {/* Page Header */}
      <div className="flex flex-col gap-3 items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Patients</h1>
          <p className="text-sm text-base-content/60 2xl:text-base">Manage and view all registered patient records</p>
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

      {/* Statistics badges */}
      <div className="flex items-center gap-2 mb-4 text-xs overflow-x-auto">
        <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          <FaUser className="text-primary w-3.5 h-3.5" /> Primary: <strong>{primaryPatients.length}</strong>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          <FaChild className="text-secondary w-3.5 h-3.5" /> Dependants: <strong>{dependantsOnly.length}</strong>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-base-100 border border-base-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          <FaUsers className="text-success w-3.5 h-3.5" /> Total Registered: <strong>{allRecords.length}</strong>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center justify-between bg-base-100 p-2 rounded-xl border border-base-300 shadow-sm mb-4 gap-2">
        <div className="flex items-center gap-1 bg-base-200 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
          {[
            ['all', 'All Records', allRecords.length, FaUsers],
            ['primary', 'Primary Patients', primaryPatients.length, FaUser],
            ['dependants', 'Dependants Only', dependantsOnly.length, FaChild],
            ['attended', 'Attended Patients', attendedPatients.length, FaClipboardList],
          ].map(([mode, label, count, Icon]) => (
            <button 
              key={mode} 
              type="button" 
              onClick={() => setViewMode(mode)} 
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${viewMode === mode ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/70 hover:text-base-content'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* REGISTRATION DATE FILTER BAR (FOR ALL, PRIMARY, DEPENDANTS TABS) */}
      {viewMode !== 'attended' && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-base-content/70 mr-1 flex items-center gap-1">
              <FaCalendarAlt className="text-primary w-3 h-3" /> Registered:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'range', label: 'Custom Range' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRegDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  regDateFilter === f.id
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'bg-base-200/80 text-base-content/70 hover:text-base-content hover:bg-base-300/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {regDateFilter === 'range' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-base-200/60 px-2.5 py-1 rounded-lg border border-base-300">
                <span className="text-base-content/60 font-medium">From:</span>
                <input
                  type="date"
                  value={regFromDate}
                  onChange={(e) => setRegFromDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-base-200/60 px-2.5 py-1 rounded-lg border border-base-300">
                <span className="text-base-content/60 font-medium">To:</span>
                <input
                  type="date"
                  value={regToDate}
                  onChange={(e) => setRegToDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
              {(regFromDate || regToDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setRegFromDate('');
                    setRegToDate('');
                  }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="text-xs text-base-content/70 font-medium ml-auto">
            Showing <strong className="text-primary font-bold">{activeData.length}</strong> patients in selected range
          </div>
        </div>
      )}

      {/* ATTENDED PATIENTS DATE FILTER BAR */}
      {viewMode === 'attended' && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-base-content/70 mr-1 flex items-center gap-1">
              <FaCalendarAlt className="text-primary w-3 h-3" /> Attendance Period:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'range', label: 'Custom Day Range' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHistoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  historyFilter === f.id
                    ? 'bg-primary text-primary-content shadow-sm'
                    : 'bg-base-200/80 text-base-content/70 hover:text-base-content hover:bg-base-300/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {historyFilter === 'range' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-base-200/60 px-2.5 py-1 rounded-lg border border-base-300">
                <span className="text-base-content/60 font-medium">From Date:</span>
                <input
                  type="date"
                  value={historyFromDate}
                  onChange={(e) => setHistoryFromDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-base-200/60 px-2.5 py-1 rounded-lg border border-base-300">
                <span className="text-base-content/60 font-medium">To Date:</span>
                <input
                  type="date"
                  value={historyToDate}
                  onChange={(e) => setHistoryToDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
              {(historyFromDate || historyToDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryFromDate('');
                    setHistoryToDate('');
                  }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="text-xs text-base-content/70 font-medium ml-auto">
            Showing <strong className="text-primary font-bold">{attendedPatients.length}</strong> attended patients
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="flex flex-1 w-full min-h-0">
        <div className="w-full shadow-xl card bg-base-100">
          <div className="p-4 card-body 2xl:p-6">
            {viewMode === 'attended' ? (
              historyLoading ? (
                <KolakLoader />
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
                  Please pick a valid start date that is on or before the end date.
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
              <KolakLoader />
            ) : regDateFilter === 'range' && !regDateBounds ? (
              <div className="py-12 text-center text-sm text-warning">
                Please pick a valid start date that is on or before the end date.
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
                searchPlaceholder="Search patients by name, KOLAK ID, card type..."
              />
            )}
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
    </FrontdeskLayout>
  );
};

export default Patients;
