import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Header } from '@/components/common';
import Sidebar from '@/components/sonographer/dashboard/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearPatientsError, fetchPatients } from '@/store/slices/patientsSlice';
import { getDependants } from '@/services/api/dependantAPI';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
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
  if (isNaN(birthDate.getTime())) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 ? age : 'N/A';
};

const SonographerPatients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);
  const [dependantsList, setDependantsList] = useState([]);
  const [isDependantsLoading, setIsDependantsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    dispatch(fetchPatients({ limit: 'all' }));
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    const fetchAllDependants = async () => {
      try {
        setIsDependantsLoading(true);
        const res = await getDependants({ limit: 'all' });
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.dependants ?? []);
        if (mounted) {
          setDependantsList(list);
        }
      } catch (err) {
        console.error('Failed to fetch dependants:', err);
      } finally {
        if (mounted) {
          setIsDependantsLoading(false);
        }
      }
    };

    fetchAllDependants();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
      dispatch(clearPatientsError());
    }
  }, [error, dispatch]);

  const patientMap = useMemo(() => {
    const map = new Map();
    (patients || []).forEach((p) => {
      const id = p.id || p._id;
      if (id) map.set(id, p);
    });
    return map;
  }, [patients]);

  const processedPatients = useMemo(() => (patients || []).map((patient, index) => ({
    ...patient,
    serialNumber: index + 1,
    name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
    age: calculateAge(patient.dob),
    createdAtFormatted: formatNigeriaDate(patient.createdAt),
    cardType: patient.cardType || 'N/A',
  })), [patients]);

  const dependants = useMemo(() => {
    const depMap = new Map();

    // 1. Collect from standalone dependants API
    (dependantsList || []).forEach((d) => {
      const depId = d.id || d._id;
      if (!depId) return;
      const parent = d.patient || (d.patientId ? patientMap.get(d.patientId) : null);
      depMap.set(depId, {
        ...d,
        id: depId,
        parentPatientId: d.patientId || parent?.id || parent?._id,
        parentPatientName: parent ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim() : (d.parentPatientName || 'N/A'),
        hospitalId: parent?.hospitalId || d.hospitalId || 'N/A',
        phone: d.phone || parent?.phone || 'N/A',
        email: d.email || parent?.email || 'N/A',
        cardType: d.cardType || parent?.cardType || 'N/A',
        isDependant: true,
      });
    });

    // 2. Also incorporate any dependants attached directly to patient objects
    (patients || []).forEach((p) => {
      if (Array.isArray(p.dependants)) {
        p.dependants.forEach((d) => {
          const depId = d.id || d._id;
          if (!depId) return;
          const existing = depMap.get(depId);
          if (!existing) {
            depMap.set(depId, {
              ...d,
              id: depId,
              parentPatientId: p.id || p._id,
              parentPatientName: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
              hospitalId: p.hospitalId || 'N/A',
              phone: d.phone || p.phone || 'N/A',
              email: d.email || p.email || 'N/A',
              cardType: d.cardType || p.cardType || 'N/A',
              isDependant: true,
            });
          } else {
            if (existing.hospitalId === 'N/A' && p.hospitalId) existing.hospitalId = p.hospitalId;
            if (existing.phone === 'N/A' && p.phone) existing.phone = p.phone;
            if (existing.email === 'N/A' && p.email) existing.email = p.email;
            if (existing.cardType === 'N/A' && p.cardType) existing.cardType = p.cardType;
            if (!existing.parentPatientId) existing.parentPatientId = p.id || p._id;
            if (!existing.parentPatientName || existing.parentPatientName === 'N/A') {
              existing.parentPatientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
            }
          }
        });
      }
    });

    return Array.from(depMap.values()).map((d, index) => ({
      ...d,
      serialNumber: index + 1,
      name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
      age: calculateAge(d.dob),
      createdAtFormatted: formatNigeriaDate(d.createdAt),
      cardType: d.cardType || 'N/A',
    }));
  }, [dependantsList, patients, patientMap]);

  const allPatients = useMemo(() => {
    return [...processedPatients, ...dependants].map((item, index) => ({
      ...item,
      serialNumber: index + 1
    }));
  }, [processedPatients, dependants]);

  const displayedPatients = useMemo(() => {
    let list = allPatients;
    if (activeTab === 'patients') list = processedPatients;
    else if (activeTab === 'dependants') list = dependants;

    return list.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }));
  }, [activeTab, allPatients, processedPatients, dependants]);

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
          onClick={() => navigate(`/dashboard/sonographer/incoming/${row.parentPatientId || row.id || row._id}`, {
            state: row.parentPatientId
              ? { dependantId: row.id || row._id, dependantSnapshot: row }
              : { patientSnapshot: row }
          })}
          className="font-medium bg-transparent border-none cursor-pointer text-primary hover:text-primary/80 hover:underline"
        >
          {value || 'N/A'}
          {row.parentPatientId && <span className="badge badge-xs badge-secondary ml-2">Dependant</span>}
        </button>
      ),
    },
    { key: 'gender', title: 'Gender', sortable: true, className: 'text-base-content/70', render: (value) => <span className="capitalize">{value || 'N/A'}</span> },
    { key: 'age', title: 'Age', sortable: true, className: 'text-base-content/70' },
    { key: 'phone', title: 'Phone Number', sortable: true, className: 'text-base-content/70' },
    { key: 'email', title: 'Email', sortable: true, className: 'text-base-content/70', truncate: true },
    { key: 'status', title: 'Status', className: 'text-base-content/70', render: (value) => <span className={getStatusClass(value)}>{(Array.isArray(value) ? value[value.length - 1] : value || 'Unknown').replace(/_/g, ' ')}</span> },
    { key: 'cardType', title: 'Card Type', sortable: true, className: 'text-base-content/70', render: (value) => <span className="capitalize">{value || 'N/A'}</span> },
  ], [navigate]);

  const isTableLoading = isLoading || isDependantsLoading;

  return (
    <div className="flex h-screen">
      <div className="hidden lg:block"><Sidebar /></div>
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Patients</h1>
              <p className="text-sm text-base-content/60">Manage and view all patient and dependant records</p>
            </div>
            <div role="tablist" className="tabs tabs-boxed">
              <button
                type="button"
                role="tab"
                className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({allPatients.length})
              </button>
              <button
                type="button"
                role="tab"
                className={`tab ${activeTab === 'patients' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('patients')}
              >
                Patients ({processedPatients.length})
              </button>
              <button
                type="button"
                role="tab"
                className={`tab ${activeTab === 'dependants' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('dependants')}
              >
                Dependants ({dependants.length})
              </button>
            </div>
          </div>
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {isTableLoading ? (
                  <div className="overflow-auto rounded-lg border border-base-300/40">
                    <table className="table w-full table-zebra">
                      <thead className="sticky top-0 z-10 bg-base-200"><tr>{columns.map((column) => <th key={column.key}>{column.title}</th>)}</tr></thead>
                      <tbody>{Array.from({ length: 10 }).map((_, index) => <tr key={index}>{columns.map((column) => <td key={column.key}><Skeleton><div className="h-3 w-24 rounded bg-base-300" /></Skeleton></td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ) : (
                  <DataTable data={displayedPatients} columns={columns} searchable sortable paginated initialEntriesPerPage={10} maxHeight="max-h-48 sm:max-h-94 md:max-h-64 lg:max-h-84 2xl:max-h-110" showEntries searchPlaceholder="Search patients..." />
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
