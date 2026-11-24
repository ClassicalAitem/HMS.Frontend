import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaFileInvoice, FaTag, FaProcedures, FaSyringe, FaPills, FaBoxOpen, FaCheckCircle, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';
import { GiFirstAidKit } from 'react-icons/gi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError, clearCurrentPatient } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { createReceipt, getAllBillings, getAllReceiptByPatientId } from '@/services/api/billingAPI';
import { createPatientCredit, getPatientCredits } from '@/services/api/patientCreditAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { getSurgeryByPatientId } from '@/services/api/surgeryAPI';
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import { ReceiptModal, AdjustDiscountModal } from '@/components/modals';
import SendPatientModal from '@/components/modals/SendPatientModal';
import { formatNigeriaDate, formatNigeriaTime, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import PatientDetailsCard from '@/components/common/PatientDetailsCard';
import KolakLoader from '@/components/common/KolakLoader';
import { useNotifications } from '@/contexts/NotificationContext';


const CashierPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const { user } = useAppSelector((state) => state.auth);
  const userRole = String(user?.role || user?.accountType || '').toLowerCase().trim().replace(/[_ ]/g, '-');
  const isMedicalDirector = ['medical-director', 'super-admin', 'superadmin', 'admin'].includes(userRole);
  const discountApproverLabel = ['super-admin', 'superadmin'].includes(userRole)
    ? 'Super Admin'
    : userRole === 'admin'
    ? 'Admin'
    : 'Medical Director';
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [openRow, setOpenRow] = useState(null);
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [patientCredits, setPatientCredits] = useState([]);
  const [totalCredit, setTotalCredit] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [savingCredit, setSavingCredit] = useState(false);
  const [creditForm, setCreditForm] = useState({ amount: '', reason: '', sourceReference: '' });
  const [surgeries, setSurgeries] = useState([]);
  const [surgeryPrescriptions, setSurgeryPrescriptions] = useState([]);
  const [surgeryAdmissions, setSurgeryAdmissions] = useState([]);
  const [surgeriesLoading, setSurgeriesLoading] = useState(false);
  const [openSurgeryRow, setOpenSurgeryRow] = useState(null);
  const { refreshQueueCount } = useNotifications();

  const toggleRow = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  // Prefer snapshot passed from Incoming; fallback to store
  const snapshot = location?.state?.patientSnapshot || null;
  const patient = currentPatient || snapshot || null;

   const filterSubjectRecords = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => (
      isViewingDependant && dependantId ? item?.dependantId === dependantId : !item?.dependantId
    ));
  };

  const [subject, setSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadSubject = async () => {
      try {
        setSubjectLoading(true);
        if (isViewingDependant && dependantId) {
          try {
            const res = await getDependantById(dependantId);
            const dep = res?.data?.data?.dependant || res?.data?.dependant || dependantSnapshot;
            if (mounted) setSubject(dep || dependantSnapshot);
          } catch {
            if (mounted) setSubject(dependantSnapshot);
          }
        } else {
          if (mounted) setSubject(patient);
        }
      } finally {
        if (mounted) setSubjectLoading(false);
      }
    };
    loadSubject();
    return () => { mounted = false; };
  }, [isViewingDependant, dependantId, dependantSnapshot, patient]);

   const summarySubject = useMemo(() => {
    const guardian = patient || {};

    if (!isViewingDependant) {
      return {
        id: guardian.id,
        fullName: `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || guardian.name || 'Unknown',
        gender: guardian.gender,
        phone: guardian.phone || guardian.phoneNumber,
        hospitalId: guardian.hospitalId,
        status: guardian.status,
        statusSenderName: guardian.statusSenderName,
        statusUser: guardian.statusUser,
        updatedAt: guardian.updatedAt,
        hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
        relationshipType: null,
      };
    }

    const dep = subject || dependantSnapshot || {};

    // Dependants don't carry their own hmos — pull them out of the guardian's list
    const ownHmos = Array.isArray(guardian.hmos)
      ? guardian.hmos.filter(h => h.dependantId === (dep.id || dependantId))
      : [];

    return {
      id: dep.id || dependantId,
      fullName: `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || 'Dependant',
      gender: dep.gender || '—',
      dob: dep.dob || dep.dateOfBirth || dep.birthDate,
      // Dependants don't carry their own phone in this schema — fall back to guardian's
      phone: dep.phone || guardian.phone || guardian.phoneNumber,
      // Hospital ID always belongs to the parent/guardian patient record
      hospitalId: guardian.hospitalId,
      status: dep.status || dependantSnapshot?.status || 'Unknown',
      statusSenderName: dep.statusSenderName || dependantSnapshot?.statusSenderName,
      statusUser: dep.statusUser || dependantSnapshot?.statusUser,
      updatedAt: dep.updatedAt || dependantSnapshot?.updatedAt,
      hmos: ownHmos,
      relationshipType: dep.relationshipType || dependantSnapshot?.relationshipType,
    };
  }, [isViewingDependant, subject, dependantSnapshot, patient, dependantId]);

  const fullName = summarySubject.fullName;

  useEffect(() => {
    if (patientId && !location?.state?.patientSnapshot) {
      dispatch(fetchPatientById(patientId));
    }
    return () => {
      dispatch(clearCurrentPatient());
    };
  }, [dispatch, patientId, location?.state?.patientSnapshot]);

  useEffect(() => {
    if (error && !snapshot && !currentPatient) {
      toast.error(getErrorMessage(error));
      dispatch(clearPatientsError());
    }
  }, [error, dispatch, snapshot, currentPatient]);

  useEffect(() => {
    const fetchBillings = async () => {
      try {
        setIsReceiptModalOpen(false);
        const res = await getAllBillings({ patientId });
        const billingsData = res?.data?.data || res?.data || [];
        const list = Array.isArray(billingsData) ? billingsData : [];
        setBillings(filterSubjectRecords(list));
      } catch (error) {
        console.error('Error fetching billings:', error);
        setBillings([]);
      }
    }
    fetchBillings();
  }, [patientId, isViewingDependant, dependantId])

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await getAllReceiptByPatientId(patientId);
        const receiptsData = res?.data?.data || res?.data || [];
        const list = Array.isArray(receiptsData) ? receiptsData : [];
        setReceipts(filterSubjectRecords(list));
      } catch (error) {
        console.error('Error fetching receipts:', error);
        setReceipts([]);
      }
    }
    fetchReceipts();
  }, [patientId, isViewingDependant, dependantId]);

  useEffect(() => {
    let active = true;
    const fetchCredits = async () => {
      try {
        setCreditsLoading(true);
        const data = await getPatientCredits(patientId);
        if (!active) return;
        setPatientCredits(Array.isArray(data?.entries) ? data.entries : []);
        setTotalCredit(Number(data?.totalCredit) || 0);
      } catch (creditError) {
        console.error('Error fetching patient credits:', creditError);
        if (active) toast.error('Failed to load patient credits.');
      } finally {
        if (active) setCreditsLoading(false);
      }
    };
    if (patientId) fetchCredits();
    return () => { active = false; };
  }, [patientId]);

  useEffect(() => {
    let active = true;
    const fetchSurgeriesAndCoveredItems = async () => {
      if (!patientId) return;
      try {
        setSurgeriesLoading(true);
        const [surgRes, presRes, admRes] = await Promise.allSettled([
          getSurgeryByPatientId(patientId),
          getPrescriptionByPatientId(patientId),
          getAdmissionByPatientId(patientId),
        ]);

        if (!active) return;

        const rawSurgeries = surgRes.status === 'fulfilled'
          ? (surgRes.value?.data?.data ?? surgRes.value?.data ?? surgRes.value ?? [])
          : [];
        const rawPres = presRes.status === 'fulfilled'
          ? (presRes.value?.data?.data ?? presRes.value?.data ?? presRes.value ?? [])
          : [];
        const rawAdm = admRes.status === 'fulfilled'
          ? (admRes.value?.data?.data ?? admRes.value?.data ?? admRes.value ?? [])
          : [];

        const scopedSurgeries = filterSubjectRecords(Array.isArray(rawSurgeries) ? rawSurgeries : []);
        const scopedPres = filterSubjectRecords(Array.isArray(rawPres) ? rawPres : []);
        const scopedAdm = filterSubjectRecords(Array.isArray(rawAdm) ? rawAdm : []);

        setSurgeries(scopedSurgeries);
        setSurgeryPrescriptions(scopedPres);
        setSurgeryAdmissions(scopedAdm);

        if (scopedSurgeries.length > 0) {
          setOpenSurgeryRow(scopedSurgeries[0]._id || scopedSurgeries[0].id);
        }
      } catch (err) {
        console.error('Error fetching surgery items for cashier:', err);
      } finally {
        if (active) setSurgeriesLoading(false);
      }
    };

    fetchSurgeriesAndCoveredItems();
    return () => { active = false; };
  }, [patientId, isViewingDependant, dependantId]);

  const surgeryItemsMap = useMemo(() => {
    const map = {};

    surgeries.forEach((surg) => {
      const sId = String(surg._id || surg.id);
      const items = [];

      // 1. Primary procedure
      const procPrice = Number(surg.price || surg.procedurePrice || 0);
      items.push({
        id: `proc-${sId}`,
        code: surg.procedureCode || 'SURGERY',
        category: 'Surgical Procedure',
        description: `${surg.procedureName || 'Surgical Procedure'}${surg.operationRoom ? ` (Room: ${surg.operationRoom})` : ''}`,
        quantity: 1,
        unitPrice: procPrice,
        price: procPrice,
        total: procPrice,
        isCoveredByProcedure: false,
        coverageBadge: procPrice > 0 ? 'Primary Procedure Fee' : 'Surgery Fee Included',
        status: surg.status || 'scheduled',
      });

      // 2. Anesthesia Administered
      const dosages = Array.isArray(surg.anesthesiaDosages) ? surg.anesthesiaDosages : [];
      dosages.forEach((a, idx) => {
        if (a && (a.anesthesiaType || a.dosage || a.anestheticName || a.anestheticNote)) {
          const typeStr = a.anesthesiaType || 'Anesthesia';
          const nameStr = a.anestheticName ? ` - ${a.anestheticName}` : '';
          const doseStr = a.dosage ? ` (${a.dosage})` : '';
          const noteStr = a.anestheticNote ? ` [${a.anestheticNote}]` : '';
          items.push({
            id: `anes-${sId}-${idx}`,
            code: 'ANESTHESIA',
            category: 'Anesthesia',
            description: `${typeStr}${nameStr}${doseStr}${noteStr}`,
            quantity: 1,
            unitPrice: 0,
            price: 0,
            total: 0,
            isCoveredByProcedure: true,
            coverageBadge: 'Covered by Surgery Money',
            status: 'covered',
          });
        }
      });

      // 3. Swabs & Theatre Consumables
      const swabs = surg.swabsUsed ?? surg.swabUsed;
      if (swabs !== undefined && swabs !== null && swabs !== '' && Number(swabs) > 0) {
        items.push({
          id: `swabs-${sId}`,
          code: 'THEATRE_CONSUMABLE',
          category: 'Consumables',
          description: `Sterile Gauze Swabs Used in Theatre (${swabs} units count verified)`,
          quantity: Number(swabs),
          unitPrice: 0,
          price: 0,
          total: 0,
          isCoveredByProcedure: true,
          coverageBadge: 'Covered by Surgery Money',
          status: 'covered',
        });
      }

      // 4. Post-Operative Medications from Prescriptions linked to this surgery
      const matchingPrescriptions = surgeryPrescriptions.filter(
        (p) => String(p.surgeryId || '') === sId
      );
      const addedMedNames = new Set();

      matchingPrescriptions.forEach((rx) => {
        (rx.medications || []).forEach((med, mIdx) => {
          const drugName = med.drugName || med.name || 'Medication';
          const medKey = `${drugName.toLowerCase()}-${med.dosage || ''}`;
          addedMedNames.add(medKey);

          const doseInfo = [med.dosage, med.frequency, med.duration].filter(Boolean).join(' • ');
          items.push({
            id: `rx-${rx._id || rx.id}-${mIdx}`,
            code: 'SURG_RX',
            category: 'Post-Op Medication',
            description: `${drugName}${doseInfo ? ` (${doseInfo})` : ''}${med.instructions ? ` - ${med.instructions}` : ''}`,
            quantity: Number(med.dosageAmount || med.quantity || 1),
            unitPrice: 0,
            price: 0,
            total: 0,
            isCoveredByProcedure: true,
            coverageBadge: 'Covered by Surgery Money',
            status: rx.status === 'completed' || rx.status === 'dispensed' ? 'dispensed' : 'covered',
          });
        });
      });

      // Also from surgery.postOperativeAssessment if not already listed
      const postOps = Array.isArray(surg.postOperativeAssessment)
        ? surg.postOperativeAssessment
        : (Array.isArray(surg.postOperativeAssessments) ? surg.postOperativeAssessments : []);

      postOps.forEach((po, pIdx) => {
        const medText = typeof po === 'string' ? po : (po?.medication || po?.drugName || '');
        if (medText && medText.trim()) {
          const cleanText = medText.trim();
          const cleanKey = cleanText.toLowerCase();
          if (!addedMedNames.has(cleanKey)) {
            items.push({
              id: `postop-${sId}-${pIdx}`,
              code: 'SURG_MED',
              category: 'Post-Op Medication',
              description: cleanText,
              quantity: 1,
              unitPrice: 0,
              price: 0,
              total: 0,
              isCoveredByProcedure: true,
              coverageBadge: 'Covered by Surgery Money',
              status: 'covered',
            });
          }
        }
      });

      // 5. Inpatient / Post-Operative Ward Admission Stay
      const linkedAdm = surgeryAdmissions.find((a) => {
        const admId = String(a._id || a.id);
        const surgAdmId = String(surg.admissionId || '');
        const aSurgId = String(a.surgeryId || '');
        if (surgAdmId && surgAdmId === admId) return true;
        if (aSurgId && aSurgId === sId) return true;
        if (a.isProcedureLinked && surg.procedureName && String(a.procedureName || '').toLowerCase() === String(surg.procedureName).toLowerCase()) return true;
        return false;
      });

      if (linkedAdm) {
        items.push({
          id: `adm-stay-${sId}`,
          code: 'SURG_ADMISSION',
          category: 'Inpatient Stay',
          description: `${surg.procedureName || 'Procedure'} Post-Operative Ward Stay (Ward: ${linkedAdm.ward || 'Recovery / Ward'}${linkedAdm.bedNumber ? `, Bed #${linkedAdm.bedNumber}` : ''})`,
          quantity: 1,
          unitPrice: 0,
          price: 0,
          total: 0,
          isCoveredByProcedure: true,
          coverageBadge: 'Covered by Surgery Money',
          status: 'covered',
        });
      }

      map[sId] = {
        surgery: surg,
        linkedAdmission: linkedAdm,
        items,
        totalItemsCount: items.length,
        coveredItemsCount: items.filter((it) => it.isCoveredByProcedure).length,
      };
    });

    return map;
  }, [surgeries, surgeryPrescriptions, surgeryAdmissions]);

  const handlePatientCreditSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(creditForm.amount);
    const reason = creditForm.reason.trim();
    const sourceReference = creditForm.sourceReference.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a credit amount greater than zero.');
      return;
    }
    if (!reason) {
      toast.error('A reason is required to record patient credit.');
      return;
    }

    setSavingCredit(true);
    try {
      await createPatientCredit(patientId, { amount, reason, sourceReference });
      const data = await getPatientCredits(patientId);
      setPatientCredits(Array.isArray(data?.entries) ? data.entries : []);
      setTotalCredit(Number(data?.totalCredit) || 0);
      setCreditForm({ amount: '', reason: '', sourceReference: '' });
      toast.success('Patient credit recorded.');
    } catch (creditError) {
      toast.error(creditError?.response?.data?.message || creditError?.message || 'Failed to record patient credit.');
    } finally {
      setSavingCredit(false);
    }
  };

  const handleReceiptSubmit = async (receiptData) => {
    try {
      const receiptPayload = {
        ...receiptData,
        dependantId: isViewingDependant ? dependantId : null,
      };

      await toast.promise(
        createReceipt(selectedBillingId, receiptPayload),
        {
          loading: 'Submitting receipt...',
          success: 'Receipt submitted successfully!',
          error: (e) => e?.response?.data?.message || 'Error submitting receipt. Please try again.',
        }
      );

      setIsReceiptModalOpen(false);
      try {
        const receiptsRes = await getAllReceiptByPatientId(patientId);
        const receiptsData = receiptsRes?.data?.data || receiptsRes?.data || [];
        setReceipts(filterSubjectRecords(Array.isArray(receiptsData) ? receiptsData : []));

        const billingsRes = await getAllBillings({ patientId });
        const billingsData = billingsRes?.data?.data || billingsRes?.data || [];
        setBillings(filterSubjectRecords(Array.isArray(billingsData) ? billingsData : []));
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error) {
      console.error('Error submitting receipt:', error);
    }
  };

  const totalOutstanding = billings.reduce((sum, bill) => {
    if (bill.isCleared) return sum;
    const outstanding = Number(bill.outstandingBill);
    if (Number.isFinite(outstanding) && outstanding >= 0) return sum + outstanding;
    return sum + Number(bill.totalAmount || 0);
  }, 0);

  if (isLoading && !snapshot) {
    return (
      <CashierLayout>
        <KolakLoader fullscreen />
      </CashierLayout>
    );
  }

  if (error && !snapshot && !currentPatient) {
    return (
      <CashierLayout>
        {isLoading && <KolakLoader fullscreen />}
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-error text-lg font-semibold mb-2">Error Loading Patient</div>
          <div className="text-base-content/70 mb-4">{error}</div>
          <div className="flex gap-2">
            <button onClick={() => dispatch(fetchPatientById(patientId))} className="btn btn-primary btn-sm">
              Try Again
            </button>
            <button onClick={() => navigate('/cashier/patients')} className="btn btn-outline btn-sm">
              Back to Patients
            </button>
          </div>
        </div>
    </CashierLayout>
    );
  }

  if (!patient) {
    return (
      <CashierLayout>
         {isLoading && <KolakLoader fullscreen />}
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-base-content text-lg font-semibold mb-2">Patient Not Found</div>
          <div className="text-base-content/70 mb-4">The patient you're looking for doesn't exist.</div>
          <button onClick={() => navigate('/cashier/incoming')} className="btn btn-primary btn-sm">
            Back to Incoming
          </button>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      {isLoading && <KolakLoader fullscreen />}
      <div className="mb-8">


        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-regular text-base-content mb-6">
          
          </h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/cashier/incoming')}>
            ← Back to Incoming
          </button>
        </div>

      <PatientDetailsCard
        patient={patient}
        summarySubject={summarySubject}
        isViewingDependant={isViewingDependant}
      />


<SendPatientModal
                patientId={patient?.id || patientId}
                patient={patient}
                defaultDependantId={dependantId}
                defaultDependantLabel={fullName}
                lockSubject
                onUpdated={() => {
                  refreshQueueCount();
                  navigate('/cashier/incoming');
                }}
                allowedRoles={['nurse', 'doctor', 'medical-director', 'pharmacist', 'medical-laboratory', 'labtechnician', 'hmo', 'sonographer']}
              />
            

        {/* Outstanding Bills */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6 min-w-0">
          <h3 className="text-xl font-bold text-primary mb-4">
            {isViewingDependant ? `${fullName}'s Billings` : 'Patient Billings'}
          </h3>
          <div className="overflow-x-auto w-full min-w-0">

            <table className="table w-full">
              <thead>
                <tr>
                  <th></th>
                  <th>Date & Time</th>
                  <th>Total amount</th>
                  <th>Outstanding Bills</th>
                  <th>Raised By</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-base-content/50">
                      No billing records found{isViewingDependant ? ' for this dependant' : ''}.
                    </td>
                  </tr>
                ) : billings.map((bill) => (

                  <React.Fragment key={bill.id}>

                    <tr className="text-sm">
                      <td
                        onClick={() => toggleRow(bill.id)}
                        className="cursor-pointer select-none"
                        title={openRow === bill.id ? "Collapse" : "Expand"}
                      >
                        {openRow === bill.id ? "▼" : "▶"}
                      </td>


                      <td className="font-medium">{formatNigeriaDateTime(bill.createdAt)}</td>
                      <td>
                        <div className="font-medium">
                          ₦ {(Number(bill.subtotalAmount || bill.totalAmount) || 0).toLocaleString()}
                        </div>
                        {Number(bill.discountAmount) > 0 && (
                          <span className="badge badge-warning badge-xs font-semibold gap-1 mt-1 block w-fit">
                            Discount: ₦{Number(bill.discountAmount).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium">
                          ₦ {(bill.isCleared ? 0 : Number(bill.outstandingBill !== undefined ? bill.outstandingBill : (bill.totalAmount || 0))).toLocaleString()}
                        </div>
                        {Number(bill.discountAmount) > 0 && (
                          <span className="text-[11px] text-warning font-medium block">
                            (Discount: ₦{Number(bill.discountAmount).toLocaleString()})
                          </span>
                        )}
                      </td>
                      <td className="text-success">{bill.raisedBy?.firstName || 'Staff'}{" "}{bill.raisedBy?.lastName || ''}</td>
                      <td className="text-success">{bill.raisedBy?.accountType || '—'}</td>
                      <td>
                        {(() => {
                          const isBillFullyPaid = bill.isCleared || (bill.outstandingBill !== undefined && Number(bill.outstandingBill) <= 0);
                          return (
                            <div className="flex items-center gap-1.5">
                              {isBillFullyPaid ? (
                                <button
                                  className="btn btn-sm btn-ghost text-success"
                                  disabled
                                >
                                  Completed
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedBillingId(bill.id);
                                    setSelectedBilling(bill);
                                    setIsReceiptModalOpen(true);
                                  }}
                                  className="btn btn-sm btn-ghost"
                                >
                                  Pay now
                                </button>
                              )}

                              {isMedicalDirector && !isBillFullyPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBilling(bill);
                                    setIsDiscountModalOpen(true);
                                  }}
                                  className="btn btn-xs btn-outline btn-warning gap-1"
                                  title="Grant or adjust discount"
                                >
                                  <FaTag className="w-2.5 h-2.5" />
                                  <span>{Number(bill.discountAmount) > 0 ? 'Edit Discount' : 'Discount'}</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>


                    </tr>

                    {openRow === bill.id && (

                      <tr>
                        <td colSpan={7} className="bg-base-200">
                          <div className="p-3">
                            <div className="mb-3 text-sm flex items-center justify-between">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-semibold">Whole Total: ₦{Number(bill.subtotalAmount || bill.totalAmount || 0).toLocaleString()}</p>
                                {Number(bill.discountAmount) > 0 && (() => {
                                  const rawReason = (bill.discountReason || '').trim();
                                  const cleanedReason = rawReason
                                    .replace(/^(super[-_\s]?admin|medical[-_\s]?director|admin)\s*/i, '')
                                    .replace(/\bapproved by\s+(super[-_\s]?admin|medical[-_\s]?director|admin)\b/i, '')
                                    .trim();
                                  const hasCustomReason = cleanedReason && !/^discount$/i.test(cleanedReason);
                                  return (
                                    <span className="badge badge-warning badge-sm font-semibold">
                                      🏷️ Discount: ₦{Number(bill.discountAmount).toLocaleString()}{hasCustomReason ? ` (${cleanedReason})` : ''}
                                    </span>
                                  );
                                })()}
                              </div>
                              {bill.itemDetails?.some(item => !!item.admissionId) && (
                                <span className="badge badge-primary font-semibold text-xs ml-4">
                                  🏥 Inpatient / Admission Bill
                                </span>
                              )}
                              {bill.itemDetails?.some(item => !!item.surgeryId || item.code === 'SURGERY') && (
                                <span className="badge badge-secondary font-semibold text-xs ml-2">
                                  🏥 Surgical Procedure Bill
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold mb-2">Item Details</h4>
                            <table className="table w-full">
                              <thead>
                                <tr>
                                  <th className="font-semibold px-4">Description</th>
                                  <th className="font-semibold px-4">Code</th>
                                  <th className="font-semibold px-4">Price</th>
                                  <th className="font-semibold px-4">Qty</th>
                                  <th className="font-semibold px-4">Total</th>
                                  <th className="font-semibold px-4">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.itemDetails?.map((item, index) => (
                                  <tr key={index} className="border-b border-base-300 hover:bg-base-100">
                                    <td className="px-4 py-3">{item.description}</td>
                                    <td className="px-4 py-3 text-base-content/70">{item.code}</td>
                                    <td className="px-4 py-3">₦{(Number(item.price) || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3">{item.quantity}</td>
                                    <td className="font-medium px-4 py-3">₦{(Number(item.total) || (Number(item.price || 0) * Number(item.quantity || 1))).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                      {item.paymentStatus === 'paid' || item.hmoStatus === 'approved' || item.isCleared || bill.isCleared ? (
                                        <span className="badge badge-success badge-sm text-white">Paid</span>
                                      ) : (
                                        <span className="badge badge-warning badge-sm">Unpaid</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Covered items from surgery if this bill corresponds to a surgery */}
                            {(() => {
                              const matchingSurg = surgeries.find((s) => {
                                const sId = String(s._id || s.id);
                                const pName = String(s.procedureName || '').toLowerCase().trim();
                                return (bill.itemDetails || []).some((item) => {
                                  if (item.surgeryId && String(item.surgeryId) === sId) return true;
                                  if (item.code === 'SURGERY') {
                                    const desc = String(item.description || '').toLowerCase();
                                    if (pName && (desc.includes(pName) || pName.includes(desc))) return true;
                                    return true;
                                  }
                                  return false;
                                });
                              });

                              if (!matchingSurg) return null;
                              const sId = String(matchingSurg._id || matchingSurg.id);
                              const entry = surgeryItemsMap[sId];
                              if (!entry || !entry.items || entry.coveredItemsCount === 0) return null;

                              const coveredItems = entry.items.filter((it) => it.isCoveredByProcedure);

                              return (
                                <div className="mt-4 p-4 rounded-xl bg-base-100 border border-success/30 shadow-xs">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="badge badge-success badge-sm text-white font-bold gap-1">
                                        <FaCheckCircle className="w-2.5 h-2.5" />
                                        Covered by Surgery Money
                                      </span>
                                      <h5 className="font-bold text-sm text-base-content">
                                        Items Covered by this Surgery Fee ({matchingSurg.procedureName || 'Procedure'})
                                      </h5>
                                    </div>
                                    <span className="text-xs text-success font-medium">
                                      ₦0.00 extra • {coveredItems.length} item{coveredItems.length === 1 ? '' : 's'} included in surgery package
                                    </span>
                                  </div>
                                  <div className="overflow-x-auto w-full min-w-0">
                                    <table className="table table-xs w-full">
                                      <thead>
                                        <tr className="bg-base-200/50">
                                          <th>Description</th>
                                          <th>Category</th>
                                          <th className="text-center">Qty</th>
                                          <th>Price</th>
                                          <th>Total</th>
                                          <th>Coverage & Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {coveredItems.map((cItem, cIdx) => (
                                          <tr key={cItem.id || cIdx} className="border-b border-base-200">
                                            <td className="font-medium">
                                              <div className="flex items-center gap-1.5">
                                                {cItem.category === 'Anesthesia' && <FaSyringe className="w-3 h-3 text-primary shrink-0" />}
                                                {cItem.category === 'Post-Op Medication' && <FaPills className="w-3 h-3 text-secondary shrink-0" />}
                                                {cItem.category === 'Consumables' && <FaBoxOpen className="w-3 h-3 text-warning shrink-0" />}
                                                {cItem.category === 'Inpatient Stay' && <FaProcedures className="w-3 h-3 text-info shrink-0" />}
                                                <span>{cItem.description}</span>
                                              </div>
                                            </td>
                                            <td><span className="badge badge-ghost badge-xs">{cItem.category}</span></td>
                                            <td className="text-center">{cItem.quantity}</td>
                                            <td className="text-emerald-700 font-medium">₦0 (Covered)</td>
                                            <td className="text-emerald-700 font-bold">₦0.00</td>
                                            <td>
                                              <span className="badge badge-success badge-xs text-white">Covered by Surgery</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-base-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error"></span>
              <span className="text-error font-semibold">Outstanding Balance: ₦{totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Surgical Procedures & Items (Covered by Surgery Money) */}
        {(surgeries.length > 0 || surgeriesLoading) && (
          <section className="bg-base-100 rounded-xl shadow-lg p-6 mb-6 min-w-0 border-l-4 border-primary">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-200 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <GiFirstAidKit className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary">
                    {isViewingDependant ? `${fullName}'s Surgical Procedures & Items` : 'Surgical Procedures & Items'}
                  </h3>
                </div>
                <p className="text-sm text-base-content/70 mt-1">
                  Itemized theatre items, anesthesia, medications, consumables, and post-operative recovery care covered by surgery money.
                </p>
              </div>
              <span className="badge badge-success badge-sm text-white font-semibold py-3 px-3 gap-1">
                <FaShieldAlt className="w-3 h-3" />
                Covered by Surgery Money (₦0.00 extra)
              </span>
            </div>

            {surgeriesLoading ? (
              <div className="py-8 text-center text-base-content/60 flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm text-primary"></span>
                <span>Loading surgery records & items...</span>
              </div>
            ) : surgeries.length === 0 ? (
              <p className="text-sm text-base-content/60 py-4 text-center">No surgery records found.</p>
            ) : (
              <div className="space-y-4">
                {surgeries.map((surg) => {
                  const sId = String(surg._id || surg.id);
                  const entry = surgeryItemsMap[sId] || { items: [] };
                  const isOpen = openSurgeryRow === sId;
                  const formattedDate = surg.scheduledDate ? formatNigeriaDate(surg.scheduledDate) : formatNigeriaDate(surg.createdAt);
                  const formattedTime = surg.scheduledDate ? formatNigeriaTime(surg.scheduledDate) : (surg.startTime || '');

                  return (
                    <div key={sId} className="border border-base-300 rounded-xl overflow-hidden bg-base-100 shadow-xs">
                      {/* Surgery Header Accordion */}
                      <div
                        onClick={() => setOpenSurgeryRow(isOpen ? null : sId)}
                        className="flex flex-wrap items-center justify-between p-4 bg-base-200/50 hover:bg-base-200 cursor-pointer transition select-none gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base text-primary font-bold">
                            {isOpen ? '▼' : '▶'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-base-content">
                                {surg.procedureName || 'Surgical Procedure'}
                              </h4>
                              {surg.procedureCode && (
                                <span className="badge badge-ghost badge-xs font-mono">{surg.procedureCode}</span>
                              )}
                              <span className={`badge badge-xs capitalize font-semibold ${
                                surg.status === 'completed' ? 'badge-success text-white' :
                                surg.status === 'in-progress' ? 'badge-warning' : 'badge-info text-white'
                              }`}>
                                {surg.status || 'scheduled'}
                              </span>
                            </div>
                            <p className="text-xs text-base-content/60 mt-0.5">
                              📅 {formattedDate} {formattedTime && `• ⏰ ${formattedTime}`}
                              {surg.operationRoom && ` • 🏥 ${surg.operationRoom}`}
                              {surg.surgeonTeam?.length > 0 && ` • 👨‍⚕️ ${surg.surgeonTeam.map(t => t.surgeonName).filter(Boolean).join(', ')}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs uppercase font-semibold text-base-content/50 block">Included Items</span>
                            <span className="badge badge-primary badge-sm font-semibold">
                              {entry.items.length} items
                            </span>
                          </div>
                          <span className="text-xs text-primary font-medium hover:underline">
                            {isOpen ? 'Collapse Details' : 'Expand Details'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Surgery Items & Details */}
                      {isOpen && (
                        <div className="p-4 sm:p-5 border-t border-base-300 bg-base-100 space-y-4">
                          {/* Banner Notice */}
                          <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-lg text-xs sm:text-sm">
                            <FaInfoCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-emerald-900">
                                Surgical Package Coverage Notice
                              </p>
                              <p className="text-xs text-emerald-800 mt-0.5">
                                The medications, anesthesia, theatre materials, and post-operative ward care itemized below are covered by the surgery money (procedure fee). They are listed for accounting, audit trail, and cashier verification with ₦0 balance.
                              </p>
                            </div>
                          </div>

                          {/* Quick Clinical / Operative Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200/40 p-3 rounded-lg text-xs">
                            <div>
                              <span className="text-base-content/60 block uppercase text-[10px] font-bold">Surgeon Team</span>
                              <span className="font-medium text-base-content">
                                {surg.surgeonTeam?.map(st => st.surgeonName).filter(Boolean).join(', ') || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-base-content/60 block uppercase text-[10px] font-bold">Assistants</span>
                              <span className="font-medium text-base-content">
                                {surg.surgeonAssistants?.map(sa => sa.assistantName).filter(Boolean).join(', ') || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-base-content/60 block uppercase text-[10px] font-bold">Swabs Used Count</span>
                              <span className="font-medium text-base-content">
                                {(surg.swabsUsed ?? surg.swabUsed) !== undefined && (surg.swabsUsed ?? surg.swabUsed) !== null && (surg.swabsUsed ?? surg.swabUsed) !== ''
                                  ? `${surg.swabsUsed ?? surg.swabUsed} Verified`
                                  : 'None recorded'}
                              </span>
                            </div>
                            <div>
                              <span className="text-base-content/60 block uppercase text-[10px] font-bold">Recovery Ward / Stay</span>
                              <span className="font-medium text-base-content">
                                {entry.linkedAdmission ? (
                                  `${entry.linkedAdmission.ward || 'Admitted'}${entry.linkedAdmission.bedNumber ? ` (Bed ${entry.linkedAdmission.bedNumber})` : ''} - Covered`
                                ) : 'Outpatient / Same-day'}
                              </span>
                            </div>
                          </div>

                          {/* Table of Surgery Items */}
                          <div className="overflow-x-auto w-full min-w-0">
                            <table className="table table-sm w-full">
                              <thead>
                                <tr className="bg-base-200/70 text-xs">
                                  <th className="font-semibold px-3 py-2">Item Description</th>
                                  <th className="font-semibold px-3 py-2">Category</th>
                                  <th className="font-semibold px-3 py-2 text-center">Qty</th>
                                  <th className="font-semibold px-3 py-2">Price / Rate</th>
                                  <th className="font-semibold px-3 py-2">Total Amount</th>
                                  <th className="font-semibold px-3 py-2">Coverage & Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.items.map((item, itemIdx) => (
                                  <tr key={item.id || itemIdx} className="border-b border-base-200 hover:bg-base-200/30 text-xs sm:text-sm">
                                    <td className="px-3 py-2.5 font-medium">
                                      <div className="flex items-center gap-2">
                                        {item.category === 'Anesthesia' && <FaSyringe className="w-3.5 h-3.5 text-primary shrink-0" />}
                                        {item.category === 'Post-Op Medication' && <FaPills className="w-3.5 h-3.5 text-secondary shrink-0" />}
                                        {item.category === 'Consumables' && <FaBoxOpen className="w-3.5 h-3.5 text-warning shrink-0" />}
                                        {item.category === 'Inpatient Stay' && <FaProcedures className="w-3.5 h-3.5 text-info shrink-0" />}
                                        {item.category === 'Surgical Procedure' && <GiFirstAidKit className="w-3.5 h-3.5 text-primary shrink-0" />}
                                        <span>{item.description}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-base-content/70">
                                      <span className="badge badge-ghost badge-xs">{item.category}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-medium">{item.quantity}</td>
                                    <td className="px-3 py-2.5 font-medium">
                                      {item.isCoveredByProcedure ? (
                                        <span className="text-emerald-700 font-semibold">₦0 (Covered)</span>
                                      ) : (
                                        `₦${Number(item.price || 0).toLocaleString()}`
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5 font-bold">
                                      {item.isCoveredByProcedure ? (
                                        <span className="text-emerald-700">₦0.00</span>
                                      ) : (
                                        `₦${Number(item.total || 0).toLocaleString()}`
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      {item.isCoveredByProcedure ? (
                                        <span className="badge badge-success badge-sm text-white font-medium gap-1">
                                          <FaCheckCircle className="w-2.5 h-2.5" />
                                          Covered by Surgery Money
                                        </span>
                                      ) : (
                                        <span className="badge badge-primary badge-sm font-medium">
                                          {item.coverageBadge || 'Procedure Fee'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-200 pb-4">
            <div>
              <h3 className="text-xl font-bold text-primary">Patient Credit Ledger</h3>
              <p className="text-sm text-base-content/60">Credits owed to this patient, across care types</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-base-content/60">Credit Owed</p>
              <p className="text-xl font-bold text-warning">₦{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <form onSubmit={handlePatientCreditSubmit} className="grid grid-cols-1 gap-3 py-4 md:grid-cols-4 md:items-end">
            <label className="form-control">
              <span className="label-text mb-1 text-xs">Amount (₦) *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={creditForm.amount}
                onChange={(event) => setCreditForm((current) => ({ ...current, amount: event.target.value }))}
                className="input input-bordered input-sm"
                placeholder="0.00"
              />
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-1 text-xs">Reason *</span>
              <input
                required
                maxLength={500}
                value={creditForm.reason}
                onChange={(event) => setCreditForm((current) => ({ ...current, reason: event.target.value }))}
                className="input input-bordered input-sm"
                placeholder="Why is this amount owed?"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingCredit || creditsLoading}>
              {savingCredit ? 'Recording...' : 'Record Credit'}
            </button>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-1 text-xs">Source / bill reference</span>
              <input
                maxLength={150}
                value={creditForm.sourceReference}
                onChange={(event) => setCreditForm((current) => ({ ...current, sourceReference: event.target.value }))}
                className="input input-bordered input-sm"
                placeholder="Optional reference"
              />
            </label>
          </form>

          <div className="overflow-x-auto w-full min-w-0">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date recorded</th>
                  <th>Reason</th>
                  <th>Source reference</th>
                  <th>Recorded by</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {creditsLoading ? (
                  <tr><td colSpan={5} className="py-6 text-center text-base-content/60">Loading credits...</td></tr>
                ) : patientCredits.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-base-content/60">No patient credits recorded.</td></tr>
                ) : patientCredits.map((credit) => (
                  <tr key={credit.id}>
                    <td>{formatNigeriaDateTime(credit.createdAt)}</td>
                    <td>{credit.reason}</td>
                    <td>{credit.sourceReference || '—'}</td>
                    <td>{credit.createdByName || 'Staff'}</td>
                    <td className="text-right font-semibold">₦{Number(credit.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment History */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary">Payment Receipt History</h3>
            <button className="btn btn-ghost btn-circle btn-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
          </div>
          <div className="overflow-x-auto w-full min-w-0">
            <table className="table w-full">
              <thead className="bg-base-200">
                <tr className="text-xs text-base-content/60 uppercase tracking-wide">
                  <th>Receipt Reference</th>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Paid By</th>
                  <th>Cashier</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(showAllReceipts ? receipts : receipts.slice(0, 3)).map((payment, index) => {
                  const date = formatNigeriaDate(payment.createdAt);
                  const time = formatNigeriaTime(payment.createdAt);

                  return (
                    <tr key={index} className="text-sm">
                      <td className="font-medium">
                        <button
                          onClick={() => navigate(`/cashier/receipt-details/${payment.id}`, { state: { receiptData: payment } })}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {payment.reference}
                        </button>
                      </td>
                      <td>{date}</td>
                      <td>₦ {Number(payment.amountPaid).toLocaleString()}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>{payment.paymentDestination}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          payment.status === "paid" ? "badge-success" :
                          payment.status === "pending" ? "badge-info" :
                          "badge-neutral"
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{payment.paidBy}</td>
                      <td>{payment.cashier?.firstName} {payment.cashier?.lastName}</td>
                      <td>{time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {receipts.length > 2 && !showAllReceipts && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => navigate(`/cashier/payment-receipt-history/${patientId}`, {
                  state: { dependantId, dependantSnapshot, patientSnapshot: patient },
                })}
                className="btn btn-outline btn-primary btn-sm"
              >
                View All ({receipts.length} receipts)
              </button>
            </div>
          )}

          {showAllReceipts && receipts.length > 3 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllReceipts(false)}
                className="btn btn-outline btn-sm"
              >
                Show Less
              </button>
            </div>
          )}
        </div>



        {/* Receipt Modal */}
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          billingId={selectedBillingId}
          billing={selectedBilling}
          patientId={patientId}
          onSubmit={handleReceiptSubmit}
        />

        {/* Adjust Discount Modal */}
        <AdjustDiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          billing={selectedBilling}
          patientName={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
          approverRole={discountApproverLabel}
          onSuccess={async () => {
            try {
              const billingsRes = await getAllBillings({ patientId });
              const billingsData = billingsRes?.data?.data || billingsRes?.data || [];
              setBillings(filterSubjectRecords(Array.isArray(billingsData) ? billingsData : []));
            } catch (err) {
              console.error('Error refreshing billings after discount:', err);
            }
          }}
        />
      </div>
    </CashierLayout>
  );
};

export default CashierPatientDetails;