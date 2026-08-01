import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/common';
import { CashierLayout } from '@/layouts/cashier';
import { FaUsers } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, clearPatientsError } from '../../../store/slices/patientsSlice';
import { getDependants } from '@/services/api/dependantAPI';
import toast from 'react-hot-toast';
import { hasAnyStatus } from '@/utils/statusUtils';
import { PATIENT_STATUS } from '@/constants/patientStatus';

const CashierPatients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading, error } = useAppSelector((state) => state.patients);

  const [dependants, setDependants] = useState([]);
  const [dependantsLoading, setDependantsLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    const fetchDependants = async () => {
      try {
        setDependantsLoading(true);
        const res = await getDependants();
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.dependants ?? []);
        if (mounted) setDependants(list);
      } catch (err) {
        if (mounted) setDependants([]);
      } finally {
        if (mounted) setDependantsLoading(false);
      }
    };
    fetchDependants();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch]);

  const StatusBadge = ({ status }) => {
    const statusList = Array.isArray(status) ? status : (status ? [status] : []);
    return (
      <div className="flex flex-wrap gap-1">
        {statusList.length > 0 ? (
          statusList.map((s) => (
            <span key={s} className="badge badge-primary badge-sm">
              {s?.replace(/_/g, ' ').toUpperCase()}
            </span>
          ))
        ) : (
          <span className="badge badge-neutral">Unknown</span>
        )}
      </div>
    );
  };

  const TypeBadge = ({ type }) =>
    type === 'dependant' ? (
      <span className="badge badge-secondary badge-sm">Dependant</span>
    ) : (
      <span className="badge badge-outline badge-sm">Patient</span>
    );

  const columns = useMemo(() => [
    {
      key: 'displayId',
      title: 'Patient ID',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => <TypeBadge type={value} />
    },
    {
      key: 'firstName',
      title: 'First Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'lastName',
      title: 'Last Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'phone',
      title: 'Phone',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      className: 'text-center',
      render: (value, row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="text-primary hover:text-primary/80 hover:underline text-sm font-medium"
        >
          View Details
        </button>
      )
    }
  ], []);

  const handleViewDetails = (row) => {
    navigate(`/cashier/patient-details/${row.patientId}`, {
      state: {
        from: 'cashier-patients',
        dependantId: row.type === 'dependant' ? row.dependantId : null,
      },
    });
  };

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients]
  );

  const filteredPatients = patients
    .filter((p) => hasAnyStatus(p.status, [PATIENT_STATUS.AWAITING_CASHIER, PATIENT_STATUS.AWAITING_PAYMENT]))
    .map((p) => ({
      type: 'patient',
      id: p.id,
      patientId: p.id,
      dependantId: null,
      displayId: p.hospitalId || p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      status: p.status,
    }));

  const filteredDependants = dependants
    .filter((d) => hasAnyStatus(d.status, [PATIENT_STATUS.AWAITING_CASHIER, PATIENT_STATUS.AWAITING_PAYMENT]))
    .map((d) => {
      const parent = patientMap.get(d.patientId);
      return {
        type: 'dependant',
        id: d.id,
        patientId: d.patientId,
        dependantId: d.id,
        displayId: parent?.hospitalId || d.patientId || d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email || parent?.email || '—',
        phone: d.phone || parent?.phone || parent?.phoneNumber || '—',
        status: d.status,
      };
    });

  const combinedData = [...filteredPatients, ...filteredDependants];
  const loading = isLoading || dependantsLoading;

  return (
    <CashierLayout>
      <div className="flex items-center mb-8 space-x-3">
        <FaUsers className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-normal text-primary 2xl:text-4xl">All Patients</h1>
          <p className="text-sm text-base-content/70 2xl:text-base">View the list of all Patients.</p>
        </div>
      </div>

      <div className="flex flex-1 w-full min-h-0">
        <div className="w-full shadow-xl card bg-base-100">
          <div className="p-4 card-body 2xl:p-6">
            {loading ? (
              <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                <div className="overflow-auto max-h-96 p-4 space-y-3">
                  <div className="skeleton h-6 w-40" />
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="skeleton h-8 w-full" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64 text-center">
                <div className="text-error text-lg font-semibold mb-2">Error Loading Patients</div>
                <div className="text-base-content/70 mb-4">{error}</div>
                <button onClick={() => dispatch(fetchPatients())} className="btn btn-primary btn-sm">
                  Try Again
                </button>
              </div>
            ) : (
              <DataTable
                data={combinedData}
                columns={columns}
                searchable={true}
                sortable={true}
                paginated={true}
                initialEntriesPerPage={14}
                maxHeight="max-h-96 sm:max-h-80 md:max-h-100dvh lg:min-h-[50vh] 2xl:min-h-[60vh]"
                showEntries={true}
                searchPlaceholder="Search patients..."
              />
            )}
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierPatients;