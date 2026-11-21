import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/superadmin/dashboard';
import {
  FaFileInvoiceDollar,
  FaSearch,
  FaFilter,
  FaTag,
  FaEye,
  FaChild,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaChevronDown,
  FaChevronRight,
  FaSyncAlt,
} from 'react-icons/fa';
import KolakLoader from '@/components/common/KolakLoader';
import AdjustDiscountModal from '@/components/modals/AdjustDiscountModal';
import { getAllBillings } from '@/services/api/billingAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import { getDiscountDisplay } from '@/utils/discountUtils';
import toast from 'react-hot-toast';

const SuperAdminBillings = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all'); // all, patient, dependant
  const [statusFilter, setStatusFilter] = useState('all'); // all, outstanding, cleared, discounted
  const [openRowId, setOpenRowId] = useState(null);

  // Discount modal state
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);

  const fetchBillings = useCallback(async (showToast = false) => {
    try {
      setIsLoading(true);
      const res = await getAllBillings();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : [];

      // Fetch missing dependants if needed
      const missingDependantIds = [
        ...new Set(
          list
            .filter((b) => b.dependantId && !b.dependant)
            .map((b) => b.dependantId)
        ),
      ];

      let extraDependantMap = {};
      if (missingDependantIds.length > 0) {
        try {
          const entries = await Promise.all(
            missingDependantIds.map((id) =>
              getDependantById(id)
                .then((r) => [id, r?.data?.data?.dependant || r?.data?.dependant || r?.data])
                .catch(() => [id, null])
            )
          );
          extraDependantMap = Object.fromEntries(entries);
        } catch (e) {
          console.warn('Could not populate some dependants:', e);
        }
      }

      const enriched = list.map((bill) => {
        const isDependant = !!bill.dependantId;
        const depObj = isDependant ? bill.dependant || extraDependantMap[bill.dependantId] : null;
        const patientObj = bill.patient || bill.opdPatient || null;

        let subjectName = 'Patient';
        if (isDependant) {
          subjectName = depObj
            ? `${depObj.firstName || ''} ${depObj.lastName || ''}`.trim() || 'Dependant'
            : 'Dependant';
        } else if (patientObj) {
          subjectName = `${patientObj.firstName || ''} ${patientObj.lastName || ''}`.trim() || 'Patient';
        }

        const guardianName = isDependant && bill.patient
          ? `${bill.patient.firstName || ''} ${bill.patient.lastName || ''}`.trim()
          : null;

        return {
          ...bill,
          _isDependant: isDependant,
          _dependantObj: depObj,
          _subjectName: subjectName,
          _guardianName: guardianName,
          _patientId: bill.patientId || bill.patient?.id || bill.patient?._id,
          _hospitalId: bill.patient?.hospitalId || bill.opdPatient?.hospitalId || '—',
        };
      });

      // Sort newest first
      enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setBillings(enriched);

      if (showToast) {
        toast.success('Billing records refreshed');
      }
    } catch (err) {
      console.error('Failed to load billings for Super Admin:', err);
      toast.error('Could not load billing records');
      setBillings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const toggleRow = (id) => {
    setOpenRowId((prev) => (prev === id ? null : id));
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalOutstanding = 0;
    let totalDiscounts = 0;
    let clearedCount = 0;

    billings.forEach((b) => {
      const gross = Number(b.subtotalAmount || b.totalAmount || 0);
      const disc = Number(b.discountAmount || 0);
      const out = b.isCleared ? 0 : Number(b.outstandingBill !== undefined ? b.outstandingBill : b.totalAmount || 0);

      totalBilled += gross;
      totalDiscounts += disc;
      totalOutstanding += out;
      if (b.isCleared || out === 0) clearedCount += 1;
    });

    return {
      count: billings.length,
      totalBilled,
      totalOutstanding,
      totalDiscounts,
      clearedCount,
    };
  }, [billings]);

  // Filtered billings
  const filteredBillings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return billings.filter((bill) => {
      // Subject filter
      if (subjectFilter === 'patient' && bill._isDependant) return false;
      if (subjectFilter === 'dependant' && !bill._isDependant) return false;

      // Status filter
      const out = bill.isCleared ? 0 : Number(bill.outstandingBill !== undefined ? bill.outstandingBill : bill.totalAmount || 0);
      const hasDiscount = Number(bill.discountAmount || 0) > 0;
      if (statusFilter === 'outstanding' && (bill.isCleared || out === 0)) return false;
      if (statusFilter === 'cleared' && (!bill.isCleared && out > 0)) return false;
      if (statusFilter === 'discounted' && !hasDiscount) return false;

      // Text search
      if (q) {
        const name = (bill._subjectName || '').toLowerCase();
        const guardian = (bill._guardianName || '').toLowerCase();
        const hospId = (bill._hospitalId || '').toLowerCase();
        const raisedBy = `${bill.raisedBy?.firstName || ''} ${bill.raisedBy?.lastName || ''}`.toLowerCase();
        const billId = String(bill.id || bill._id || '').toLowerCase();

        return (
          name.includes(q) ||
          guardian.includes(q) ||
          hospId.includes(q) ||
          raisedBy.includes(q) ||
          billId.includes(q)
        );
      }

      return true;
    });
  }, [billings, searchTerm, subjectFilter, statusFilter]);

  const handleOpenDiscountModal = (bill) => {
    setSelectedBilling(bill);
    setIsDiscountModalOpen(true);
  };

  const handleViewPatientProfile = (bill) => {
    if (!bill._patientId) {
      toast.error('No associated patient profile ID found.');
      return;
    }
    const query = bill._isDependant && bill.dependantId ? `?dependantId=${bill.dependantId}` : '';
    navigate(`/superadmin/patients/patientDetails/${bill._patientId}${query}`, {
      state: {
        dependantId: bill.dependantId,
        dependantSnapshot: bill._dependantObj,
      },
    });
  };

  return (
    <BaseRoleLayout Sidebar={Sidebar}>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
              <FaFileInvoiceDollar className="w-7 h-7" />
              <h1>Hospital Patient Billings</h1>
            </div>
            <p className="text-sm text-base-content/70 mt-1">
              Super Admin & Medical Director master billing ledger. Review itemized charges, audit cashier collections, and grant or adjust patient discounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchBillings(true)}
              className="btn btn-outline btn-primary btn-sm gap-2"
              title="Refresh billing records"
            >
              <FaSyncAlt className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
            <div className="stat-figure text-primary">
              <FaFileInvoiceDollar className="w-8 h-8 opacity-70" />
            </div>
            <div className="stat-title text-xs font-semibold text-base-content/70">Total Bills Raised</div>
            <div className="stat-value text-2xl font-bold text-primary mt-1">{metrics.count}</div>
            <div className="stat-desc text-xs mt-1 text-success font-medium">
              {metrics.clearedCount} Paid / Cleared
            </div>
          </div>

          <div className="stat bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
            <div className="stat-figure text-info">
              <FaCheckCircle className="w-8 h-8 opacity-70" />
            </div>
            <div className="stat-title text-xs font-semibold text-base-content/70">Total Gross Billed</div>
            <div className="stat-value text-2xl font-bold text-base-content mt-1">
              ₦{metrics.totalBilled.toLocaleString()}
            </div>
            <div className="stat-desc text-xs mt-1 text-base-content/60">Before waivers & discounts</div>
          </div>

          <div className="stat bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
            <div className="stat-figure text-warning">
              <FaClock className="w-8 h-8 opacity-70" />
            </div>
            <div className="stat-title text-xs font-semibold text-base-content/70">Outstanding Due</div>
            <div className="stat-value text-2xl font-bold text-warning mt-1">
              ₦{metrics.totalOutstanding.toLocaleString()}
            </div>
            <div className="stat-desc text-xs mt-1 text-warning font-medium">Awaiting Cashier clearance</div>
          </div>

          <div className="stat bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
            <div className="stat-figure text-secondary">
              <FaTag className="w-8 h-8 opacity-70" />
            </div>
            <div className="stat-title text-xs font-semibold text-base-content/70">Discounts Approved</div>
            <div className="stat-value text-2xl font-bold text-secondary mt-1">
              ₦{metrics.totalDiscounts.toLocaleString()}
            </div>
            <div className="stat-desc text-xs mt-1 text-secondary font-medium">Granted by Medical Director</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient, dependant, hospital ID, staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm w-full pl-10 bg-base-200/50 focus:bg-base-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 text-xs text-base-content/70">
              <FaFilter className="w-3 h-3" />
              <span>Subject:</span>
              <select
                className="select select-bordered select-xs"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">All (Patients & Dependants)</option>
                <option value="patient">Primary Patients Only</option>
                <option value="dependant">Dependants Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-base-content/70">
              <span>Status:</span>
              <select
                className="select select-bordered select-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="outstanding">Outstanding Bills Only</option>
                <option value="cleared">Paid / Cleared Only</option>
                <option value="discounted">Discounted Bills Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Billings Table */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <span>Billed Invoices & Services</span>
              <span className="badge badge-sm badge-neutral">{filteredBillings.length} records</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-16">
              <KolakLoader />
            </div>
          ) : filteredBillings.length === 0 ? (
            <div className="text-center py-16 text-base-content/60">
              <FaFileInvoiceDollar className="w-12 h-12 mx-auto text-base-content/20 mb-3" />
              <p className="font-semibold text-base">No billing records matched your filters.</p>
              <p className="text-xs text-base-content/50 mt-1">
                Try searching with another keyword or resetting the filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200 text-xs font-semibold text-base-content/70">
                    <th className="w-10"></th>
                    <th>Date & Time</th>
                    <th>Patient / Subject</th>
                    <th>Hospital ID</th>
                    <th>Billed Total</th>
                    <th>Outstanding</th>
                    <th>Raised By</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillings.map((bill) => {
                    const gross = Number(bill.subtotalAmount || bill.totalAmount || 0);
                    const disc = Number(bill.discountAmount || 0);
                    const out = bill.isCleared
                      ? 0
                      : Number(bill.outstandingBill !== undefined ? bill.outstandingBill : bill.totalAmount || 0);
                    const isOpen = openRowId === bill.id;

                    return (
                      <React.Fragment key={bill.id}>
                        <tr className="text-sm hover:bg-base-200/40 transition-colors border-b border-base-200">
                          {/* Row expand toggle */}
                          <td
                            onClick={() => toggleRow(bill.id)}
                            className="cursor-pointer select-none text-center text-primary"
                            title={isOpen ? 'Collapse item details' : 'Expand item details'}
                          >
                            {isOpen ? (
                              <FaChevronDown className="w-3.5 h-3.5 mx-auto" />
                            ) : (
                              <FaChevronRight className="w-3.5 h-3.5 mx-auto text-base-content/40" />
                            )}
                          </td>

                          {/* Date */}
                          <td className="font-medium whitespace-nowrap">
                            {formatNigeriaDateTime(bill.createdAt)}
                          </td>

                          {/* Patient / Subject Name */}
                          <td>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleViewPatientProfile(bill)}
                                className="font-semibold text-left text-primary hover:underline flex items-center gap-1.5"
                                title="View Patient / Dependant Profile"
                              >
                                {bill._isDependant ? (
                                  <FaChild className="w-3.5 h-3.5 text-secondary shrink-0" />
                                ) : (
                                  <FaUser className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                                <span>{bill._subjectName}</span>
                              </button>

                              {bill._isDependant && bill._guardianName && (
                                <span className="text-[11px] text-base-content/60 mt-0.5">
                                  Dep. of {bill._guardianName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Hospital ID */}
                          <td className="font-mono text-xs font-semibold text-base-content/80">
                            {bill._hospitalId}
                          </td>

                          {/* Billed Amount & Discount Tag */}
                          <td>
                            <div className="font-semibold text-base-content">
                              ₦{gross.toLocaleString()}
                            </div>
                            {disc > 0 && (
                              <span className="badge badge-warning badge-xs font-semibold gap-1 mt-1 block w-fit">
                                Discount: ₦{disc.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Outstanding Bill */}
                          <td>
                            <div className={`font-semibold ${out > 0 ? 'text-warning' : 'text-success'}`}>
                              ₦{out.toLocaleString()}
                            </div>
                            {disc > 0 && out > 0 && (
                              <span className="text-[11px] text-warning block">
                                (After ₦{disc.toLocaleString()} discount)
                              </span>
                            )}
                          </td>

                          {/* Raised By */}
                          <td className="text-success font-medium">
                            {bill.raisedBy?.firstName || 'Staff'} {bill.raisedBy?.lastName || ''}
                          </td>

                          {/* Role */}
                          <td className="text-success text-xs font-medium uppercase">
                            {bill.raisedBy?.accountType || '—'}
                          </td>

                          {/* Status */}
                          <td>
                            {bill.isCleared || out === 0 ? (
                              <span className="badge badge-success badge-sm font-semibold gap-1">
                                <FaCheckCircle className="w-2.5 h-2.5" />
                                Paid
                              </span>
                            ) : (
                              <span className="badge badge-warning badge-sm font-semibold gap-1">
                                <FaClock className="w-2.5 h-2.5" />
                                Outstanding
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Add / Edit Discount button */}
                              <button
                                type="button"
                                onClick={() => handleOpenDiscountModal(bill)}
                                className={`btn btn-xs gap-1 ${
                                  disc > 0
                                    ? 'btn-warning btn-outline'
                                    : 'btn-outline text-warning hover:bg-warning hover:text-warning-content'
                                }`}
                                title="Super Admin / Medical Director: Grant or adjust discount"
                              >
                                <FaTag className="w-2.5 h-2.5" />
                                <span>{disc > 0 ? 'Edit Discount' : 'Add Discount'}</span>
                              </button>

                              {/* View Profile */}
                              <button
                                type="button"
                                onClick={() => handleViewPatientProfile(bill)}
                                className="btn btn-ghost btn-xs text-primary"
                                title="Open Patient Profile"
                              >
                                <FaEye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible Line Items Breakdown */}
                        {isOpen && (
                          <tr>
                            <td colSpan={10} className="bg-base-200/50 p-4 border-b border-base-200">
                              <div className="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-base-200 text-xs">
                                  <div>
                                    <span className="font-bold text-sm text-base-content">
                                      Whole Total: ₦{gross.toLocaleString()}
                                    </span>
                                    {disc > 0 && (() => {
                                      const discInfo = getDiscountDisplay(bill);
                                      return (
                                        <span className="text-warning font-semibold ml-3">
                                          • {discInfo?.badgeText || `Discount Granted: ₦${disc.toLocaleString()}`}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="font-bold text-primary text-sm">
                                    Net Payable: ₦{Math.max(0, gross - disc).toLocaleString()}
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="table table-compact w-full text-xs">
                                    <thead>
                                      <tr className="text-base-content/60 border-b border-base-200">
                                        <th>Description</th>
                                        <th>Category / Code</th>
                                        <th>Unit Price</th>
                                        <th>Qty</th>
                                        <th>Line Total</th>
                                        <th>Payment Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {!bill.itemDetails || bill.itemDetails.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className="text-center py-4 text-base-content/50">
                                            No itemized details recorded for this bill.
                                          </td>
                                        </tr>
                                      ) : (
                                        bill.itemDetails.map((item, idx) => (
                                          <tr key={idx} className="border-b border-base-200/60">
                                            <td className="font-medium text-base-content">
                                              {item.description || item.code || 'Medical Item'}
                                            </td>
                                            <td className="uppercase text-base-content/70">
                                              {item.code || 'general'}
                                            </td>
                                            <td>₦{Number(item.price || 0).toLocaleString()}</td>
                                            <td>{item.quantity || 1}</td>
                                            <td className="font-semibold text-base-content">
                                              ₦{Number(item.total || 0).toLocaleString()}
                                            </td>
                                            <td>
                                              <span
                                                className={`badge badge-xs font-semibold ${
                                                  bill.isCleared || item.status === 'paid'
                                                    ? 'badge-success'
                                                    : 'badge-warning'
                                                }`}
                                              >
                                                {bill.isCleared || item.status === 'paid' ? 'Paid' : 'Pending'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Discount Modal */}
      <AdjustDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setSelectedBilling(null);
        }}
        billing={selectedBilling}
        patientName={selectedBilling?._subjectName || 'Patient'}
        approverRole="Super Admin"
        onSuccess={() => {
          fetchBillings(true);
        }}
      />
    </BaseRoleLayout>
  );
};

export default SuperAdminBillings;
