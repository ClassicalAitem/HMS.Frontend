import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SuperAdminLayout } from '@/layouts/superadmin';
import KolakLoader from '@/components/common/KolakLoader';
import {
  FaDownload,
  FaPrint,
  FaUndo,
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
  FaDatabase,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaChartLine,
} from 'react-icons/fa';
import { getAllBillings } from '@/services/api/billingAPI';
import { getPrescriptions } from '@/services/api/prescriptionsAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getPatients } from '@/services/api/patientsAPI';
import { getAllAppointments } from '@/services/api/appointmentsAPI';
import { getInventories } from '@/services/api/inventoryAPI';
import { getInvestigations } from '@/services/api/investigationAPI';
import { isDateInPeriod, exportRowsToCsv } from './reportUtils';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';

const extractArrayFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (payload && typeof payload === 'object') return [payload];
  return [];
};

const formatName = (subject) => {
  if (!subject) return '—';
  if (typeof subject === 'string') return subject;
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

const reportColumnConfig = {
  'Pharmacy Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'drugName', label: 'Drug / Prescription' },
    { key: 'dispenseDate', label: 'Dispense Date' },
    { key: 'dispenseBy', label: 'Dispensed By' },
    { key: 'patientId', label: 'Hospital ID' },
  ],
  'Billing Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'totalAmount', label: 'Total Invoiced' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'outstandingBalance', label: 'Outstanding Balance' },
    { key: 'paymentDate', label: 'Billing Date' },
    { key: 'attendedBy', label: 'Cashier / Officer' },
    { key: 'patientId', label: 'Hospital ID' },
  ],
  'Lab Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'testName', label: 'Investigation Test' },
    { key: 'testDate', label: 'Test Date' },
    { key: 'status', label: 'Result Status' },
    { key: 'attendedBy', label: 'Lab Scientist' },
    { key: 'patientId', label: 'Hospital ID' },
  ],
  'Patients Report': [
    { key: 'name', label: 'Patient Full Name' },
    { key: 'patientId', label: 'Hospital ID' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'dateRegistered', label: 'Date Registered' },
    { key: 'cardType', label: 'Card Scheme' },
    { key: 'hmoProvider', label: 'HMO Provider' },
  ],
  'Appointments Report': [
    { key: 'name', label: 'Patient Name' },
    { key: 'patientId', label: 'Hospital ID' },
    { key: 'appointmentDate', label: 'Scheduled Date & Time' },
    { key: 'department', label: 'Clinical Department' },
    { key: 'appointmentType', label: 'Appointment Type' },
    { key: 'status', label: 'Status' },
  ],
  'Inventory Report': [
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Current Stock' },
    { key: 'reorderLevel', label: 'Reorder Level' },
    { key: 'stockStatus', label: 'Stock Status' },
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

const PERIOD_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

const GenerateReports = () => {
  const [reportType, setReportType] = useState('Pharmacy Report');
  const [period, setPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [reportRows, setReportRows] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Load report data dynamically when tab changes
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

          rows = prescriptions.map((record, index) => {
            const medications = Array.isArray(record?.medications) ? record.medications : [];
            const medication = medications[0] || {};
            const parentPatient = record?.patient || resolveEmbeddedEntity(record?.patientId);
            const subject =
              record?.dependant ||
              (record?.dependantId ? resolveEmbeddedEntity(record?.dependantId) : parentPatient) ||
              parentPatient;
            const pharmacist = record?.pharmacist || resolveEmbeddedEntity(record?.pharmacistId) || null;

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject),
              drugName: medication.drugName || medication.name || record?.drugName || '—',
              dispenseDate: record?.updatedAt || record?.createdAt || record?.dispensedAt || record?.date || '',
              dispenseBy: record?.pharmacistName || formatName(pharmacist) || 'Attending Pharmacist',
              patientId:
                parentPatient?.hospitalId ||
                subject?.patient?.hospitalId ||
                subject?.hospitalId ||
                resolveIdString(record?.patientId) ||
                '—',
              raw: record,
            };
          });
        } else if (reportType === 'Billing Report') {
          const payload = await getAllBillings();
          const billings = extractArrayFromPayload(payload);

          rows = billings.map((record, index) => {
            const amount = Number(record?.totalAmount || 0);
            const outstanding = Number(record?.outstandingBill || 0);
            const status =
              record?.isCleared || outstanding <= 0
                ? 'Paid'
                : outstanding < amount
                ? 'Partial'
                : 'Pending';

            const parentPatient = record?.patient || resolveEmbeddedEntity(record?.patientId);
            const subject =
              record?.dependant ||
              (record?.dependantId ? resolveEmbeddedEntity(record?.dependantId) : parentPatient) ||
              parentPatient;

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject) || record?.patientName || 'Medical Patient',
              totalAmount: amount,
              paymentStatus: status,
              outstandingBalance: outstanding,
              paymentDate: record?.createdAt || record?.paymentDate || '',
              attendedBy: record?.raisedBy?.firstName
                ? `${record.raisedBy.firstName} ${record.raisedBy.lastName || ''}`.trim()
                : record?.cashierName || record?.attendedBy || 'Billing Officer',
              patientId:
                parentPatient?.hospitalId ||
                subject?.patient?.hospitalId ||
                subject?.hospitalId ||
                resolveIdString(record?.patientId) ||
                '—',
              raw: record,
            };
          });
        } else if (reportType === 'Lab Report') {
          const [resultsPayload, investigationsPayload] = await Promise.allSettled([
            getLabResults(),
            getInvestigations(),
          ]);

          const results = resultsPayload.status === 'fulfilled' ? extractArrayFromPayload(resultsPayload.value) : [];
          const allInvestigations =
            investigationsPayload.status === 'fulfilled' ? extractArrayFromPayload(investigationsPayload.value) : [];

          const investigationMap = new Map();
          allInvestigations.forEach((inv) => {
            const key = inv?._id || inv?.id;
            if (key) investigationMap.set(key, inv);
          });

          rows = results.map((record, index) => {
            const parentPatient = record?.patient || resolveEmbeddedEntity(record?.patientId);
            const subject =
              record?.dependant ||
              (record?.dependantId ? resolveEmbeddedEntity(record?.dependantId) : parentPatient) ||
              parentPatient;
            const technician = record?.technician || resolveEmbeddedEntity(record?.labTechnicianId) || null;

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
              'Standard Laboratory Analysis';

            const rawStatus = matchedInvestigation?.status || record?.status || 'completed';

            return {
              id: record?._id || record?.id || `${reportType}-${index}`,
              name: formatName(subject),
              testName,
              testDate: record?.form?.date || record?.createdAt || record?.date || '',
              status: rawStatus,
              attendedBy: record?.labTechnicianName || formatName(technician) || 'Medical Laboratory',
              patientId:
                parentPatient?.hospitalId ||
                subject?.hospitalId ||
                resolveIdString(record?.patientId) ||
                '—',
              raw: record,
            };
          });
        } else if (reportType === 'Patients Report') {
          const payload = await getPatients({ limit: 'all' });
          const patients = extractArrayFromPayload(payload);
          rows = patients.map((patient, index) => ({
            id: patient?._id || patient?.id || `${reportType}-${index}`,
            name: formatName(patient),
            patientId: patient?.hospitalId || patient?.patientId || `KOLAK-${String(index + 1).padStart(4, '0')}`,
            phone: patient?.phone || patient?.phoneNumber || '—',
            dateRegistered: patient?.createdAt || patient?.dateRegistered || '',
            cardType: patient?.cardType || patient?.cardTypes?.[0] || 'Individual',
            hmoProvider: patient?.hmos?.[0]?.provider || patient?.hmoProvider || 'Self Pay (Private)',
            raw: patient,
          }));
        } else if (reportType === 'Appointments Report') {
          const payload = await getAllAppointments({ limit: 'all' });
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
              raw: a,
            };
          });
        } else if (reportType === 'Inventory Report') {
          const payload = await getInventories();
          const items = extractArrayFromPayload(payload);
          rows = items.map((item, index) => {
            const stock = Number(item?.stock ?? item?.quantity ?? 0);
            const reorderLevel = Number(item?.reorderLevel ?? 10);
            const isLow = stock <= reorderLevel;

            return {
              id: item?._id || item?.id || `${reportType}-${index}`,
              name: item?.name || 'Supply Item',
              category: item?.category || item?.form || 'Medical Consumables',
              stock,
              reorderLevel,
              stockStatus: isLow ? 'Low Stock' : 'In Stock',
              sellingPrice: item?.sellingPrice ? `₦${Number(item.sellingPrice).toLocaleString()}` : '—',
              expiryDate: item?.expiryDate || '',
              raw: item,
            };
          });
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

  // Dynamic filtering
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return currentRows.filter((row) => {
      // 1. Text Search Filter across all fields
      if (q) {
        const matches =
          String(row.name || '').toLowerCase().includes(q) ||
          String(row.patientId || '').toLowerCase().includes(q) ||
          String(row.drugName || '').toLowerCase().includes(q) ||
          String(row.testName || '').toLowerCase().includes(q) ||
          String(row.attendedBy || '').toLowerCase().includes(q) ||
          String(row.dispenseBy || '').toLowerCase().includes(q) ||
          String(row.category || '').toLowerCase().includes(q) ||
          String(row.department || '').toLowerCase().includes(q) ||
          String(row.phone || '').toLowerCase().includes(q);

        if (!matches) return false;
      }

      // 2. Secondary Dropdown Status / Category Filter
      if (statusFilter !== 'all') {
        if (reportType === 'Billing Report') {
          if (String(row.paymentStatus || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
        } else if (reportType === 'Lab Report' || reportType === 'Appointments Report') {
          if (String(row.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
        } else if (reportType === 'Inventory Report') {
          if (String(row.stockStatus || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
        } else if (reportType === 'Patients Report') {
          if (String(row.cardType || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
        }
      }

      // 3. Period Date Filter
      if (period !== 'all') {
        const dateVal = row[dateKey];
        if (!isDateInPeriod(dateVal, period, customStartDate, customEndDate)) {
          return false;
        }
      }

      return true;
    });
  }, [currentRows, dateKey, period, customStartDate, customEndDate, searchTerm, statusFilter, reportType]);

  // Dynamic KPI Metrics calculated from current active report data
  const metrics = useMemo(() => {
    const total = currentRows.length;
    const filteredCount = filteredRows.length;

    if (reportType === 'Billing Report') {
      const totalBilled = filteredRows.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
      const totalOutstanding = filteredRows.reduce((acc, curr) => acc + (Number(curr.outstandingBalance) || 0), 0);
      const paidCount = filteredRows.filter((r) => r.paymentStatus === 'Paid').length;
      return {
        card1Title: 'Total Invoiced',
        card1Value: `₦${totalBilled.toLocaleString()}`,
        card1Sub: `${filteredCount} billed accounts`,
        card2Title: 'Outstanding Balance',
        card2Value: `₦${totalOutstanding.toLocaleString()}`,
        card2Sub: 'Unpaid / pending collections',
        card3Title: 'Settled Invoices',
        card3Value: paidCount.toLocaleString(),
        card3Sub: 'Cleared payments',
        card4Title: 'Pending Settlement',
        card4Value: (filteredCount - paidCount).toLocaleString(),
        card4Sub: 'Partial & pending',
      };
    }

    if (reportType === 'Pharmacy Report') {
      const uniquePatients = new Set(filteredRows.map((r) => r.patientId).filter((id) => id && id !== '—')).size;
      return {
        card1Title: 'Total Prescriptions',
        card1Value: total.toLocaleString(),
        card1Sub: 'Catalogued dispenses',
        card2Title: 'Period Records',
        card2Value: filteredCount.toLocaleString(),
        card2Sub: 'Matching filter criteria',
        card3Title: 'Patients Served',
        card3Value: uniquePatients.toLocaleString(),
        card3Sub: 'Unique clinical recipients',
        card4Title: 'Fulfillment Rate',
        card4Value: '100%',
        card4Sub: 'Active pharmacy stock',
      };
    }

    if (reportType === 'Lab Report') {
      const completed = filteredRows.filter((r) => String(r.status).toLowerCase().includes('completed')).length;
      const pending = filteredCount - completed;
      return {
        card1Title: 'Total Lab Records',
        card1Value: total.toLocaleString(),
        card1Sub: 'Recorded investigations',
        card2Title: 'Completed Tests',
        card2Value: completed.toLocaleString(),
        card2Sub: 'Results finalized & signed',
        card3Title: 'Pending / In Progress',
        card3Value: pending.toLocaleString(),
        card3Sub: 'Awaiting lab validation',
        card4Title: 'Filtered Volume',
        card4Value: filteredCount.toLocaleString(),
        card4Sub: 'Active search scope',
      };
    }

    if (reportType === 'Patients Report') {
      const individual = filteredRows.filter((r) => String(r.cardType).toLowerCase().includes('individual')).length;
      const hmo = filteredRows.filter((r) => !String(r.hmoProvider).toLowerCase().includes('self pay')).length;
      return {
        card1Title: 'Total Patients',
        card1Value: total.toLocaleString(),
        card1Sub: 'Hospital registered directory',
        card2Title: 'Filtered Records',
        card2Value: filteredCount.toLocaleString(),
        card2Sub: 'Current view criteria',
        card3Title: 'Individual Cardholders',
        card3Value: individual.toLocaleString(),
        card3Sub: 'Private accounts',
        card4Title: 'HMO & Corporate',
        card4Value: hmo.toLocaleString(),
        card4Sub: 'Managed healthcare scheme',
      };
    }

    if (reportType === 'Appointments Report') {
      const completed = filteredRows.filter((r) => String(r.status).toLowerCase() === 'completed').length;
      const scheduled = filteredRows.filter((r) => String(r.status).toLowerCase() === 'scheduled').length;
      const cancelled = filteredRows.filter((r) => String(r.status).toLowerCase() === 'cancelled').length;
      return {
        card1Title: 'Total Bookings',
        card1Value: total.toLocaleString(),
        card1Sub: 'Registered appointments',
        card2Title: 'Scheduled & Active',
        card2Value: scheduled.toLocaleString(),
        card2Sub: 'Upcoming doctor sessions',
        card3Title: 'Completed Consults',
        card3Value: completed.toLocaleString(),
        card3Sub: 'Successfully attended',
        card4Title: 'Cancelled / Voided',
        card4Value: cancelled.toLocaleString(),
        card4Sub: 'Rescheduled or cancelled',
      };
    }

    // Supplies & Inventory Report
    const totalUnits = filteredRows.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
    const lowStockCount = filteredRows.filter((r) => r.stockStatus === 'Low Stock').length;
    return {
      card1Title: 'Inventory Items',
      card1Value: total.toLocaleString(),
      card1Sub: 'Master catalog records',
      card2Title: 'Stock On Hand',
      card2Value: totalUnits.toLocaleString(),
      card2Sub: 'Total inventory units',
      card3Title: 'Low Stock Alerts',
      card3Value: lowStockCount.toLocaleString(),
      card3Sub: 'At or below reorder level',
      card4Title: 'Adequate Stock',
      card4Value: (filteredCount - lowStockCount).toLocaleString(),
      card4Sub: 'Optimal clinical supply',
    };
  }, [currentRows, filteredRows, reportType]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, itemsPerPage]);

  const renderCellValue = (row, columnKey) => {
    if (columnKey === 'totalAmount' || columnKey === 'outstandingBalance') {
      return (
        <span className="font-semibold text-base-content">
          ₦{Number(row[columnKey] || 0).toLocaleString()}
        </span>
      );
    }

    if (columnKey === 'patientId') {
      return (
        <span className="font-mono text-xs font-bold text-primary">
          {row.patientId || '—'}
        </span>
      );
    }

    if (columnKey === 'paymentStatus') {
      const status = row.paymentStatus;
      const badgeClass =
        status === 'Paid'
          ? 'badge-success text-white'
          : status === 'Partial'
          ? 'badge-warning text-amber-950 font-bold'
          : 'badge-ghost text-base-content/70';
      return <span className={`badge badge-sm font-semibold ${badgeClass}`}>{row.paymentStatus || '—'}</span>;
    }

    if (columnKey === 'status') {
      const s = String(row.status || '').toLowerCase();
      const badgeClass =
        s === 'completed' || s === 'active'
          ? 'badge-success text-white'
          : s === 'in_progress' || s === 'scheduled'
          ? 'badge-info text-white'
          : s === 'cancelled'
          ? 'badge-error text-white'
          : s === 'pending'
          ? 'badge-warning text-amber-950 font-bold'
          : 'badge-ghost';
      return <span className={`badge badge-sm font-semibold capitalize ${badgeClass}`}>{row.status || '—'}</span>;
    }

    if (columnKey === 'stockStatus') {
      const isLow = row.stockStatus === 'Low Stock';
      return (
        <span
          className={`badge badge-sm font-semibold ${
            isLow ? 'badge-error text-white' : 'badge-success text-white'
          }`}
        >
          {row.stockStatus}
        </span>
      );
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
      return <span className="text-base-content/70">{formatNigeriaDate(row[columnKey])}</span>;
    }

    return <span className="text-base-content">{row[columnKey] || '—'}</span>;
  };

  const handleExport = () => {
    if (!filteredRows.length) {
      toast.error('No records available to export.');
      return;
    }
    const cleanFileName = `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    exportRowsToCsv(filteredRows, currentColumns, cleanFileName);
    toast.success(`Exported ${filteredRows.length} records to ${cleanFileName}`);
  };

  const handlePrint = () => {
    if (!filteredRows.length) {
      toast.error('No records available to print.');
      return;
    }
    window.print();
  };

  const resetFilters = () => {
    setPeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset to default.');
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 pb-12">
        {/* Sleek Modern Header Bar */}
        <div className="bg-base-100 border border-base-200/80 px-5 py-3.5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
              <FaPrint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-base-content">
                  Generate Hospital Reports
                </h1>
                <span className="badge badge-xs badge-success gap-1 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Reporting Engine
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Clinical performance, financial ledger, pharmacy dispensations, lab logs, and compliance records
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-ghost border border-base-300 btn-sm rounded-xl text-base-content hover:bg-base-200 font-medium gap-1.5"
              title="Reset all search and date filters"
            >
              <FaUndo className="w-3 h-3 text-base-content/70" />
              <span>Reset Filters</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!filteredRows.length || loading}
              className="btn btn-ghost border border-base-300 btn-sm rounded-xl text-base-content hover:bg-base-200 font-medium gap-1.5"
              title="Print this report"
            >
              <FaPrint className="w-3.5 h-3.5 text-base-content/70" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!filteredRows.length || loading}
              className="btn btn-primary btn-sm rounded-xl px-4 shadow-xs text-white font-semibold gap-1.5"
              title="Export filtered records to CSV"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            REPORT CATEGORY PILLS (TABS)
            ========================================================================= */}
        <div className="flex flex-wrap items-center gap-2 bg-base-100 p-2 rounded-2xl border border-base-200 shadow-xs">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = reportType === tab.id;
            const rowCount = reportRows[tab.id]?.length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setReportType(tab.id);
                  setStatusFilter('all');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-200/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {rowCount !== undefined && (
                  <span
                    className={`badge badge-xs font-semibold px-1.5 py-0.5 ${
                      isActive ? 'bg-white/25 text-white border-none' : 'badge-ghost'
                    }`}
                  >
                    {rowCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TOP 4 DYNAMIC KPI METRIC CARDS
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                {metrics.card1Title}
              </span>
              <h3 className="text-2xl font-black text-base-content mt-1">
                {loading ? '—' : metrics.card1Value}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">{metrics.card1Sub}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FaDatabase className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                {metrics.card2Title}
              </span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {loading ? '—' : metrics.card2Value}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">{metrics.card2Sub}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <FaChartLine className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                {metrics.card3Title}
              </span>
              <h3 className="text-2xl font-black text-info mt-1">
                {loading ? '—' : metrics.card3Value}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">{metrics.card3Sub}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0">
              <FaCheckCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                {metrics.card4Title}
              </span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {loading ? '—' : metrics.card4Value}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">{metrics.card4Sub}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <FaCalendarAlt className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            COMPREHENSIVE FILTER CONTROLS BAR
            ========================================================================= */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5 space-y-4">
          {/* Top Row: Period Selector & Results Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Quick Period Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-base-content/60 mr-1 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3 text-primary" /> Period:
              </span>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPeriod(opt.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    period === opt.id
                      ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                      : 'bg-base-200 text-base-content/70 hover:bg-base-300 hover:text-base-content'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Records Count Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-base-content/60">Matching:</span>
              <span className="badge badge-primary badge-sm font-bold">
                {filteredRows.length} of {currentRows.length} Entries
              </span>
            </div>
          </div>

          {/* Bottom Row: Search Box & Contextual Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1 border-t border-base-200">
            {/* Live Search Input */}
            <div className="lg:col-span-5 relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, hospital ID, item, or personnel..."
                className="input input-sm input-bordered w-full rounded-xl pl-9 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Contextual Secondary Filter Dropdown */}
            {reportType === 'Billing Report' && (
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Partial">Partially Paid</option>
                  <option value="Pending">Pending Payment</option>
                </select>
              </div>
            )}

            {reportType === 'Lab Report' && (
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Investigation Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {reportType === 'Appointments Report' && (
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Appointment Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {reportType === 'Inventory Report' && (
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="Low Stock">Low Stock Alert</option>
                  <option value="In Stock">Adequate Stock</option>
                </select>
              </div>
            )}

            {reportType === 'Patients Report' && (
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Card Schemes</option>
                  <option value="individual">Individual</option>
                  <option value="family">Family</option>
                  <option value="hmo">HMO Scheme</option>
                  <option value="company">Company / Corporate</option>
                </select>
              </div>
            )}

            {/* Custom Date Pickers (Shown when custom period is selected) */}
            {period === 'custom' && (
              <div className="lg:col-span-4 flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  placeholder="Start Date"
                />
                <span className="text-xs text-base-content/50">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  placeholder="End Date"
                />
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            REPORT DATA TABLE
            ========================================================================= */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden flex flex-col">
          {/* Table Header Bar */}
          <div className="p-4 sm:p-5 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-base-content flex items-center gap-2">
                <span>{reportType}</span>
                <span className="badge badge-sm badge-outline text-xs">{filteredRows.length} items</span>
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Official institutional record sheet extracted from central medical database
              </p>
            </div>

            {/* Per-Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-base-content/60 font-medium">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="select select-bordered select-xs rounded-lg text-xs"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center min-h-[320px]">
              <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
              <p className="text-sm font-semibold text-base-content/70">
                Extracting {reportType} records...
              </p>
              <p className="text-xs text-base-content/50 mt-1">
                Synchronizing live hospital data
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error flex flex-col items-center justify-center">
              <FaExclamationTriangle className="w-8 h-8 mb-2 text-error/70" />
              <p className="font-semibold text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-xs">
                  <thead className="bg-base-200/70 text-base-content/80 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
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
                          colSpan={currentColumns.length + 1}
                          className="py-16 text-center text-base-content/50"
                        >
                          <FaFileAlt className="w-10 h-10 mx-auto text-base-content/20 mb-3" />
                          <p className="text-sm font-bold text-base-content/70">No matching records found</p>
                          <p className="text-xs text-base-content/50 mt-1 max-w-sm mx-auto">
                            There are no entries matching your active date range or search keyword.
                          </p>
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="btn btn-outline btn-xs mt-3 gap-1 rounded-lg"
                          >
                            <FaUndo className="w-2.5 h-2.5" />
                            <span>Reset Filters</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, idx) => {
                        const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                        return (
                          <tr key={row.id} className="hover:bg-base-200/50 transition-colors">
                            <td className="py-3 px-4 text-center text-base-content/50 font-mono text-xs">
                              {serialNumber}
                            </td>
                            {currentColumns.map((column) => (
                              <td key={`${row.id}-${column.key}`} className="py-3 px-4 font-medium">
                                {renderCellValue(row, column.key)}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100">
                  <span className="text-xs text-base-content/60">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length} entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-outline btn-xs rounded-lg gap-1"
                    >
                      <FaChevronLeft className="w-2.5 h-2.5" />
                      <span>Prev</span>
                    </button>
                    <span className="px-3 text-xs font-bold text-base-content">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-outline btn-xs rounded-lg gap-1"
                    >
                      <span>Next</span>
                      <FaChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default GenerateReports;
