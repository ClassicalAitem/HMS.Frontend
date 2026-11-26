import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaFileInvoice, FaTag, FaChevronDown, FaChevronRight, FaCheckSquare } from 'react-icons/fa';
import { createBilling, getPendingDiscount } from '@/services/api/billingAPI';
import { getInvestigationByPatientId } from '@/services/api/investigationRequestAPI';
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import { getAllAppointments } from '@/services/api/appointmentsAPI';
import { getSurgeryByPatientId } from '@/services/api/surgeryAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { getInventories } from '@/services/api/inventoryAPI';
import { calculatePrescriptionLine, isSingleUnitDispense } from '@/utils/prescriptionsCalculator';
import { resolveServiceCharge } from '@/utils/serviceChargeHelper';
import { getErrorMessage } from '@/utils/errorHandler';

const getId = (r) => r?._id || r?.id;

const unwrapList = (res) => {
  const raw = res?.data?.data ?? res?.data ?? res ?? [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return raw ? [raw] : [];
};

const PendingUnbilledItemsCard = ({
  patientId,
  dependantId = null,
  billings = [],
  onBillGenerated,
  mode = 'cashier',
}) => {
  const isHmoMode = mode === 'hmo';
  const [items, setItems] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState(null);

  // Build count map of sub-items already billed in existing Billing records (supports identical duplicate items)
  const billedSubItemCounts = useMemo(() => {
    const counts = new Map();
    const inc = (k) => counts.set(k, (counts.get(k) || 0) + 1);
    (billings || []).forEach((bill) => {
      (bill.itemDetails || []).forEach((it) => {
        const desc = String(it.description || '').trim().toLowerCase();
        if (it.investigationId) inc(`inv:${it.investigationId}:${desc}`);
        if (it.prescriptionId) inc(`rx:${it.prescriptionId}:${desc}`);
        if (it.surgeryId) inc(`surg:${it.surgeryId}`);
        if (it.appointmentId) inc(`appt:${it.appointmentId}`);
        if (it.admissionId) inc(`adm:${it.admissionId}:${desc}`);
      });
    });
    return counts;
  }, [billings]);

  const loadPendingItems = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [invRes, presRes, admRes, apptRes, scRes, pharmRes, surgRes, discRes] =
        await Promise.allSettled([
          getInvestigationByPatientId(patientId),
          getPrescriptionByPatientId(patientId),
          getAdmissionByPatientId(patientId),
          getAllAppointments(),
          getServiceCharges(),
          getInventories(),
          getSurgeryByPatientId(patientId),
          isHmoMode ? Promise.resolve(null) : getPendingDiscount(patientId, dependantId),
        ]);

      if (discRes.status === 'fulfilled') {
        const d = discRes.value?.data ?? discRes.value ?? null;
        setPendingDiscount(d && d.status === 'pending' ? d : null);
      } else {
        setPendingDiscount(null);
      }

      const scList = scRes.status === 'fulfilled' ? unwrapList(scRes.value) : [];
      const pharmacyInventories = pharmRes.status === 'fulfilled' ? unwrapList(pharmRes.value) : [];

      const matchSubject = (rec) => {
        if (dependantId) return String(rec?.dependantId || '') === String(dependantId);
        return !rec?.dependantId;
      };

      const pending = [];
      const remainingBilled = new Map(billedSubItemCounts);
      const consumeBilled = (key) => {
        const n = remainingBilled.get(key) || 0;
        if (n > 0) {
          remainingBilled.set(key, n - 1);
          return true;
        }
        return false;
      };

      // 1. Lab & Radiology Investigations
      if (invRes.status === 'fulfilled') {
        const invList = unwrapList(invRes.value)
          .filter(matchSubject)
          .filter((inv) => !inv.isBilled && String(inv.status || '').toLowerCase() !== 'cancelled');

        invList.forEach((inv) => {
          const invId = String(getId(inv));
          const tests = Array.isArray(inv.tests) ? inv.tests : [];
          const isRadiology = String(inv.type || '').toLowerCase() === 'radiology';
          const code = isRadiology ? 'RAD' : 'LAB';

          if (tests.length === 0) {
            const description = inv.type || (isRadiology ? 'Radiology Scan' : 'Lab Test');
            if (consumeBilled(`inv:${invId}:${description.trim().toLowerCase()}`)) return;
            const resolved = resolveServiceCharge(scList, {
              name: inv.type,
              id: inv.serviceChargeId,
              category: inv.type,
            });
            pending.push({
              key: `inv-${invId}-0`,
              parentType: 'investigation',
              parentId: invId,
              investigationId: invId,
              serviceChargeId: inv.serviceChargeId || resolved.serviceChargeId || null,
              code,
              category: isRadiology ? 'Radiology / Scan' : 'Laboratory',
              description,
              quantity: 1,
              price: Number(resolved.price || 0),
              orderedBy: inv.doctorName || 'Doctor',
            });
          } else {
            tests.forEach((test, idx) => {
              const testName = typeof test === 'string' ? test : test?.name || test?.code || '';
              const description = testName || (isRadiology ? 'Radiology Scan' : 'Lab Test');
              if (consumeBilled(`inv:${invId}:${description.trim().toLowerCase()}`)) return;
              const isCustom = test?.isCustom === true;
              const resolved = resolveServiceCharge(scList, {
                name: testName,
                id: test?.serviceChargeId || inv.serviceChargeId,
                category: inv.type,
                price: test?.price,
                isCustom,
              });
              pending.push({
                key: `inv-${invId}-${idx}`,
                parentType: 'investigation',
                parentId: invId,
                investigationId: invId,
                serviceChargeId: test?.serviceChargeId || inv.serviceChargeId || resolved.serviceChargeId || null,
                code,
                category: isRadiology ? 'Radiology / Scan' : 'Laboratory',
                description,
                quantity: 1,
                price: Number(resolved.price || 0),
                orderedBy: inv.doctorName || 'Doctor',
              });
            });
          }
        });
      }

      // 2. Prescriptions
      if (presRes.status === 'fulfilled') {
        const presList = unwrapList(presRes.value)
          .filter(matchSubject)
          .filter((p) => !p.isBilled && String(p.status || '').toLowerCase() !== 'cancelled');

        presList.forEach((p) => {
          const rxId = String(getId(p));
          const meds = Array.isArray(p.medications) ? p.medications : [];
          meds.forEach((m, idx) => {
            const description = `${m.drugName || 'Medication'} (${m.dosage || ''})`;
            if (consumeBilled(`rx:${rxId}:${description.trim().toLowerCase()}`)) return;

            const isUnavailable = m.availability === 'unavailable';
            const isPharmacistVerified = !!p.pharmacistId;
            let qty = Number(m.billedQuantity || m.prescribedQuantity || 1);
            let unitPrice = Number(m.unitPrice || 0);

            const hasVerifiedValues =
              isPharmacistVerified &&
              Number(m.billedQuantity) > 0 &&
              m.unitPrice !== undefined &&
              m.unitPrice !== null;

            if (!hasVerifiedValues) {
              const invMatch = pharmacyInventories.find(
                (i) =>
                  (m.inventoryId && (i._id === m.inventoryId || i.id === m.inventoryId)) ||
                  (i.name && m.drugName && String(i.name).toLowerCase() === String(m.drugName).toLowerCase())
              );

              if (invMatch) {
                const line = calculatePrescriptionLine({
                  medicationType: m.medicationType,
                  dosageAmount: m.dosageAmount,
                  dosageUnit: m.dosageUnit,
                  frequency: m.frequency,
                  duration: m.duration,
                  inventory: invMatch,
                });
                if (line && line.convertible !== false) {
                  qty = Number(line.billedQuantity || 1);
                  unitPrice = Number(line.unitPrice || 0);
                } else if (!unitPrice) {
                  const packSize = Number(invMatch.packSize) || 1;
                  const isSingle = isSingleUnitDispense(m.medicationType, invMatch);
                  unitPrice = isSingle
                    ? Number(invMatch.sellingPrice || 0)
                    : packSize > 0
                    ? Number(invMatch.sellingPrice || 0) / packSize
                    : Number(invMatch.sellingPrice || 0);
                  if (isSingle) qty = 1;
                }
              } else if (!unitPrice && m.price) {
                unitPrice = Number(m.price || 0);
              }
            }

            const regimenParts = [
              m.dosage || (m.dosageAmount ? `${m.dosageAmount}${m.dosageUnit ? ` ${m.dosageUnit}` : ''}` : ''),
              m.frequency,
              m.duration,
            ].filter(Boolean);
            const regimenSummary = regimenParts.join(' • ');

            pending.push({
              key: `rx-${rxId}-${idx}`,
              parentType: 'prescription',
              parentId: rxId,
              prescriptionId: rxId,
              serviceChargeId: p.serviceChargeId || m.serviceChargeId || null,
              code: 'PRESCRIPTION',
              category: 'Medication',
              description,
              displayTitle: m.drugName || 'Medication',
              regimenSummary,
              quantity: qty,
              price: isUnavailable ? 0 : Number(unitPrice || 0),
              isUnavailable,
              isPharmacistVerified,
              orderedBy: p.doctorName || 'Doctor',
            });
          });
        });
      }

      // 3. Procedures / Surgeries
      const surgeryApptIds = new Set();
      if (surgRes.status === 'fulfilled') {
        const surgList = unwrapList(surgRes.value)
          .filter(matchSubject)
          .filter((s) => !s.isBilled && String(s.status || '').toLowerCase() !== 'cancelled');

        surgList.forEach((s) => {
          const sId = String(getId(s));
          if (s.appointmentId) surgeryApptIds.add(String(s.appointmentId));
          if (consumeBilled(`surg:${sId}`)) return;

          const resolved = resolveServiceCharge(scList, {
            name: s.procedureName,
            id: s.serviceChargeId,
            category: 'Surgical',
            price: s.price || s.procedurePrice,
          });
          pending.push({
            key: `surg-${sId}`,
            parentType: 'surgery',
            parentId: sId,
            surgeryId: sId,
            appointmentId: s.appointmentId || null,
            serviceChargeId: s.serviceChargeId || resolved.serviceChargeId || null,
            code: s.procedureCode || 'SURGERY',
            category: 'Procedure / Surgery',
            description: s.procedureName || 'Surgical Procedure',
            quantity: 1,
            price: Number(resolved.price || 0),
            orderedBy: s.surgeonName || 'Doctor',
          });
        });
      }

      if (apptRes.status === 'fulfilled') {
        const apptList = unwrapList(apptRes.value)
          .filter((a) => String(a.patientId) === String(patientId))
          .filter(matchSubject)
          .filter((a) => !a.isBilled && String(a.status || '').toLowerCase() !== 'cancelled')
          .filter((a) => !surgeryApptIds.has(String(getId(a))));

        apptList.forEach((a) => {
          const aId = String(getId(a));
          if (consumeBilled(`appt:${aId}`)) return;
          const isProc = String(a.appointmentType || '').toLowerCase().includes('procedure') ||
            String(a.serviceType || '').toLowerCase().includes('procedure') ||
            String(a.category || '').toLowerCase().includes('procedure');
          if (!isProc) return;

          const resolved = resolveServiceCharge(scList, {
            name: a.appointmentType || a.serviceType || 'Procedure',
            id: a.serviceChargeId,
            category: 'Procedure',
            price: a.amount || a.price,
          });
          pending.push({
            key: `appt-${aId}`,
            parentType: 'appointment',
            parentId: aId,
            appointmentId: aId,
            serviceChargeId: a.serviceChargeId || resolved.serviceChargeId || null,
            code: 'PROCEDURE',
            category: 'Procedure',
            description: a.appointmentType || a.serviceType || 'Clinical Procedure',
            quantity: 1,
            price: Number(resolved.price || 0),
            orderedBy: a.doctorName || 'Doctor',
          });
        });
      }

      // 4. Admissions
      if (admRes.status === 'fulfilled') {
        const admList = unwrapList(admRes.value)
          .filter(matchSubject)
          .filter((a) => !a.isBilled && String(a.status || '').toLowerCase() !== 'cancelled');

        admList.forEach((a) => {
          const aId = String(getId(a));
          const admItems = Array.isArray(a.admissions) ? a.admissions : [];
          if (admItems.length === 0) {
            const description = a.ward || 'Admission';
            if (consumeBilled(`adm:${aId}:${description.trim().toLowerCase()}`)) return;
            const resolved = resolveServiceCharge(scList, {
              name: description,
              id: a.serviceChargeId,
              category: 'Admission',
              price: a.price,
            });
            pending.push({
              key: `adm-${aId}-0`,
              parentType: 'admission',
              parentId: aId,
              admissionId: aId,
              serviceChargeId: a.serviceChargeId || resolved.serviceChargeId || null,
              code: 'ADMISSION',
              category: 'Admission',
              description,
              quantity: 1,
              price: Number(resolved.price || 0),
              orderedBy: 'Doctor',
            });
          } else {
            admItems.forEach((it, idx) => {
              const description = it.name || a.ward || 'Admission Item';
              if (consumeBilled(`adm:${aId}:${description.trim().toLowerCase()}`)) return;
              const resolved = resolveServiceCharge(scList, {
                name: description,
                id: it.serviceChargeId,
                category: 'Admission',
                price: it.amount,
              });
              pending.push({
                key: `adm-${aId}-${idx}`,
                parentType: 'admission',
                parentId: aId,
                admissionId: aId,
                serviceChargeId: it.serviceChargeId || resolved.serviceChargeId || null,
                code: 'ADMISSION',
                category: 'Admission',
                description,
                quantity: 1,
                price: Number(resolved.price || 0),
                orderedBy: 'Doctor',
              });
            });
          }
        });
      }

      setItems(pending);
      setSelectedKeys(new Set(pending.map((it) => it.key)));
    } catch (err) {
      console.error('Failed to load pending unbilled items:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, dependantId, billedSubItemCounts]);

  useEffect(() => {
    loadPendingItems();
  }, [loadPendingItems]);

  const allSelected = items.length > 0 && selectedKeys.size === items.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(items.map((it) => it.key)));
    }
  };

  const toggleItem = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedItems = useMemo(
    () => items.filter((it) => selectedKeys.has(it.key)),
    [items, selectedKeys]
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0),
    [selectedItems]
  );

  const estimatedDiscount = useMemo(() => {
    if (!pendingDiscount || selectedSubtotal <= 0) return 0;
    if (pendingDiscount.discountType === 'percentage') {
      return Math.round((selectedSubtotal * Number(pendingDiscount.discountValue || 0)) / 100);
    }
    return Math.min(selectedSubtotal, Number(pendingDiscount.discountValue || 0));
  }, [pendingDiscount, selectedSubtotal]);

  const estimatedNetTotal = Math.max(0, selectedSubtotal - estimatedDiscount);

  const handleGenerateBill = async () => {
    if (selectedItems.length === 0) {
      toast.error('Select at least one item to generate a bill');
      return;
    }

    setGenerating(true);
    try {
      // Check if any parent order has unselected items so we don't mark the whole order as billed prematurely
      const parentCounts = items.reduce((acc, it) => {
        const pKey = `${it.parentType}:${it.parentId}`;
        acc[pKey] = (acc[pKey] || 0) + 1;
        return acc;
      }, {});
      const selectedParentCounts = selectedItems.reduce((acc, it) => {
        const pKey = `${it.parentType}:${it.parentId}`;
        acc[pKey] = (acc[pKey] || 0) + 1;
        return acc;
      }, {});

      const itemDetail = selectedItems.map((it) => {
        const pKey = `${it.parentType}:${it.parentId}`;
        const isPartial = (selectedParentCounts[pKey] || 0) < (parentCounts[pKey] || 0);
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;
        return {
          code: it.code,
          description: it.description,
          quantity: qty,
          price,
          total: qty * price,
          ...(it.serviceChargeId && { serviceChargeId: it.serviceChargeId }),
          ...(it.investigationId && { investigationId: it.investigationId }),
          ...(it.prescriptionId && { prescriptionId: it.prescriptionId }),
          ...(it.admissionId && { admissionId: it.admissionId }),
          ...(it.appointmentId && { appointmentId: it.appointmentId }),
          ...(it.surgeryId && { surgeryId: it.surgeryId }),
          ...(it.regimenSummary && { regimenSummary: it.regimenSummary }),
          ...(isPartial && { isPartial: true }),
        };
      });

      await createBilling(patientId, {
        itemDetail,
        ...(dependantId && { dependantId }),
      });

      toast.success(
        isHmoMode
          ? 'Bill generated! You can now approve or reject the selected items below.'
          : 'Bill generated! You can now collect payment below.'
      );
      if (onBillGenerated) {
        await onBillGenerated();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate bill'));
    } finally {
      setGenerating(false);
    }
  };

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6 min-w-0 border border-primary/20">
      <div
        className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">
            {isOpen ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
          </span>
          <div>
            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
              <FaCheckSquare className="w-5 h-5" />
              Pending Orders Ready for Billing
              <span className="badge badge-primary badge-sm">{items.length}</span>
            </h3>
            <p className="text-xs text-base-content/60">
              {isHmoMode
                ? 'Select the items to process for HMO approval, then click Generate Bill before making decisions.'
                : 'Select the items the patient wants to pay for, then click Generate Bill before collecting payment.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {!isHmoMode && (
            <span className="text-sm font-semibold text-base-content">
              Selected: ₦{estimatedNetTotal.toLocaleString()}
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2"
            disabled={generating || selectedItems.length === 0}
            onClick={handleGenerateBill}
          >
            {generating ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FaFileInvoice className="w-3.5 h-3.5" />
            )}
            Generate Bill ({selectedItems.length})
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {!isHmoMode && pendingDiscount && (
            <div className="alert bg-warning/10 border border-warning/30 text-sm py-2.5 px-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-warning-content">
                <FaTag className="w-4 h-4 text-warning" />
                <span>
                  <strong>{pendingDiscount.approvedRole} Pre-Approved Discount:</strong>{' '}
                  {pendingDiscount.discountType === 'percentage'
                    ? `${pendingDiscount.discountValue}% off`
                    : `₦${Number(pendingDiscount.discountValue).toLocaleString()} off`}
                  {pendingDiscount.discountReason ? ` (${pendingDiscount.discountReason})` : ''}
                </span>
              </div>
              <span className="text-xs font-semibold text-warning">
                Applied automatically when you Generate Bill (-₦{estimatedDiscount.toLocaleString()})
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-base-content/60">
              <span className="loading loading-spinner loading-sm" />
              <span className="text-sm">Loading pending orders...</span>
            </div>
          ) : (
            <div className="overflow-x-auto w-full min-w-0 border border-base-200 rounded-lg">
              <table className="table table-sm w-full">
                <thead className="bg-base-200/60">
                  <tr>
                    <th className="w-10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={toggleSelectAll}
                          title="Select All"
                        />
                        <span className="text-xs font-semibold">All</span>
                      </label>
                    </th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-center">Qty</th>
                    {!isHmoMode && <th className="text-right">Unit Price</th>}
                    {!isHmoMode && <th className="text-right">Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const checked = selectedKeys.has(it.key);
                    const lineTotal = Number(it.price || 0) * Number(it.quantity || 1);
                    return (
                      <tr
                        key={it.key}
                        className={`cursor-pointer hover:bg-base-200/40 ${!checked ? 'opacity-50' : ''}`}
                        onClick={() => toggleItem(it.key)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={checked}
                            onChange={() => toggleItem(it.key)}
                          />
                        </td>
                        <td>
                          <span className="badge badge-outline badge-xs font-semibold">{it.code}</span>
                        </td>
                        <td>
                          <div className="font-medium text-base-content">
                            {it.displayTitle || it.description}
                          </div>
                          {it.regimenSummary && (
                            <div className="text-xs text-base-content/60 mt-0.5">
                              {it.regimenSummary}
                            </div>
                          )}
                          {it.isUnavailable ? (
                            <span className="badge badge-warning badge-xs mt-0.5">Unavailable — external</span>
                          ) : it.code === 'PRESCRIPTION' && it.isPharmacistVerified ? (
                            <span className="badge badge-success badge-outline badge-xs mt-0.5">
                              {isHmoMode ? '✓ Available (Pharmacist Verified)' : '✓ Pharmacist Verified'}
                            </span>
                          ) : null}
                        </td>
                        <td className="text-center">{it.quantity}</td>
                        {!isHmoMode && <td className="text-right">₦{Number(it.price || 0).toLocaleString()}</td>}
                        {!isHmoMode && <td className="text-right font-semibold">₦{lineTotal.toLocaleString()}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-base-200 text-sm">
            <div className="text-base-content/70">
              {selectedItems.length} of {items.length} item(s) selected
              {items.length - selectedItems.length > 0 && (
                <span className="ml-2 text-xs text-warning">
                  ({items.length - selectedItems.length} unselected item(s) will remain pending)
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isHmoMode && estimatedDiscount > 0 && (
                <span className="text-base-content/60 line-through">
                  ₦{selectedSubtotal.toLocaleString()}
                </span>
              )}
              {!isHmoMode && (
                <span className="text-lg font-bold text-primary">
                  Bill Total: ₦{estimatedNetTotal.toLocaleString()}
                </span>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2"
                disabled={generating || selectedItems.length === 0}
                onClick={handleGenerateBill}
              >
                {generating ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <FaFileInvoice className="w-3.5 h-3.5" />
                )}
                Generate Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingUnbilledItemsCard;
