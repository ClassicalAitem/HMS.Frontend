import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import {
  FaDownload,
  FaSave,
  FaFileAlt,
  FaFilter,
  FaSearch,
  FaUsers,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBoxes,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaPills,
  FaVial,
  FaUserInjured,
} from 'react-icons/fa';
import { getAllBillings } from '@/services/api/billingAPI';
import { getPrescriptions } from '@/services/api/prescriptionsAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getPatients, getPatientById } from '@/services/api/patientsAPI';
import { getAllAppointments } from '@/services/api/appointmentsAPI';
import { getInventories } from '@/services/api/inventoryAPI';
import { reportDateRangeOptions, getDateRangeFromSelection, isWithinDateRange, exportRowsToCsv } from './reportUtils';
import { getDependantById } from '@/services/api/dependantAPI';
import { getInvestigations } from '@/services/api/investigationAPI';
import { usersAPI } from '@/services/api/usersAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const extractArrayFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (payload && typeof payload === 'object') return [payload];
  return [];
};

const unwrapEntity = (res) => {
  const raw = res?.data?.data ?? res?.data ?? res ?? null;
  return raw?.dependant ?? raw?.patient ?? raw?.user ?? raw;
};

const formatName = (subject) => {
  const firstName = subject?.firstName || subject?.fname || subject?.name?.split(' ')[0] || '';
  const lastName = subject?.lastName || subject?.lname || subject?.name?.split(' ').slice(1).join(' ') || '';
  return [firstName, lastName].filter(Boolean).join(' ').trim() || subject?.fullName || subject?.name || '—';
};

const resolveIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id || null;
  return null;
};

const resolveEmbeddedEntity = (value) => {
  if (
    value &&
    typeof value === 'object' &&
    (value.firstName || value.fname || value.fullName || value.hospitalId || value.name)
  ) {
    return value;
  }
  return null;
};

const fetchEntityMap = async (ids, fetchFn) => {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (!uniqueIds.length || typeof fetchFn !== 'function') return new Map();

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const res = await fetchFn(id);
        return [id, unwrapEntity(res)];
      } catch {
        return [id, null];
      }
    })
  );

  return new Map(entries);
};

const reportColumnConfig = {
  'Pharmacy Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'drugName', label: 'Drug / Injection' },
    { key: 'dispenseDate', label: 'Dispense Date' },
    { key: 'dispenseBy', label: 'Dispensed By' },
    { key: 'patientId', label: 'Patient ID' },
  ],
  'Billing Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'totalAmount', label: 'Total Invoiced' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'outstandingBalance', label: 'Outstanding Balance' },
    { key: 'paymentDate', label: 'Billing Date' },
    { key: 'attendedBy', label: 'Cashier / Officer' },
    { key: 'patientId', label: 'Patient ID' },
  ],
  'Lab Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'testName', label: 'Investigation Test' },
    { key: 'testDate', label: 'Test Date' },
    { key: 'status', label: 'Result Status' },
    { key: 'attendedBy', label: 'Lab Scientist' },
    { key: 'patientId', label: 'Patient ID' },
  ],
  'Patients Report': [
    { key: 'name', label: 'Patient Full Name' },
    { key: 'patientId', label: 'Hospital ID' },
    { key: 'dateRegistered', label: 'Date Registered' },
    { key: 'cardType', label: 'Card Scheme' },
    { key: 'hmoProvider', label: 'HMO Provider' },
  ],
  'Appointments Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'patientId', label: 'Patient ID' },
    { key: 'appointmentDate', label: 'Scheduled Date & Time' },
    { key: 'department', label: 'Clinical Department' },
    { key: 'appointmentType', label: 'Type' },
    { key: 'status', label: 'Status' },
  ],
  'Inventory Report': [
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Current Stock' },
    { key: 'reorderLevel', label: 'Reorder Level' },
    { key: 'sellingPrice', label: 'Tariff Price' },
    { key: 'expiryDate', label: 'Expiry Date' },
  ],
};

