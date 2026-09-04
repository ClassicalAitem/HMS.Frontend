import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Header, PatientCardTypeInfo } from '@/components/common';
import Sidebar from '@/components/hmo/dashboard/Sidebar';
import {
  getPatientById,
  updatePatientStatus,
} from '@/services/api/patientsAPI';
import {
  createReceipt,
  getAllBillings,
  getAllReceiptByPatientId,
  updateBilling,
} from '@/services/api/billingAPI';

import { getStatusBadgeClass, getStatusDisplayText } from '@/utils/statusUtils';
import {
  formatNigeriaDate,
  formatNigeriaDateShort,
  formatNigeriaDateTime,
} from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/apiClient';
import SendPatientModal from '@/components/modals/SendPatientModal';
import { getConsultations } from '@/services/api/consultationAPI';
import PatientDetailsCard from '@/components/common/PatientDetailsCard';
import CurrentVitalsCard from '@/components/doctor/patient/CurrentVitalsCard';
import PatientHmoHistory from './PatientHmoHistory';
import KolakLoader from '@/components/common/KolakLoader';
import { useNotifications } from '@/contexts/NotificationContext';
import { getPrescriptionsForConsultation } from '@/services/api/prescriptionsAPI';
import {
  getVitalsByPatient,
  getLatestVital,
  normalizeVitalsResponse,
} from '@/services/api/vitalsAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getAllAppointments } from '@/services/api/appointmentsAPI';
import { AppointmentDetailsModal, ConsultationDetailModal } from '@/components/modals';


// Detect injection-route medications defensively across possible field names,
// since the medication schema shape wasn't confirmed — narrow this down once known.
const isInjectionMed = (med) => {
  const route = String(med?.route || med?.form || med?.type || '').toLowerCase();
  if (route.includes('injection') || route.includes('iv') || route.includes('im') || route.includes('sc')) {
    return true;
  }
  const name = String(med?.drugName || '').toLowerCase();
  return name.includes('inj');
};

const consultationHasInjection = (prescriptions = []) =>
  prescriptions.some((p) => (p.medications || []).some(isInjectionMed));


// Small reusable "empty" line so every section renders consistently
const EmptyNote = ({ children = 'None recorded' }) => (
  <p className="text-sm text-base-content/40">{children}</p>
);

const SectionHeading = ({ children }) => (
  <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
    {children}
  </h4>
);



const IncomingHmoDetails = () => {
  const [hasSavedDecisions, setHasSavedDecisions] = useState(false);

  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';
  const snapshot = location.state?.patientSnapshot;
  const dependantId = location.state?.dependantId || null;
  const dependantSnapshot = location.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [patient, setPatient] = useState(snapshot || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { refreshQueueCount } = useNotifications();
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [sendingStatuses, setSendingStatuses] = useState({
    Lab: false,
    Pharmacy: false,
  });
  const [billings, setBillings] = useState([]);
  const [hmos, setHmos] = useState([]);
  const [itemDecisions, setItemDecisions] = useState({});
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [latestVital, setLatestVital] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(true);
  const [latestLab, setLatestLab] = useState(null);
  const [appointments, setAppointments] = useState([]);
const [appointmentsLoading, setAppointmentsLoading] = useState(true);
const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [labLoading, setLabLoading] = useState(true);
  
    const [labResults, setLabResults] = useState([]);

  const [prescriptionsByConsultation, setPrescriptionsByConsultation] = useState({});
  const [subject, setSubject] = useState(null);
  const currentUser = useAppSelector((state) => state.auth.user);
    const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);
  const hmoUserId = currentUser?.id || currentUser?._id;
  const hmoUserName =
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [patientRes, billingsRes, vitalsRes, labRes] = await Promise.allSettled([
          snapshot
            ? Promise.resolve({ data: snapshot })
            : getPatientById(patientId),
          getAllBillings({ patientId }),
          getVitalsByPatient(patientId),
          getLabResults({ patientId }),
        ]);

        // ✅ fetch HMO records FIRST, declare hmoRaw before using it
        const hmosRes = await apiClient
          .get(`/hmo`, { params: { patientId } })
          .catch(() => ({ data: [] }));
        const hmoRaw = hmosRes?.data?.data ?? hmosRes?.data ?? [];
        const hmoList = Array.isArray(hmoRaw) ? hmoRaw : [];
        const scopedHmos = isViewingDependant
          ? hmoList.filter((h) => h.dependantId === dependantId)
          : hmoList.filter((h) => !h.dependantId);
        if (mounted) setHmos(scopedHmos);

        if (!mounted) return;

        if (patientRes.status === 'fulfilled') {
          setPatient(patientRes.value?.data ?? patientRes.value);
        }

        if (billingsRes.status === 'fulfilled') {
          const raw =
            billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [];
          const list = Array.isArray(raw) ? raw : [];

          // ✅ Initialize decisions from existing hmoStatus or default to 'pending'
          const initial = {};
          list.forEach((bill) => {
            initial[bill.id] = {};
            (bill.itemDetails || []).forEach((item, idx) => {
              initial[bill.id][idx] = {
                status: item.hmoStatus || 'pending',
                hmoCovered: Number(item.hmoCovered || 0),
              };
            });
          });
          setItemDecisions(initial);

          const unreviewedBills = list.filter((bill) => {
            const hasUnreviewedItems = (bill.itemDetails || []).some(
              (item) => !item.hmoStatus || item.hmoStatus === 'pending',
            );
            const matchesSubject = isViewingDependant
              ? bill.dependantId === dependantId
              : !bill.dependantId;
            return hasUnreviewedItems && !bill.isCleared && matchesSubject;
          });
          setBillings(unreviewedBills);
        }

        if (vitalsRes.status === 'fulfilled') {
          const vitals = normalizeVitalsResponse(vitalsRes.value).filter(
            (vital) =>
              isViewingDependant
                ? vital?.dependantId === dependantId
                : !vital?.dependantId,
          );
          setLatestVital(getLatestVital(vitals));
        } else {
          setLatestVital(null);
        }
        setVitalsLoading(false);

        if (labRes.status === 'fulfilled') {
          const rawLabResults =
            labRes.value?.data ?? labRes.value ?? [];
          const filteredLabResults = (Array.isArray(rawLabResults) ? rawLabResults : []).filter(
            (result) =>
              isViewingDependant
                ? result?.dependantId === dependantId
                : !result?.dependantId,
          );
          if (mounted) setLabResults(filteredLabResults);
          setLatestLab(
            [...filteredLabResults].sort(
              (a, b) =>
                new Date(b?.createdAt || 0).getTime() -
                new Date(a?.createdAt || 0).getTime(),
            )[0] || null,
          );
        } else {
          if (mounted) setLabResults([]);
          setLatestLab(null);
        }
        setLabLoading(false);
      } catch (err) {
        console.error('IncomingHmoDetails: load error', err);
        setLatestVital(null);
        setLatestLab(null);
        setVitalsLoading(false);
        setLabLoading(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => {
      mounted = false;
    };
  }, [patientId, isViewingDependant, dependantId]);

  const summarySubject = useMemo(() => {
    const guardian = patient || {};

    if (!isViewingDependant) {
      return {
        id: guardian.id,
        fullName:
          `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() ||
          guardian.name ||
          'Unknown',
        gender: guardian.gender,
        phone: guardian.phone || guardian.phoneNumber,
        hospitalId: guardian.hospitalId,
        status: guardian.status,
        hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
        relationshipType: null,
      };
    }

    const dep = subject || dependantSnapshot || {};

    // Dependants don't carry their own hmos — pull them out of the guardian's list
    const ownHmos = Array.isArray(guardian.hmos)
      ? guardian.hmos.filter((h) => h.dependantId === (dep.id || dependantId))
      : [];

    return {
      id: dep.id || dependantId,
      fullName:
        `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || 'Dependant',
      gender: dep.gender || '—',
      // Dependants don't carry their own phone in this schema — fall back to guardian's
      phone: dep.phone || guardian.phone || guardian.phoneNumber,
      // Hospital ID always belongs to the parent/guardian patient record
      hospitalId: guardian.hospitalId,
      status: dep.status || dependantSnapshot?.status || 'Unknown',
      hmos: ownHmos,
      relationshipType:
        dep.relationshipType || dependantSnapshot?.relationshipType,
    };
  }, [isViewingDependant, subject, dependantSnapshot, patient, dependantId]);

  useEffect(() => {
    let mounted = true;
    const fetchConsultations = async () => {
      try {
        setConsultationsLoading(true);
        const res = await getConsultations({ patientId });
        const raw = res?.data?.data ?? res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.consultations ?? []);

         const scoped = list.filter((c) =>
          isViewingDependant ? c.dependantId === dependantId : !c.dependantId
        );

        if (mounted) {
          setConsultations(
            [...scoped].sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime(),
            ),
          );
        }
      } catch {
        if (mounted) setConsultations([]);
      } finally {
        if (mounted) setConsultationsLoading(false);
      }
    };
    if (patientId) fetchConsultations();
    return () => {
      mounted = false;
    };
  }, [patientId, isViewingDependant, dependantId]);

  useEffect(() => {
  let mounted = true;
  const fetchPrescriptions = async () => {
    if (!consultations.length) {
      if (mounted) setPrescriptionsByConsultation({});
      return;
    }

    try {
      const results = await Promise.all(
        consultations.map(async (c) => {
          try {
            const res = await getPrescriptionsForConsultation(c.id);
            const raw = res?.data ?? res ?? [];
            const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
            return [c.id, list];
          } catch {
            return [c.id, []];
          }
        })
      );

      if (mounted) {
        setPrescriptionsByConsultation(Object.fromEntries(results));
      }
    } catch (err) {
      console.error('Failed to load consultation prescriptions', err);
    }
  };

  fetchPrescriptions();
  return () => { mounted = false; };
}, [consultations]);

