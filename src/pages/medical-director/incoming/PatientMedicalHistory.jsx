import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import PatientSummaryCard from "@/components/doctor/patient/PatientSummaryCard";
import MedicalHistoryTable from "@/components/doctor/patient/MedicalHistoryTable";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import VitalsHistoryTable from "@/components/doctor/patient/VitalsHistoryTable";
import LabHistoryTable from "@/components/doctor/patient/LabHistoryTable";
import LabInvestigationRequestTable from "@/components/doctor/patient/LabInvestigationRequestTable";
import RecordVitalsModal from "@/components/doctor/patient/RecordVitalsModal";
import { getVitalsByPatient, createVital, normalizeVitalsResponse, getLatestVital, sortVitalsByTime } from "@/services/api/vitalsAPI";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import { getConsultations } from "@/services/api/consultationAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getPrescriptionByPatientId } from "@/services/api/prescriptionsAPI";
import { getInventories } from "@/services/api/inventoryAPI";
import { getInvestigationByPatientId } from "@/services/api/investigationAPI";
import { getServiceCharges } from "@/services/api/serviceChargesAPI";
import PrescriptionHistoryTable from "@/components/doctor/patient/PrescriptionHistoryTable";
import CreateBillModal from "@/components/modals/CreateBillModal";
import { FaUserMd } from "react-icons/fa";
import { SendToHmoModal } from "@/components/modals";
import SendPatientModal from "@/components/modals/SendPatientModal";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";

const PatientMedicalHistory = () => {
    const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [sortedVitals, setSortedVitals] = useState([]);
const [latest, setLatest] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
 const [consultations, setConsultations] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [serviceCharges, setServiceCharges] = useState([]);
    const [consultation, setConsultation] = useState(null);
  const [labRequests, setLabRequests] = useState([]);
  const [labInvestigations, setLabInvestigations] = useState([]);
  const [investigationsLoading, setInvestigationsLoading] = useState(false);
  const [isSendToHmoModalOpen, setIsSendToHmoModalOpen] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [billDefaults, setBillDefaults] = useState([]);
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [antenatalLoading, setAntenatalLoading] = useState(false);
const [dependantCache, setDependantCache] = useState({});
const [billedItemIds, setBilledItemIds] = useState(new Set());

  const [isNavigating, setIsNavigating] = useState(false);

// Helper to navigate with loading
const safeNavigate = (path, options) => {
  setIsNavigating(true);
  navigate(path, options);
};

// Lock the patient record for this medical director before navigation
const lockPatientForConsultation = async () => {
  if (!patientId) return;
  try {await updatePatientStatus(patientId, { status: "in_consultation" });
  } catch (err) {
    console.error("Failed to lock patient for consultation", err);
  }
};

const lockAndNavigate = async (path, options) => {
  setIsNavigating(true);
  await lockPatientForConsultation();
  navigate(path, options);
};

    const normalizeStatus = (status) => {
  if (!status) return 'Pending';
  if (Array.isArray(status)) {
    return status.map(s => s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())).join(', ');
  }
  return status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
};

  useEffect(() => {
    const snap = location?.state?.patientSnapshot;
    if (snap) {
      setPatient((prev) => prev || snap);
    }
  }, [location?.state]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getVitalsByPatient(patientId);
        const list = normalizeVitalsResponse(res);
        if (mounted) setVitals(list);

         if (list.length > 0) {
          const sorted = [...list].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setLatest(sorted[0]);
          setSortedVitals(sorted);
        }
        const fromVitalsPatient = list?.[0]?.patient;
        if (fromVitalsPatient) {
          if (mounted) setPatient(fromVitalsPatient);
        } else {
          await getPatientById(patientId).then((pRes) => {
            const pData = pRes?.data ?? pRes;
            if (mounted) setPatient(pData);
          }).catch(() => {});
        }
      } catch {
        console.error("Failed to load vitals");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  // When this page unmounts, release the lock so another medical director can open the profile
useEffect(() => {
  return () => {
    if (!patientId) return;
    getPatientById(patientId)
      .then((res) => {
        const currentStatus = res?.data?.status ?? res?.status ?? '';
        if (currentStatus.toLowerCase() === 'in_consultation') {
          updatePatientStatus(patientId, { status: "in_consultation" }).catch(() => {});
        }
      })
      .catch(() => {});
    localStorage.setItem('refreshIncoming', Date.now().toString());
  };
}, [patientId]);

    const patientName = useMemo(() => (
      patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
    ), [patient]);

  const formatUTC = (value, options) => {
    if (!value) return "";
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(date);
  };

  const formatNigeriaDate = (value) => formatUTC(value, { year: "numeric", month: "long", day: "numeric" });
const formatNigeriaDateTime = (value) => formatUTC(value, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });


  const visitReason = consultation?.visitReason || "Not specified";
  const diagnosis = consultation?.diagnosis || "Pending diagnosis";
  const doctorName = consultation?.doctor ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}` : "Unknown Doctor";
  const consultationDate = consultation?.createdAt ? formatNigeriaDateTime(consultation.createdAt) : "";


  useEffect(() => {
    let mounted = true;
    const loadConsultations = async () => {
      try {
        const res = await getConsultations({ patientId });
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (mounted) {
          setConsultations(list);
          // Set the latest consultation automatically
          if (list.length > 0) {
            const latest = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            setConsultation(latest);
          }
        }
      } catch {
        console.error("Failed to load consultations");
      }
    };
    loadConsultations();
    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const loadLabs = async () => {
      try {
        setLabLoading(true);
        const res = await getLabResults({ patientId });
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (mounted) setLabResults(list);
      } finally {
        if (mounted) setLabLoading(false);
      }
    };
    loadLabs();
    return () => { mounted = false; };
  }, [patientId]);

useEffect(() => {
  let mounted = true;

  const loadData = async () => {
    try {
      setPrescriptionsLoading(true);

      const [presRes, patientRes] = await Promise.all([
        getPrescriptionByPatientId(patientId),
        getPatientById(patientId), 
      ]);

      //  prescriptions
      const rawData = presRes?.data ?? presRes;
      let list = [];

      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Object.keys(rawData).length > 0) {
          list = [rawData];
        }
      }

      // patient + dependants
      const patientData = patientRes?.data ?? patientRes;

      if (mounted) {
        setPrescriptions(list);
        setPatient(patientData);
      }

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      if (mounted) setPrescriptionsLoading(false);
    }
  };

  loadData();

  return () => { mounted = false; };
}, [patientId]);

  // Fetch inventory data to match drug prices
  useEffect(() => {
    let mounted = true;
    const loadInventory = async () => {
      try {
        const res = await getInventories();
        const rawData = res?.data ?? res;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
        if (mounted) setInventoryData(list);
      } catch (err) {
        console.error("Failed to load inventory", err);
      }
    };
    loadInventory();
    return () => { mounted = false; };
  }, []);

  // Fetch service charges for lab investigations pricing
  useEffect(() => {
    let mounted = true;
    const loadServiceCharges = async () => {
      try {
        const res = await getServiceCharges();
        const rawData = res?.data ?? res;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
        if (mounted) setServiceCharges(list);
      } catch (err) {
        console.error("Failed to load service charges", err);
      }
    };
    loadServiceCharges();
    return () => { mounted = false; };
  }, []);

  // Fetch lab investigations for this patient
  useEffect(() => {
    let mounted = true;
    const loadInvestigations = async () => {
      try {
        setInvestigationsLoading(true);
        const res = await getInvestigationByPatientId(patientId);
        const rawData = res?.data ?? res;
        let list = [];
        if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData && typeof rawData === 'object') {
          if (Object.keys(rawData).length > 0) {
            list = [rawData];
          }
        }
        if (mounted) setLabInvestigations(list);
      } catch (err) {
        // toast .error("Failed to load lab investigations");
      } finally {
        if (mounted) setInvestigationsLoading(false);
      }
    };
    if (patientId) loadInvestigations();
    return () => { mounted = false; };
  }, [patientId]);

  // Fetch dependants on-demand as we encounter them in various data
  useEffect(() => {
    const dependantIdsNeeded = new Set();

    // Collect all dependant IDs from various sources
    [consultations, prescriptions, sortedVitals, labResults, labInvestigations]?.forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item?.dependantId && !dependantCache[item.dependantId]) {
            dependantIdsNeeded.add(item.dependantId);
          }
        });
      }
    });

    if (dependantIdsNeeded.size === 0) return;

    const fetchMissingDependants = async () => {
      for (const dependantId of dependantIdsNeeded) {
        try {
          const res = await getDependantById(dependantId);
          const dependantData = res?.data?.dependant || res?.data || res;
          setDependantCache(prev => ({
            ...prev,
            [dependantId]: dependantData
          }));
        } catch (err) {
          console.error(`Failed to load dependant ${dependantId}:`, err);
          // Cache as null to avoid retrying
          setDependantCache(prev => ({
            ...prev,
            [dependantId]: null
          }));
        }
      }
    };

    fetchMissingDependants();
  }, [consultations, prescriptions, sortedVitals, labResults, labInvestigations, labInvestigations, dependantCache]);


const isEligibleForAntenatal = useMemo(() => {
  if (!patient) return false;
  const gender = patient.gender?.toLowerCase();
  return gender === 'female';
}, [patient]);

  // Fetch antenatal records for eligible female patients
  useEffect(() => {
    if (!isEligibleForAntenatal) return;

    let mounted = true;
    const loadAntenatalRecords = async () => {
      try {
        setAntenatalLoading(true);
        const res = await getAnteNatalRecordByPatientId(patientId);
        const records = res?.data ?? res ?? [];
        if (mounted) {
          const sortedRecords = Array.isArray(records)
          ? [...records].sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
          : [];
        setAntenatalRecords(sortedRecords);
        }
      } catch (err) {
        console.error("Failed to load antenatal records", err);
        // Don't show error for missing records, just leave as empty array
      } finally {
        if (mounted) setAntenatalLoading(false);
      }
    };

    loadAntenatalRecords();
    return () => { mounted = false; };
  }, [patientId, isEligibleForAntenatal]);

const latestLab = useMemo(() => { 
  if (!Array.isArray(labResults) || labResults.length === 0) return null;

  const latest = labResults
    .slice()
    .sort((a, b) =>
      new Date(b?.createdAt || 0).getTime() -
      new Date(a?.createdAt || 0).getTime()
    )[0];

  const isDependant = !!latest?.dependantId;

  const dependant = isDependant
    ? patient?.dependants?.find(d => d.id === latest?.dependantId)
    : "Unknown dependant";

  const forName = isDependant
    ? dependant
      ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim()
      : 'Dependant'
    : patientName;

  const forType = isDependant ? 'Dependant' : 'Patient';

  return {
    ...latest,
    isForDependant: isDependant,
    forName,
    forType
  };
}, [labResults, patient, patientName]);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Refresh lab investigations after billing
  const refreshLabInvestigations = async () => {
    try {
      const res = await getInvestigationByPatientId(patientId);
      const rawData = res?.data ?? res;
      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Object.keys(rawData).length > 0) {
          list = [rawData];
        }
      }
      setLabInvestigations(list);
    } catch (err) {
      console.error("Failed to refresh lab investigations", err);
    }
  };

  // Refresh prescriptions after billing
  const refreshPrescriptions = async () => {
    try {
      const presRes = await getPrescriptionByPatientId(patientId);
      const rawData = presRes?.data ?? presRes;
      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Object.keys(rawData).length > 0) {
          list = [rawData];
        }
      }
      setPrescriptions(list);
    } catch (err) {
      console.error("Failed to refresh prescriptions", err);
    }
  };

  // Refresh both after billing
  const refreshBillableItems = async () => {
    await Promise.all([refreshLabInvestigations(), refreshPrescriptions()]);
  };

  // Helper function to find drug price from inventory
  const getDrugPrice = (drugName) => {
    if (!drugName) return null;
    const inventoryDrug = inventoryData.find(item => {
      const inventoryName = item?.name?.toLowerCase() || '';
      const searchName = drugName.toLowerCase();
      // Match if exact or if inventory name contains the search term
      return inventoryName === searchName || inventoryName.includes(searchName);
    });
    return inventoryDrug?.sellingPrice || null;
  };

const getDependantName = (dependant) => {
  if (!dependant) return null;
  return `${dependant.firstName} ${dependant.lastName}`.trim();
};

  const getLabInvestigationPrice = (testName) => {
    if (!testName) return 0;
    const normalizedTestName = String(testName).toLowerCase().trim();
    const match = serviceCharges.find(charge => {
      const serviceName = String(charge?.service || charge?.name || '').toLowerCase().trim();
      return serviceName === normalizedTestName || serviceName.includes(normalizedTestName);
    });
    return Number(match?.amount || match?.price || 0);
  };

  const getInvestigationDescription = (inv) => {
    if (!inv) return 'Lab Investigation';
    const tests = Array.isArray(inv.tests)
      ? inv.tests.map(test => typeof test === 'string' ? test : test?.name || test?.code || '').filter(Boolean)
      : [];
    return tests.length > 0 ? tests.join(', ') : inv.type || 'Lab Investigation';
  };

  const getLabInvestigationBillItems = () => {
    if (!Array.isArray(investigations)) return [];
    
    // Filter out investigations that have already been billed
    const unbilledInvestigations = investigations.filter(inv => !inv.isBilled && !inv.billId);

    return unbilledInvestigations
      .map(inv => {
        // Check if service charge exists and is billable
        const serviceCharge = serviceCharges.find(sc => sc.id === inv.serviceChargeId);
        if (serviceCharge && !serviceCharge.isBillable) return null; // Skip non-billable items

        const tests = Array.isArray(inv.tests) ? inv.tests : [];
        const price = tests.reduce((sum, test) => {
          const testName = typeof test === 'string' ? test : (test?.name || test?.code || '');
          return sum + (getLabInvestigationPrice(testName) || 0);
        }, 0);

        return {
          serviceChargeId: inv?.serviceChargeId || '',
          code: 'LAB',
          description: getInvestigationDescription(inv),
          quantity: 1,
          price,
          investigationId: inv?.id || inv?._id,  // Track which investigation this is from
        };
      })
      .filter(Boolean); // Remove null entries
  };

  const getPrescriptionBillItems = () => {
    if (!Array.isArray(prescriptions)) return [];
    
    // Filter out prescriptions that have already been billed
    const unbilledPrescriptions = prescriptions.filter(pres => !pres.isBilled && !pres.billId);

    return unbilledPrescriptions
      .map(pres => {
        // Check if service charge exists and is billable
        const serviceCharge = serviceCharges.find(sc => sc.id === pres.serviceChargeId);
        if (serviceCharge && !serviceCharge.isBillable) return null; // Skip non-billable items

        const medications = Array.isArray(pres.medications) ? pres.medications : [];
        const price = medications.reduce((sum, med) => {
          const drugPrice = getDrugPrice(med?.drugName);
          return sum + (Number(drugPrice) || 0);
        }, 0);

        return {
          serviceChargeId: pres?.serviceChargeId || '',
          code: 'PRESCRIPTION',
          description: medications.map(m => `${m.drugName} (${m.dosage})`).join(', ') || 'Prescription',
          quantity: 1,
          price,
          prescriptionId: pres?.id || pres?._id, 
        };
      })
      .filter(Boolean); 
  };

  // Helper function to check if item is within last 48 hours
  const isWithin48Hours = (createdAt) => {
    if (!createdAt) return false;
    const itemTime = new Date(createdAt).getTime();
    const now = Date.now();
    const hours48Ms = 48 * 60 * 60 * 1000;
    return now - itemTime < hours48Ms;
  };

  // Filter investigations — no time restriction (investigations need full history)
  const investigations = useMemo(() => 
    Array.isArray(labInvestigations)
      ? labInvestigations.filter(inv => {
          const status = (inv?.status || '').toLowerCase();
          // Show all statuses: requested, in_progress, completed
          const isValid =
            status === 'requested' ||
            status === 'in_progress' ||
            status === 'completed';
          return isValid;
        })
      : [],
    [labInvestigations]
  );

  const enrichedInvestigations = investigations.map(inv => {
  const isDependant = !!inv.dependantId;

const dependant = isDependant
  ? dependantCache[inv.dependantId]?.data?.dependant || dependantCache[inv.dependantId]?.dependant || dependantCache[inv.dependantId]
  : null;


    const forName = isDependant
  ? `${dependant?.firstName || ''} ${dependant?.lastName || ''}`.trim() || 'Dependant'
  : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();


  return {
    ...inv,
    isForDependant: dependant,
    forName
  };
});

 
  const enrichedVitals = useMemo(() =>
    Array.isArray(sortedVitals)
      ? sortedVitals.map(vital => {
          const isDependant = !!vital.dependantId;

          const dependant = isDependant ? dependantCache[vital.dependantId] : null;

          const forName = isDependant
            ? dependant
              ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim()
              : 'Dependant'
            : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();

          return {
            ...vital,
            isForDependant: isDependant,
            forName
          };
        })
      : [],
    [sortedVitals, dependantCache, patient]
  );

  // Get the enriched latest vital
  const enrichedLatest = useMemo(() => enrichedVitals[0] || latest, [enrichedVitals, latest]);




  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <PatientHeaderActions
            title="Patient Details"
            subtitle="Vitals overview and history"
            fromIncoming={fromIncoming}
            onBack={() => navigate(fromIncoming ? "/dashboard/medical-director/incoming" : "/dashboard/medical-director/patientVitals")}
          />

          <PatientSummaryCard patient={patient} loading={loading} />
          <div>
              <SendPatientModal
                patientId={patientId}
                onUpdated={() => navigate('/dashboard/medical-director')}
                allowedRoles={['nurse', 'labtechnician', 'pharmacist','cashier', 'hmo']}
              />
             
            </div>

          <CurrentVitalsCard patient={patient} latest={enrichedLatest} loading={loading} onRecordOpen={() => setIsRecordOpen(true)} buttonHidden={true} />


          {/* Antenatal Records Section */}
          {isEligibleForAntenatal && (
            <div className="card bg-base-100 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg font-semibold text-base-content">Antenatal Records</h3>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/dashboard/medical-director/antenatal-records/${patientId}/view`)}
                      disabled={antenatalRecords.length === 0}
                    >
                      View Records ({antenatalRecords.length})
                    </button>
                    <button
                      className="btn btn-secondary btn-sm gap-2"
                      onClick={() => lockAndNavigate(`/dashboard/medical-director/antenatal-records/${patientId}`)}
                    >
                      <span>+</span> {antenatalRecords.length > 0 ? 'Add New Record' : 'Add First Record'}
                    </button>
                  </div>
                </div>

                {antenatalLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="loading loading-spinner loading-md"></div>
                  </div>
                ) : antenatalRecords.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Summary Stats */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-base-content text-sm">Summary</h4>
                      <div className="bg-base-200/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-base-content/70">Latest Remarks:</span>
                          <span className="font-medium max-w-xs text-right">
                            {(() => {
                              const latest = antenatalRecords.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                              const latestExam = latest?.anteNatalExamination?.slice().sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0))[0];
                              const remark = latestExam?.remark;
                               return remark ? (
                                <div className="text-xs text-base-content/80 bg-base-100/50 p-2 rounded whitespace-pre-wrap max-h-16 overflow-y-auto">
                                  {remark}
                                </div>
                              ) : '-';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-base-content/70">Total Examinations:</span>
                          <span className="font-medium">
                            {antenatalRecords.reduce((sum, r) => sum + (r.anteNatalExamination?.length || 0), 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Latest Record Summary */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-base-content text-sm">Latest Pregnancy</h4>
                      <div className="bg-base-200/50 rounded-lg p-3 space-y-2">
                        {(() => {
                          const latest = antenatalRecords.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                          const pregnancy = latest?.presentPregnancyHistories?.[0];
                          return pregnancy ? (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-base-content/70">EDD:</span>
                                <span className="font-medium">{pregnancy.EDD ? formatNigeriaDate(pregnancy.EDD) : '-'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-base-content/70">LMP:</span>
                                <span className="font-medium">{pregnancy.LMP ? formatNigeriaDate(pregnancy.LMP) : '-'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-base-content/70">Gestational Age:</span>
                                <span className="font-medium">{pregnancy.durationOfPregnancyInWeek || 0} weeks</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-base-content/50 text-sm">No pregnancy data</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-base-content/70">
                    <p>No antenatal records found for this patient.</p>
                    <p className="text-sm mt-2">Click the button above to create the first antenatal record.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <MedicalHistoryTable
              rows={useMemo(() => (
                Array.isArray(consultations) ? consultations.map((c) => {
                  const createdTime = c?.createdAt ? new Date(c.createdAt).getTime() : 0;
                  const now = Date.now();
                  const within24h = now - createdTime < 24 * 60 * 60 * 1000;

                  const isForDependant = !!c?.dependantId && !!c?.dependant;
                  const forName = isForDependant
                    ? `${c.dependant.firstName || ""} ${c.dependant.lastName || ""}`.trim()
                    : patientName;
                  const forRelation = isForDependant
                    ? c.dependant.relationshipType || "Dependant"
                    : "Patient";

                  return {
                    id: c?._id || c?.id,
                    type: "Consultation",
                    diagnosis: c?.diagnosis || "—",
                    time: c?.createdAt ? formatNigeriaTime(c.createdAt) : "—",
                    date: c?.createdAt ? formatNigeriaDate(c.createdAt) : "—",
                    notes: c?.notes || "—",
                    canEdit: within24h,
                    forName,        
                    forRelation,    
                    isForDependant, 
                  };
                }) : []
              // eslint-disable-next-line react-hooks/exhaustive-deps
              ), [consultations, patientName])}
              loading={loading}
            onAdd={() => lockAndNavigate(
              `/dashboard/medical-director/medical-history/${patientId}/add`,
              { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } }
            )} onViewDetails={(row) => {
                const cid = row?.id;
                if (cid) lockAndNavigate(`/dashboard/medical-director/medical-history/${patientId}/consultation/${cid}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } });
              }}
              onEdit={(row) => {
              const cid = row?.id;
              if (cid) lockAndNavigate(
                `/dashboard/medical-director/medical-history/${patientId}/consultation/${cid}/edit`,
                { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } }
              );
            }}
              onViewAll={() => navigate(`/dashboard/medical-director/view-consultation-records/${patientId}`)}
            />


          <PrescriptionHistoryTable 
            loading={prescriptionsLoading}
            
           rows={useMemo(() => (
            Array.isArray(prescriptions) ? prescriptions.map((p) => {
              const totalPrice = (p?.medications || []).reduce((sum, med) => {
                const price = getDrugPrice(med?.drugName);
                return sum + (Number(price) || 0);
              }, 0);

              //  Determine who it's for
              const isForDependant = !!p?.dependantId;
                const isDependant = !!p.dependantId;


              const dependant = isDependant
                ? dependantCache[p.dependantId]?.data?.dependant || dependantCache[p.dependantId]?.dependant || dependantCache[p.dependantId]
                : null;

                              const forName = isDependant
                ? `${dependant?.firstName || ''} ${dependant?.lastName || ''}`.trim() || 'Dependant'
                : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();

              return {
                id: p?._id || p?.id,
                status: normalizeStatus(p?.status),
                date: p?.createdAt ? formatNigeriaDate(p.createdAt) : "—",
                medicationsCount: p?.medications?.length || 0,
                medicationsSummary: p?.medications?.slice(0, 2).map(m => `${m.drugName} (${m.dosage})`) || [],
                totalPrice: totalPrice > 0 ? totalPrice : null,
                isForDependant,
                forName,
              };
            }) : []
          // eslint-disable-next-line react-hooks/exhaustive-deps
          ), [prescriptions, inventoryData, dependantCache, patientName])}
            onViewAll={() => navigate(`/dashboard/medical-director/view-prescriptions/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients" } })}
          />

          <LabInvestigationRequestTable 
            investigations={enrichedInvestigations}
            loading={investigationsLoading}
            onViewAll={() => navigate(`/dashboard/medical-director/view-investigations/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients" } })}
          />
          <VitalsHistoryTable 
            sortedVitals={enrichedVitals} 
            loading={loading}
            patientName={patientName}
            onViewAll={() => navigate(`/dashboard/medical-director/view-vitals/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients" } })}
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
                    onClick={() => latestLab && navigate(`/dashboard/medical-director/labResults/${latestLab?._id || latestLab?.id}`)}
                  >
                    View Lab Result
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!labResults || labResults.length === 0}
                    onClick={() => navigate(`/dashboard/medical-director/view-lab-results/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients" } })}
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
          </div>


          <div className="mt-6 flex items-start gap-10">
            <div>
              <button
                className="text-primary text-lg font-semibold hover:underline"
              onClick={() => {
                const labItems = getLabInvestigationBillItems();
                const prescriptionItems = getPrescriptionBillItems();
                const allItems = [...labItems, ...prescriptionItems];
                
               
                
                setBillDefaults(allItems);
                setIsBillModalOpen(true);
              }}
              disabled={isNavigating}
              >
                Send to cashier
              </button>
              <div className="text-xs text-base-content/70">(send to cashier for payments)</div>
            </div>
     
            

            <div>
              <button 
                className="text-primary text-lg font-semibold hover:underline"
               onClick={() => {
                  const labItems = getLabInvestigationBillItems();
                  const prescriptionItems = getPrescriptionBillItems();
                  const allItems = [...labItems, ...prescriptionItems];
                  
                
                  
                  setBillDefaults(allItems);
                  setIsSendToHmoModalOpen(true);
                }}
              >
                 Send to HMO
              </button>
              <div className="text-xs text-base-content/70">(submit for insurance approval)</div>
            </div>
          </div>



     <SendToHmoModal
  isOpen={isSendToHmoModalOpen}
  onClose={() => setIsSendToHmoModalOpen(false)}
  patientId={patientId}
  patientName={patientName}
  doctorName={doctorName}
  consultationDate={consultationDate}
  visitReason={visitReason}
  diagnosis={diagnosis}
  defaultItems={billDefaults}  
  onSentSuccessfully={() => {
    refreshBillableItems();
    navigate('/dashboard/hmo/incoming');
  }}
/>

          
          <CreateBillModal 
            isOpen={isBillModalOpen}
            onClose={() => setIsBillModalOpen(false)}
            patientId={patientId}
            defaultItems={billDefaults}
            onSuccess={() => {
              setBilledItemIds(prev => {
                const next = new Set(prev);
                billDefaults.forEach(item => {
                  if (item.investigationId) next.add(item.investigationId);
                  if (item.prescriptionId) next.add(item.prescriptionId);
                });
                return next;
              });
              refreshBillableItems();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