const reportDateKey = {
  'Pharmacy Report': 'dispenseDate',
  'Billing Report': 'paymentDate',
  'Lab Report': 'testDate',
  'Patients Report': 'dateRegistered',
  'Appointments Report': 'appointmentDate',
  'Inventory Report': 'expiryDate',
};

const REPORT_TABS = [
  { id: 'Pharmacy Report', label: 'Pharmacy', icon: FaPills },
  { id: 'Billing Report', label: 'Billing & Finance', icon: FaMoneyBillWave },
  { id: 'Lab Report', label: 'Lab & Diagnostics', icon: FaVial },
  { id: 'Patients Report', label: 'Patients Directory', icon: FaUserInjured },
  { id: 'Appointments Report', label: 'Appointments', icon: FaCalendarCheck },
  { id: 'Inventory Report', label: 'Supplies & Inventory', icon: FaBoxes },
];

const GenerateReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportType, setReportType] = useState('Pharmacy Report');
  const [dateRangeOption, setDateRangeOption] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [hospitalIdFilter, setHospitalIdFilter] = useState('');
  const [reportRows, setReportRows] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let isMounted = true;

    const loadReportData = async () => {
      setLoading(true);
      setError('');
      setCurrentPage(1);

      try {
        let rows = [];

        if (reportType === 'Pharmacy Report') {
          const payload = await getPrescriptions();
          const prescriptions = extractArrayFromPayload(payload);

          const patientIds = prescriptions.map((r) => resolveIdString(r?.patientId)).filter(Boolean);
          const dependantIds = prescriptions.map((r) => resolveIdString(r?.dependantId)).filter(Boolean);
          const pharmacistIds = prescriptions.map((r) => resolveIdString(r?.pharmacistId)).filter(Boolean);

          const [patientMap, dependantMap, pharmacistMap] = await Promise.all([
            fetchEntityMap(patientIds, getPatientById),
            fetchEntityMap(dependantIds, getDependantById),
            fetchEntityMap(pharmacistIds, usersAPI.getUserById),
          ]);

          rows = prescriptions.map((record, index) => {
            const medications = Array.isArray(record?.medications) ? record.medications : [];
            const medication = medications[0] || {};
            const parentPatient =
              resolveEmbeddedEntity(record?.patientId) || patientMap.get(resolveIdString(record?.patientId));
            const subject = record?.dependantId
              ? resolveEmbeddedEntity(record.dependantId) || dependantMap.get(resolveIdString(record.dependantId))
              : parentPatient;
            const pharmacist =
              resolveEmbeddedEntity(record?.pharmacistId) ||
              (record?.pharmacistId ? pharmacistMap.get(resolveIdString(record.pharmacistId)) : null);

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject),
              drugName: medication.drugName || medication.name || record?.drugName || '—',
              dispenseDate: record?.updatedAt || record?.createdAt || record?.dispensedAt || record?.date || '',
              dispenseBy: record?.pharmacistName || formatName(pharmacist) || '—',
              patientId:
                parentPatient?.hospitalId ||
                subject?.patient?.hospitalId ||
                subject?.hospitalId ||
                resolveIdString(record?.patientId) ||
                '—',
            };
          });
        } else if (reportType === 'Billing Report') {
          const payload = await getAllBillings();
          const billings = extractArrayFromPayload(payload);
          const patientIds = billings.map((r) => resolveIdString(r?.patientId)).filter(Boolean);
          const dependantIds = billings.map((r) => resolveIdString(r?.dependantId)).filter(Boolean);

          const [patientMap, dependantMap] = await Promise.all([
            fetchEntityMap(patientIds, getPatientById),
            fetchEntityMap(dependantIds, getDependantById),
          ]);

          rows = billings.map((record, index) => {
            const amount = Number(record?.totalAmount || 0);
            const outstanding = Number(record?.outstandingBill || 0);
            const status =
              record?.isCleared || outstanding <= 0
                ? 'Paid'
                : outstanding < amount
                ? 'Partial'
                : 'Pending';
            const patient = record?.patient || {};
            const parentPatient =
              resolveEmbeddedEntity(record?.patientId) || patientMap.get(resolveIdString(record?.patientId));
            const subject = record?.dependantId
              ? resolveEmbeddedEntity(record.dependantId) || dependantMap.get(resolveIdString(record.dependantId))
              : parentPatient;

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(patient) || record?.patientName || '—',
              totalAmount: amount,
              paymentStatus: status,
              outstandingBalance: outstanding,
              paymentDate: record?.createdAt || record?.paymentDate || '',
              attendedBy: record?.cashierName || record?.attendedBy || record?.createdBy || '—',
              patientId:
                parentPatient?.hospitalId ||
                subject?.patient?.hospitalId ||
                subject?.hospitalId ||
                resolveIdString(record?.patientId) ||
                '—',
            };
          });
        } else if (reportType === 'Lab Report') {
          const payload = await getLabResults();
          const results = extractArrayFromPayload(payload);
          const patientIds = results.map((r) => resolveIdString(r?.patientId)).filter(Boolean);
          const dependantIds = results.map((r) => resolveIdString(r?.dependantId)).filter(Boolean);
          const technicianIds = results.map((r) => resolveIdString(r?.labTechnicianId)).filter(Boolean);

          const [patientMap, dependantMap, technicianMap, investigationsPayload] = await Promise.all([
            fetchEntityMap(patientIds, getPatientById),
            fetchEntityMap(dependantIds, getDependantById),
            fetchEntityMap(technicianIds, usersAPI.getUserById),
            getInvestigations(),
          ]);

          const allInvestigations = extractArrayFromPayload(investigationsPayload);
          const investigationMap = new Map();
          allInvestigations.forEach((inv) => {
            const key = inv?._id || inv?.id;
            if (key) investigationMap.set(key, inv);
          });

          rows = results.map((record, index) => {
            const parentPatient =
              resolveEmbeddedEntity(record?.patientId) || patientMap.get(resolveIdString(record?.patientId));
            const subject = record?.dependantId
              ? resolveEmbeddedEntity(record.dependantId) || dependantMap.get(resolveIdString(record.dependantId))
              : parentPatient;
            const technician =
              resolveEmbeddedEntity(record?.labTechnicianId) ||
              (record?.labTechnicianId ? technicianMap.get(resolveIdString(record.labTechnicianId)) : null);

            const matchedInvestigation = investigationMap.get(record?.investigationRequestId);
            const firstTest = Array.isArray(matchedInvestigation?.tests) ? matchedInvestigation.tests[0] : null;
            const resultEntry = Array.isArray(record?.result) ? record.result[0] : null;
            const testName =
              resultEntry?.code ||
              resultEntry?.value ||
              record?.testName ||
              firstTest?.name ||
              firstTest?.code ||
              record?.form?.clinicalDiagnosis ||
              record?.form?.natureOfSpecimen ||
              '—';

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject),
              testName,
              testDate: record?.form?.date || record?.createdAt || record?.date || '',
              status: matchedInvestigation?.status || record?.status || '—',
              attendedBy: record?.labTechnicianName || formatName(technician) || '—',
              patientId:
                parentPatient?.hospitalId ||
                subject?.hospitalId ||
                resolveIdString(record?.patientId) ||
                '—',
            };
          });
        } else if (reportType === 'Patients Report') {
          const payload = await getPatients();
          const patients = extractArrayFromPayload(payload);
          rows = patients.map((patient, index) => ({
            id: patient?._id || patient?.id || `${reportType}-${index}`,
            name: formatName(patient),
            patientId: patient?.hospitalId || patient?.patientId || '—',
            dateRegistered: patient?.createdAt || patient?.dateRegistered || '',
            cardType: patient?.cardType || 'Regular',
            hmoProvider: patient?.hmos?.[0]?.provider || patient?.hmoProvider || 'Self Pay',
          }));
        } else if (reportType === 'Appointments Report') {
          const payload = await getAllAppointments({ limit: 500 });
          const appts = extractArrayFromPayload(payload);
          rows = appts.map((a, index) => {
            const patient = a?.patient || a?.patientId || {};
            return {
              id: a?._id || a?.id || `${reportType}-${index}`,
              name: formatName(patient) || a?.patientName || 'Medical Patient',
              patientId: patient?.hospitalId || a?.hospitalId || resolveIdString(a?.patientId) || '—',
              appointmentDate: a?.appointmentDate
                ? `${a.appointmentDate} ${a?.appointmentTime || ''}`
                : a?.createdAt || '',
              department: a?.department || a?.clinic || 'General Medicine',
              appointmentType: a?.appointmentType || 'Consultation',
              status: a?.status || 'Scheduled',
            };
          });
        } else if (reportType === 'Inventory Report') {
          const payload = await getInventories();
          const items = extractArrayFromPayload(payload);
          rows = items.map((item, index) => ({
            id: item?._id || item?.id || `${reportType}-${index}`,
            name: item?.name || 'Supply Item',
            category: item?.category || item?.form || 'Medical Consumables',
            stock: item?.stock ?? item?.quantity ?? 0,
            reorderLevel: item?.reorderLevel ?? 10,
            sellingPrice: item?.sellingPrice ? `₦${Number(item.sellingPrice).toLocaleString()}` : '—',
            expiryDate: item?.expiryDate || '',
          }));
        }

        if (isMounted) {
          setReportRows((prev) => ({ ...prev, [reportType]: rows }));
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load report data right now.');
          setReportRows((prev) => ({ ...prev, [reportType]: [] }));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReportData();

    return () => {
      isMounted = false;
    };
  }, [reportType]);

  const currentRows = reportRows[reportType] || [];
  const currentColumns = reportColumnConfig[reportType] || [];
  const dateKey = reportDateKey[reportType];
  const activeDateRange = useMemo(
    () => getDateRangeFromSelection(dateRangeOption, customStartDate, customEndDate),
    [dateRangeOption, customEndDate, customStartDate]
  );

  const filteredRows = useMemo(() => {
    const searchName = nameFilter.trim().toLowerCase();
    const searchHospitalId = hospitalIdFilter.trim().toLowerCase();

    return currentRows.filter((row) => {
      const matchesName = !searchName || `${row.name || ''}`.toLowerCase().includes(searchName);
      const matchesHospitalId =
        !searchHospitalId || `${row.patientId || ''}`.toLowerCase().includes(searchHospitalId);
      const matchesDate = isWithinDateRange(row[dateKey], activeDateRange);

      return matchesName && matchesHospitalId && matchesDate;
    });
  }, [activeDateRange, currentRows, dateKey, hospitalIdFilter, nameFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const renderCellValue = (row, columnKey) => {
    if (columnKey === 'totalAmount' || columnKey === 'outstandingBalance') {
      return `₦${Number(row[columnKey] || 0).toLocaleString()}`;
    }

    if (columnKey === 'paymentStatus') {
      const status = row.paymentStatus;
      const badgeClass =
        status === 'Paid'
          ? 'badge-success'
          : status === 'Partial'
          ? 'badge-warning'
          : 'badge-ghost';
      return <span className={`badge badge-sm font-semibold ${badgeClass}`}>{row.paymentStatus || '—'}</span>;
    }

    if (columnKey === 'status') {
      const s = String(row.status || '').toLowerCase();
      const badgeClass =
        s === 'completed' || s === 'active'
          ? 'badge-success'
          : s === 'in_progress' || s === 'scheduled'
          ? 'badge-info'
          : s === 'cancelled'
          ? 'badge-error'
          : s === 'pending'
          ? 'badge-warning'
          : 'badge-ghost';
      return <span className={`badge badge-sm font-semibold capitalize ${badgeClass}`}>{row.status || '—'}</span>;
    }

    const dateColumns = new Set([
      'dispenseDate',
      'paymentDate',
      'testDate',
      'dateRegistered',
      'appointmentDate',
      'expiryDate',
    ]);

    if (dateColumns.has(columnKey)) {
      return formatNigeriaDate(row[columnKey]);
    }

    return row[columnKey] || '—';
  };

  const handleExport = () => {
    exportRowsToCsv(
      filteredRows,
      currentColumns,
      `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const resetFilters = () => {
    setDateRangeOption('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setNameFilter('');
    setHospitalIdFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen bg-base-300/20">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 h-full space-y-6">
          {/* Header & Export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  Hospital Reporting Engine
                </h1>
                <span className="badge badge-primary badge-sm font-semibold">Live Extraction</span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
                Comprehensive data exports for clinical, financial, administrative, and pharmacy governance
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={resetFilters}
                className="btn btn-outline btn-sm rounded-xl"
              >
                Reset Filters
              </button>
              <button
                className="btn btn-primary btn-sm rounded-xl px-4 shadow-sm shadow-primary/20"
                onClick={handleExport}
                disabled={!filteredRows.length}
              >
                <FaDownload className="mr-1.5 w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Report Category Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-base-200/60 p-1.5 rounded-2xl border border-base-300/60 w-fit">
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = reportType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/70">
                <FaFilter className="text-primary w-3 h-3" /> Filter Report Parameters
              </div>
              <span className="text-xs font-semibold text-primary">
                {filteredRows.length} Records Found
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-base-content/60 mb-1">
                  Date Range
                </label>
                <select
                  value={dateRangeOption}
                  onChange={(e) => setDateRangeOption(e.target.value)}
                  className="select select-bordered select-sm rounded-xl w-full text-xs"
                >
                  {reportDateRangeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-base-content/60 mb-1">
                  Filter by Name / Item
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3 h-3" />
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => {
                      setNameFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name..."
                    className="input input-bordered input-sm rounded-xl pl-8 w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-base-content/60 mb-1">
                  Filter by Hospital ID
                </label>
                <div className="relative">
                  <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3 h-3" />
                  <input
                    type="text"
                    value={hospitalIdFilter}
                    onChange={(e) => {
                      setHospitalIdFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="e.g. PAT-001"
                    className="input input-bordered input-sm rounded-xl pl-8 w-full text-xs"
                  />
                </div>
              </div>

              {dateRangeOption === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-base-content/60 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="input input-bordered input-sm rounded-xl w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-base-content/60 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="input input-bordered input-sm rounded-xl w-full text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-base-content">{reportType}</h3>
                <p className="text-xs text-base-content/60">
                  Showing page {currentPage} of {totalPages} ({filteredRows.length} total entries)
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
                <p className="text-xs font-semibold text-base-content/60">
                  Aggregating records from database...
                </p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-error">{error}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full text-xs">
                    <thead className="bg-base-200/50 uppercase text-base-content/70">
                      <tr>
                        {currentColumns.map((col) => (
                          <th key={col.key} className="py-3 px-4">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={currentColumns.length}
                            className="py-12 text-center text-base-content/50"
                          >
                            <FaFileAlt className="w-8 h-8 mx-auto text-base-content/20 mb-2" />
                            No matching records found for the selected timeframe.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row) => (
                          <tr key={row.id} className="hover:bg-base-200/40 transition-colors">
                            {currentColumns.map((column) => (
                              <td key={`${row.id}-${column.key}`} className="py-3 px-4">
                                {renderCellValue(row, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-base-content/60">
                      Showing {paginatedRows.length} of {filteredRows.length} entries
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-outline btn-xs rounded-lg"
                      >
                        <FaChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-semibold text-base-content">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="btn btn-outline btn-xs rounded-lg"
                      >
                        <FaChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReports;