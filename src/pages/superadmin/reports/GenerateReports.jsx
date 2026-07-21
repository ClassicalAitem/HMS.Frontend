import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaDownload, FaSave, FaFileAlt, FaFilter, FaSearch, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { getAllBillings } from '@/services/api/billingAPI';
import { getPrescriptions } from '@/services/api/prescriptionsAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getPatients, getPatientById } from '@/services/api/patientsAPI';
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
  if (value && typeof value === 'object' && (value.firstName || value.fname || value.fullName || value.hospitalId || value.name)) {
    return value;
  }
  return null;
};

// Batch-resolve a set of ids via a fetch-by-id function into a Map<id, entity>.
// Mirrors the dependantMap / Promise.all pattern already used for billing tables.
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
    { key: 'name', label: 'Name' },
    { key: 'drugName', label: 'Drug / Injection Name' },
    { key: 'dispenseDate', label: 'Dispense Date' },
    { key: 'dispenseBy', label: 'Dispensed By' },
    { key: 'patientId', label: 'Patient ID' },
  ],
  'Billing Report': [
    { key: 'name', label: 'Name' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'outstandingBalance', label: 'Outstanding Balance' },
    { key: 'paymentDate', label: 'Payment Date' },
    { key: 'attendedBy', label: 'Attended By' },
    { key: 'patientId', label: 'Patient ID' },
  ],
  'Lab Report': [
    { key: 'name', label: 'Name' },
    { key: 'testName', label: 'Test Name' },
    { key: 'testDate', label: 'Test Date' },
    { key: 'status', label: 'Status' },
    { key: 'attendedBy', label: 'Attended By' },
    { key: 'patientId', label: 'Patient ID' },
  ],
  'Patients Report': [
    { key: 'name', label: 'Name' },
    { key: 'patientId', label: 'Patient ID' },
    { key: 'dateRegistered', label: 'Date Registered' },
    { key: 'cardType', label: 'Card Type' },
    { key: 'hmoProvider', label: 'HMO Provider' },
  ],
};