useEffect(() => {
  let mounted = true;
  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const res = await getAllAppointments({ patientId });
      const raw = res?.data?.data ?? res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : (raw?.appointments ?? []);

      const scoped = list.filter((a) =>
        isViewingDependant ? a.dependantId === dependantId : !a.dependantId
      );

      if (mounted) {
        setAppointments(
          [...scoped].sort(
            (a, b) =>
              new Date(`${b.appointmentDate || ''} ${b.appointmentTime || ''}`).getTime() -
              new Date(`${a.appointmentDate || ''} ${a.appointmentTime || ''}`).getTime(),
          ),
        );
      }
    } catch {
      if (mounted) setAppointments([]);
    } finally {
      if (mounted) setAppointmentsLoading(false);
    }
  };
  if (patientId) fetchAppointments();
  return () => { mounted = false; };
}, [patientId, isViewingDependant, dependantId]);


  const setDecision = (billingId, itemIdx, status, hmoCovered = 0) => {
    setItemDecisions((prev) => ({
      ...prev,
      [billingId]: {
        ...prev[billingId],
        [itemIdx]: { status, hmoCovered: Number(hmoCovered) || 0 },
      },
    }));
    setHasSavedDecisions(false);
  };

  const setAllDecisions = (status) => {
    setHasSavedDecisions(false);

    setItemDecisions(() => {
      const next = {};
      billings.forEach((bill) => {
        next[bill.id] = {};
        (bill.itemDetails || []).forEach((item, idx) => {
          next[bill.id][idx] = {
            status,
            hmoCovered: status === 'approved' ? Number(item.total || 0) : 0,
          };
        });
      });
      return next;
    });
  };

  const approvedTotal = useMemo(() => {
    let total = 0;
    billings.forEach((bill) => {
      (bill.itemDetails || []).forEach((item, idx) => {
        const decision = itemDecisions[bill.id]?.[idx];
        if (decision?.status === 'approved') {
          total += Number(item.total || 0);
        } else if (decision?.status === 'partial') {
          total += Number(decision.hmoCovered || 0);
        }
      });
    });
    return total;
  }, [billings, itemDecisions]);

  // ✅ Patient Pays total, computed the same way as approvedTotal (was broken/inline before)
  const patientPaysTotal = useMemo(() => {
    let total = 0;
    billings.forEach((bill) => {
      (bill.itemDetails || []).forEach((item, idx) => {
        const decision = itemDecisions[bill.id]?.[idx];
        const itemTotal = Number(item.total || 0);
        if (decision?.status === 'rejected') {
          total += itemTotal;
        } else if (decision?.status === 'partial') {
          total += itemTotal - Number(decision.hmoCovered || 0);
        }
      });
    });
    return total;
  }, [billings, itemDecisions]);

  const saveDecisions = async () => {
    await Promise.all(
      billings.map(async (bill) => {
        const updatedItems = (bill.itemDetails || []).map((item, idx) => {
          const decision = itemDecisions[bill.id]?.[idx] || {
            status: 'pending',
            hmoCovered: 0,
          };
          const itemTotal = Number(item.total || 0);

          let hmoCovered = 0;
          if (decision.status === 'approved') hmoCovered = itemTotal;
          else if (decision.status === 'partial')
            hmoCovered = Number(decision.hmoCovered || 0);
          else hmoCovered = 0;

          const patientPays = itemTotal - hmoCovered;

          return {
            ...item,
            hmoStatus: decision.status,
            hmoCovered,
            patientOwes: patientPays,
          };
        });

        const outstandingBill = updatedItems.reduce(
          (sum, item) => sum + Number(item.patientOwes || 0),
          0,
        );

        const hmoCoveredAmount = updatedItems.reduce(
          (sum, item) => sum + Number(item.hmoCovered || 0),
          0,
        );

        await updateBilling(bill.id, {
          itemDetails: updatedItems,
          outstandingBill,
          hmoCoveredAmount,
          hmoApprovedBy: hmoUserName,
          hmoApprovedById: hmoUserId,
          hmoApprovedAt: new Date().toISOString(),
        });
      }),
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await saveDecisions();
      setHasSavedDecisions(true);
      toast.success('HMO items saved');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error('Save items error', err);
      toast.error(err?.response?.data?.message || 'Failed to save items');
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = isViewingDependant
    ? dependantSnapshot?.fullName ||
      `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim() ||
      'Dependant'
    : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() ||
      'Unknown';

  const displayStatus = getStatusDisplayText(
    isViewingDependant ? dependantSnapshot?.status : patient?.status,
  );
  const badgeClass = getStatusBadgeClass(
    isViewingDependant ? dependantSnapshot?.status : patient?.status,
  );

  return (
    <div className="flex h-screen">
          {loading && <KolakLoader fullscreen />}
    
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={closeSidebar}
            />
          )}
    
          <div
            className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
      <Sidebar onCloseSidebar={closeSidebar} />
          </div>
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-y-auto ">
          <div className="flex-1 overflow-y-auto p-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold">HMO Review</h1>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate('/dashboard/hmo/incoming')}
              >
                ← Back To Incoming
              </button>
            </div>

            {/* Patient Info */}
            <PatientDetailsCard
              patient={patient}
              summarySubject={summarySubject}
              isViewingDependant={isViewingDependant}
            />

            <CurrentVitalsCard
              patient={summarySubject}
              latest={latestVital}
              loading={vitalsLoading}
              buttonHidden
            />

             <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-base-content">Latest Lab Result</h3>
                  {labLoading ? (
                    <div className="skeleton h-4 w-48 mt-2" />
                  ) : latestLab ? (
                    <div className="text-sm text-base-content/70 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="badge badge-sm badge-outline">
                          {latestLab?.forType}
                        </span>
                        <span className="font-semibold text-base-content">{latestLab?.forName}</span>
                      </div>
                      <div>
                        {latestLab?.result?.[0]?.code || latestLab?.result?.[0]?.value || '—'} • {latestLab?.createdAt ? formatNigeriaDateTime(latestLab.createdAt) : '—'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-base-content/70">No lab results</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!latestLab}
                    onClick={() => latestLab && navigate(`/dashboard/hmo/labResults/${latestLab?._id || latestLab?.id}`)}
                  >
                    View Lab Result
                  </button>
                       <button
                  className="btn btn-outline btn-sm"
                  disabled={!labResults || labResults.length === 0}
                  onClick={() => navigate(`/dashboard/hmo/view-lab-results/${patientId}`, {
                    state: {
                      from: fromIncoming ? "incoming" : "patients",
                      patientSnapshot: patient,
                      dependantId,
                      dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                    },
                  })}
                >
                  View All
                </button>
                </div>
              </div>
            </div>
          </div>
            <div className="flex gap-10 items-center mt-4">
              <SendPatientModal
                patientId={patient?.id || patientId}
                patient={patient}
                defaultDependantId={dependantId}
                defaultDependantLabel={fullName}
                lockSubject
                onUpdated={() => {
                refreshQueueCount();
                  navigate('/dashboard/hmo');
                }}
                allowedRoles={[
                  'nurse',
                  'doctor',
                  'medical-director',
                  'pharmacist',
                  'cashier',
                  'labtechnician',
                  'sonographer',
                  'nurse',
                ]}
              />
         </div>
           

            {/* Bulk actions */}
            {!loading && billings.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setAllDecisions('approved')}
                  disabled={submitting}
                >
                  Approve All
                </button>
                <button
                  className="btn btn-error btn-sm"
                  onClick={() => setAllDecisions('rejected')}
                  disabled={submitting}
                >
                  Reject All
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAllDecisions('pending')}
                  disabled={submitting}
                >
                  ↺ Reset All
                </button>
              </div>
            )}

            {/* Billing Items */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="loading loading-spinner loading-lg" />
              </div>
            ) : billings.length === 0 ? (
              <div className="card bg-base-100 border border-base-200">
                <div className="card-body py-12 text-center text-base-content/50">
                  No billing items found for this patient.
                </div>
              </div>
            ) : (
              billings.map((bill) => (
                <div
                  key={bill.id}
                  className="card bg-base-100 border border-base-200 mb-4"
                >
                  <div className="card-body p-0">
                    {/* Bill Header */}
                    <div className="px-5 py-3 bg-base-200/40 border-b border-base-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          Bill #{bill.id?.slice(-8)}
                        </p>
                        <p className="text-xs text-base-content/50">
                          By {bill.raisedBy?.firstName}{' '}
                          {bill.raisedBy?.lastName} ·{' '}
                          {bill.raisedBy?.accountType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          ₦{Number(bill.totalAmount || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-base-content/50">Total</p>
                        <p className="text-xs text-base-content/40 mt-1">
                          {bill.createdAt
                            ? formatNigeriaDate(bill.createdAt)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="border-b border-base-200">
                            <th>Description</th>
                            <th>Code</th>
                            <th className="text-right">Price</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Total</th>
                            <th className="text-center w-48">HMO Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(bill.itemDetails || []).map((item, idx) => {
                            // ✅ was comparing object to string before; now reads .status
                            const decisionStatus =
                              itemDecisions[bill.id]?.[idx]?.status ||
                              'pending';
                            return (
                              <tr
                                key={idx}
                                className={`border-b border-base-200 last:border-0 transition-colors ${
                                  decisionStatus === 'approved'
                                    ? 'bg-success/5'
                                    : decisionStatus === 'rejected'
                                      ? 'bg-error/5'
                                      : 'hover:bg-base-200/30'
                                }`}
                              >
                                <td>
                                  <p className="font-medium">
                                    {item.description}
                                  </p>
                                  {(() => {
                                    const d = itemDecisions[bill.id]?.[idx];
                                    if (d?.status === 'approved')
                                      return (
                                        <span className="text-xs text-success">
                                          HMO Covers Full ₦
                                          {Number(item.total).toLocaleString()}
                                        </span>
                                      );
                                    if (d?.status === 'rejected')
                                      return (
                                        <span className="text-xs text-error">
                                          Patient Self-Pay ₦
                                          {Number(item.total).toLocaleString()}
                                        </span>
                                      );
                                    if (d?.status === 'partial')
                                      return (
                                        <span className="text-xs text-warning">
                                          Partial — HMO: ₦
                                          {Number(
                                            d.hmoCovered || 0,
                                          ).toLocaleString()}{' '}
                                          · Patient: ₦
                                          {(
                                            Number(item.total) -
                                            Number(d.hmoCovered || 0)
                                          ).toLocaleString()}
                                        </span>
                                      );
                                    return null;
                                  })()}
                                </td>
                                <td className="text-xs text-base-content/60">
                                  {item.code}
                                </td>
                                <td className="text-right">
                                  ₦{Number(item.price || 0).toLocaleString()}
                                </td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right font-medium">
                                  ₦{Number(item.total || 0).toLocaleString()}
                                </td>
                                <td className="text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <button
                                        className={`btn btn-xs ${
                                          itemDecisions[bill.id]?.[idx]
                                            ?.status === 'approved'
                                            ? 'btn-success'
                                            : 'btn-outline btn-success'
                                        }`}
                                        onClick={() =>
                                          setDecision(
                                            bill.id,
                                            idx,
                                            itemDecisions[bill.id]?.[idx]
                                              ?.status === 'approved'
                                              ? 'pending'
                                              : 'approved',
                                            item.total,
                                          )
                                        }
                                        disabled={submitting}
                                      >
                                        ✓ Full
                                      </button>
                                      <button
                                        className={`btn btn-xs ${
                                          itemDecisions[bill.id]?.[idx]
                                            ?.status === 'partial'
                                            ? 'btn-warning'
                                            : 'btn-outline btn-warning'
                                        }`}
                                        onClick={() =>
                                          setDecision(
                                            bill.id,
                                            idx,
                                            itemDecisions[bill.id]?.[idx]
                                              ?.status === 'partial'
                                              ? 'pending'
                                              : 'partial',
                                            0,
                                          )
                                        }
                                        disabled={submitting}
                                      >
                                        ½ Partial
                                      </button>
                                      <button
                                        className={`btn btn-xs ${
                                          itemDecisions[bill.id]?.[idx]
                                            ?.status === 'rejected'
                                            ? 'btn-error'
                                            : 'btn-outline btn-error'
                                        }`}
                                        onClick={() =>
                                          setDecision(
                                            bill.id,
                                            idx,
                                            itemDecisions[bill.id]?.[idx]
                                              ?.status === 'rejected'
                                              ? 'pending'
                                              : 'rejected',
                                            0,
                                          )
                                        }
                                        disabled={submitting}
                                      >
                                        ✕ None
                                      </button>
                                    </div>

                                    {itemDecisions[bill.id]?.[idx]?.status ===
                                      'partial' && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-base-content/60">
                                          ₦
                                        </span>
                                        <input
                                          type="number"
                                          className="input input-bordered input-xs w-24 text-right"
                                          placeholder="HMO amount"
                                          min={0}
                                          max={Number(item.total || 0)}
                                          value={
                                            itemDecisions[bill.id]?.[idx]
                                              ?.hmoCovered || ''
                                          }
                                          onChange={(e) => {
                                            const val = Math.min(
                                              Number(e.target.value) || 0,
                                              Number(item.total || 0),
                                            );
                                            setDecision(
                                              bill.id,
                                              idx,
                                              'partial',
                                              val,
                                            );
                                          }}
                                          disabled={submitting}
                                        />
                                        <span className="text-xs text-base-content/40">
                                          / ₦
                                          {Number(
                                            item.total || 0,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}

                                    {itemDecisions[bill.id]?.[idx]?.status ===
                                      'partial' && (
                                      <div className="text-xs mt-0.5">
                                        <span className="text-success">
                                          HMO: ₦
                                          {Number(
                                            itemDecisions[bill.id]?.[idx]
                                              ?.hmoCovered || 0,
                                          ).toLocaleString()}
                                        </span>
                                        <span className="text-base-content/40 mx-1">
                                          ·
                                        </span>
                                        <span className="text-error">
                                          Patient: ₦
                                          {(
                                            Number(item.total || 0) -
                                            Number(
                                              itemDecisions[bill.id]?.[idx]
                                                ?.hmoCovered || 0,
                                            )
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Submit Footer */}
            {!loading && billings.length > 0 && (
              <div className="card bg-base-100 border border-base-200 mt-6">
                <div className="card-body p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-base-content/60">
                        Total Bill:{' '}
                        <span className="font-medium text-base-content">
                          ₦
                          {billings
                            .reduce((s, b) => s + Number(b.totalAmount || 0), 0)
                            .toLocaleString()}
                        </span>
                      </p>

                      {approvedTotal > 0 && (
                        <p className="text-sm text-success font-medium">
                          ✓ HMO Covers: ₦{approvedTotal.toLocaleString()}
                        </p>
                      )}

                      {/* ✅ fixed: uses patientPaysTotal (rejected + partial patient share), was comparing object to string before */}
                      {patientPaysTotal > 0 && (
                        <p className="text-sm text-error font-medium">
                          ✕ Patient Pays: ₦{patientPaysTotal.toLocaleString()}
                        </p>
                      )}

                      {(() => {
                        const hasPending = billings.some((bill) =>
                          (bill.itemDetails || []).some(
                            (_, idx) =>
                              !itemDecisions[bill.id]?.[idx] ||
                              itemDecisions[bill.id]?.[idx]?.status ===
                                'pending',
                          ),
                        );
                        return hasPending ? (
                          <p className="text-xs text-warning">
                            ⚠ Some items still need a decision
                          </p>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleSave}
                        disabled={submitting || billings.length === 0}
                      >
                        {submitting ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          'Save items'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <PatientHmoHistory
              patientId={patient?.id || patientId}
              dependantId={dependantId}
              />
          </div>

                     

         {/* Consultations — moved from aside to a full-width section below */}
         <div className="mt-6 p-4 card bg-base-100 border border-base-200">
  <h3 className="text-lg font-semibold mb-3">Consultations</h3>
<div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {consultations.map((c) => {
            const isDependant = !!c.dependantId;
            const subjectName = isDependant
              ? `${c.dependant?.firstName || ''} ${c.dependant?.lastName || ''}`.trim()
              : `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.trim();
            const prescriptions = prescriptionsByConsultation[c.id] || [];
            const hasInjection = consultationHasInjection(prescriptions);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedConsultation({ ...c, prescriptions })}
                className={`text-left p-4 rounded-lg border transition-colors hover:border-primary/50 hover:bg-base-200/60 ${
                  isDependant ? 'border-secondary/30 bg-secondary/5' : 'border-base-300 bg-base-200/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`badge badge-sm shrink-0 ${isDependant ? 'badge-secondary' : 'badge-primary'}`}>
                      {isDependant ? c.dependant?.relationshipType || 'Dependant' : 'Patient'}
                    </span>
                    {isDependant && (
                      <span className="text-xs text-base-content/60 truncate">{subjectName}</span>
                    )}
                  </div>
                  <span className="text-xs text-base-content/40 shrink-0">
                    {c.createdAt ? formatNigeriaDate(c.createdAt) : '—'}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-sm font-medium text-base-content line-clamp-1">
                    {c.diagnosis || 'Pending diagnosis'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {c.visitReason && (
                    <span className="badge badge-ghost badge-xs capitalize">{c.visitReason}</span>
                  )}
                  {prescriptions.length > 0 && (
                    <span className="badge badge-outline badge-xs">
                      {prescriptions.reduce((s, p) => s + (p.medications || []).length, 0)} med{prescriptions.reduce((s, p) => s + (p.medications || []).length, 0) === 1 ? '' : 's'}
                    </span>
                  )}
                  {hasInjection && (
                    <span className="badge badge-warning badge-xs">Injection</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </div>

        {/* Appointments */}
<div className="mt-6 p-4 card bg-base-100 border border-base-200">
  <h3 className="text-lg font-semibold mb-3">Appointments</h3>
  {appointmentsLoading ? (
    <div className="flex justify-center py-8">
      <div className="loading loading-spinner loading-md" />
    </div>
  ) : appointments.length === 0 ? (
    <div className="card bg-base-100 border border-base-200">
      <div className="card-body py-8 text-center text-base-content/50">
        No appointments found for this patient.
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {appointments.map((a) => {
  const statusClass =
    (a.status || '').toLowerCase() === 'completed'
      ? 'badge-primary'
      : (a.status || '').toLowerCase() === 'scheduled'
        ? 'badge-info'
        : (a.status || '').toLowerCase() === 'cancelled'
          ? 'badge-error'
          : 'badge-neutral';

  return (
    <button
      key={a.id || a._id}
      type="button"
      onClick={() => {
        const appointmentId = a.id || a._id || a.appointmentId;
        if (appointmentId) {
          setSelectedAppointmentId(appointmentId);
          setIsAppointmentModalOpen(true);
        }
      }}
      className="text-left p-4 rounded-lg border border-base-300 bg-base-200/30 transition-colors hover:border-primary/50 hover:bg-base-200/60"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`badge badge-sm ${statusClass}`}>
          {a.status || 'Unknown'}
        </span>
        <span className="text-xs text-base-content/40">
          {a.appointmentDate ? formatNigeriaDate(a.appointmentDate) : '—'}
          {a.appointmentTime ? ` · ${a.appointmentTime}` : ''}
        </span>
      </div>
      <p className="text-sm font-medium text-base-content line-clamp-1">
        {a.procedureName || a.appointmentType || 'General appointment'}
      </p>
      {a.department && (
        <p className="text-xs text-base-content/60 mt-1 capitalize">{a.department}</p>
      )}
      {a.notes && (
        <p className="text-xs text-base-content/50 mt-1 line-clamp-2">{a.notes}</p>
      )}
    </button>
  );
})}
    </div>
  )}
</div>

        {selectedConsultation && (
          <ConsultationDetailModal
            consultation={selectedConsultation}
            onClose={() => setSelectedConsultation(null)}
          />
        )}

        <AppointmentDetailsModal
  isOpen={isAppointmentModalOpen}
  onClose={() => setIsAppointmentModalOpen(false)}
  appointmentId={selectedAppointmentId}
  onUpdated={(updated) => {
    setAppointments((prev) =>
      prev.map((a) =>
        (a.id || a._id) === (updated?.id || updated?._id || updated?.appointmentId)
          ? { ...a, status: updated?.status }
          : a,
      ),
    );
  }}
/>
        </div>
      </div>
    </div>
  );
};

export default IncomingHmoDetails;