const reportDateKey = {
  'Pharmacy Report': 'dispenseDate',
  'Billing Report': 'paymentDate',
  'Lab Report': 'testDate',
  'Patients Report': 'dateRegistered',
};

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
  const [showAllRows, setShowAllRows] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadReportData = async () => {
      setLoading(true);
      setError('');

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

            const parentPatient = resolveEmbeddedEntity(record?.patientId) || patientMap.get(resolveIdString(record?.patientId));

            const subject = record?.dependantId
              ? (resolveEmbeddedEntity(record.dependantId) || dependantMap.get(resolveIdString(record.dependantId)))
              : parentPatient;

            const pharmacist =
              resolveEmbeddedEntity(record?.pharmacistId) ||
              (record?.pharmacistId ? pharmacistMap.get(resolveIdString(record.pharmacistId)) : null);

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject),
              drugName: medication.drugName || medication.name || record?.drugName || '—',
              injectionName: medication.injectionName || '',
              dispenseDate: record?.updatedAt || record?.createdAt || record?.dispensedAt || record?.date || '',
              dispenseBy: record?.pharmacistName || formatName(pharmacist) || '—',
              patientId: parentPatient?.hospitalId || subject?.patient?.hospitalId || subject?.hospitalId || resolveIdString(record?.patientId) || resolveIdString(record?.dependantId) || '—', };
          });

        } else if (reportType === 'Billing Report') {
          const payload = await getAllBillings();
          const billings = extractArrayFromPayload(payload);
          rows = billings.map((record, index) => {
            const amount = Number(record?.totalAmount || 0);
            const outstanding = Number(record?.outstandingBill || 0);
            const paid = Math.max(amount - outstanding, 0);
            const status = record?.isCleared || outstanding <= 0
              ? 'Paid'
              : outstanding < amount
                ? 'Partial'
                : 'Pending';
            const patient = record?.patient || {};

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(patient) || record?.patientName || '—',
              totalAmount: amount,
              paymentStatus: status,
              outstandingBalance: outstanding,
              paymentDate: record?.createdAt || record?.paymentDate || '',
              attendedBy: record?.cashierName || record?.attendedBy || record?.createdBy || '—',
              patientId: patient?.hospitalId || patient?.patientId || record?.patientId || '—',
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
            if (!key) return;
            investigationMap.set(key, inv);
          });

          rows = results.map((record, index) => {
            const parentPatient = resolveEmbeddedEntity(record?.patientId) || patientMap.get(resolveIdString(record?.patientId));

            const subject = record?.dependantId
              ? (resolveEmbeddedEntity(record.dependantId) || dependantMap.get(resolveIdString(record.dependantId)))
              : parentPatient;

            const technician =
              resolveEmbeddedEntity(record?.labTechnicianId) ||
              (record?.labTechnicianId ? technicianMap.get(resolveIdString(record.labTechnicianId)) : null);

            // Direct link: labResult.investigationRequestId -> investigation._id.
            // Far more reliable than matching by test name.
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

            const status = matchedInvestigation?.status || record?.status || '—';

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject),
              testName,
              testDate: record?.form?.date || record?.createdAt || record?.date || '',
              status,
              attendedBy: record?.labTechnicianName || formatName(technician) || '—',
              patientId: parentPatient?.hospitalId || subject?.hospitalId || resolveIdString(record?.patientId) || resolveIdString(record?.dependantId) || '—',
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
            cardType: patient?.cardType || '—',
            hmoProvider: patient?.hmos?.[0]?.provider || patient?.hmoProvider || '—',
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
      const matchesHospitalId = !searchHospitalId || `${row.patientId || ''}`.toLowerCase().includes(searchHospitalId);
      const matchesDate = isWithinDateRange(row[dateKey], activeDateRange);

      return matchesName && matchesHospitalId && matchesDate;
    });
  }, [activeDateRange, currentRows, dateKey, hospitalIdFilter, nameFilter]);

  const visibleRows = useMemo(() => {
    if (showAllRows) return filteredRows;
    return filteredRows.slice(0, 5);
  }, [filteredRows, showAllRows]);

  const renderCellValue = (row, columnKey) => {
    if (columnKey === 'drugName') {
      return row.drugName || row.injectionName || '—';
    }

    if (columnKey === 'totalAmount') {
      return `₦${Number(row.totalAmount || 0).toLocaleString()}`;
    }

    if (columnKey === 'paymentStatus') {
      const status = row.paymentStatus;
      const badgeClass = status === 'Paid' ? 'badge-success' : status === 'Partial' ? 'badge-warning' : 'badge-ghost';
      return (
        <span className={`badge ${badgeClass}`}>
          {row.paymentStatus || '—'}
        </span>
      );
    }

    if (columnKey === 'status') {
      const statusValue = String(row.status || '').toLowerCase();
      const badgeClass =
        statusValue === 'completed' ? 'badge-success'
        : statusValue === 'in_progress' ? 'badge-info'
        : statusValue === 'cancelled' ? 'badge-error'
        : statusValue === 'pending' ? 'badge-warning'
        : 'badge-ghost';
      return (
        <span className={`badge ${badgeClass}`}>
          {row.status || '—'}
        </span>
      );
    }

    const dateColumns = new Set(['dispenseDate', 'paymentDate', 'testDate', 'dateRegistered']);

    if (dateColumns.has(columnKey)) {
      return formatNigeriaDate(row[columnKey]);
    }

    return row[columnKey] || '—';
  };

  const handleExport = () => {
    exportRowsToCsv(filteredRows, currentColumns, `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report.csv`);
  };

  const resetFilters = () => {
    setDateRangeOption('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setNameFilter('');
    setHospitalIdFilter('');
    setShowAllRows(false);
  };

  return (
    <div className="flex h-screen bg-base-300/20">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col pt-4 pl-6 h-full">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="p-4 rounded-lg shadow-lg bg-base-100">
                <div className="flex flex-col justify-between gap-4 mb-6 lg:flex-row lg:items-center">
                  <div>
                    <h2 className="text-2xl font-normal text-primary">Report Generation</h2>
                    <p className="text-sm text-base-content/70">Pull live records from billing, pharmacy, lab, and patient data sources.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn btn-primary" onClick={handleExport}>
                      <FaDownload className="mr-2 w-4 h-4" />
                      Download CSV
                    </button>
                    <button className="btn btn-outline" onClick={resetFilters}>
                      <FaSave className="mr-2 w-4 h-4" />
                      Reset Filters
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content/70">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setShowAllRows(false);
                      }}
                      className="w-full select select-bordered"
                    >
                      {Object.keys(reportColumnConfig).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content/70">Date Range</label>
                    <select
                      value={dateRangeOption}
                      onChange={(e) => setDateRangeOption(e.target.value)}
                      className="w-full select select-bordered"
                    >
                      {reportDateRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content/70">Name</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Search name"
                        className="w-full pl-10 input input-bordered"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content/70">Hospital ID</label>
                    <div className="relative">
                      <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                      <input
                        type="text"
                        value={hospitalIdFilter}
                        onChange={(e) => setHospitalIdFilter(e.target.value)}
                        placeholder="Enter hospital ID"
                        className="w-full pl-10 input input-bordered"
                      />
                    </div>
                  </div>
                </div>

                {dateRangeOption === 'custom' && (
                  <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-base-content/70">Start Date</label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full pl-10 input input-bordered"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-base-content/70">End Date</label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full pl-10 input input-bordered"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg shadow-lg bg-base-100">
                <div className="flex flex-col justify-between gap-4 mb-4 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-primary">{reportType}</h3>
                    <p className="text-sm text-base-content/70">{filteredRows.length} matching records</p>
                  </div>
                  <div className="flex items-center gap-2 badge badge-outline">
                    <FaFilter className="w-3 h-3" />
                    Updated Filters
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="skeleton h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-lg bg-warning/10 text-warning">{error}</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            {currentColumns.map((column) => (
                              <th key={column.key}>{column.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRows.map((row) => (
                            <tr key={row.id}>
                              {currentColumns.map((column) => (
                                <td key={`${row.id}-${column.key}`}>
                                  {renderCellValue(row, column.key)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredRows.length > 5 && (
                      <div className="flex justify-end mt-4">
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAllRows((prev) => !prev)}>
                          {showAllRows ? 'Show first 5' : `Show all ${filteredRows.length} records`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="p-6 rounded-lg shadow-lg bg-base-100" style={{ height: 'fit-content' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FaFileAlt className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-primary">Report Overview</h2>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-base-200">
                    <p className="text-sm text-base-content/70">Current Report</p>
                    <p className="text-lg font-semibold text-base-content">{reportType}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-base-200">
                    <p className="text-sm text-base-content/70">Visible Records</p>
                    <p className="text-lg font-semibold text-base-content">{filteredRows.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-base-200">
                    <p className="text-sm text-base-content/70">Filter Criteria</p>
                    <ul className="mt-2 space-y-1 text-sm text-base-content/70">
                      <li>• Range: {dateRangeOption === 'custom' ? 'Custom' : reportDateRangeOptions.find((option) => option.value === dateRangeOption)?.label || 'All'}</li>
                      <li>• Name: {nameFilter || 'All'}</li>
                      <li>• Hospital ID: {hospitalIdFilter || 'All'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReports;