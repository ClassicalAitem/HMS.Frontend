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
import { usersAPI } from "@/services/api/usersAPI";
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
import AdmissionHistoryTable from "@/components/doctor/patient/AdmissionHistoryTable";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import { getAdmissionByPatientId } from "@/services/api/admissionApi";
import { getSurgeryByInvestigationRequestId } from "@/services/api/surgeryAPI";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";

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
  const [nurseNameById, setNurseNameById] = useState({});
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

  const dependantId = location?.state?.dependantId || null;
const dependantSnapshot = location?.state?.dependantSnapshot || null;
const isViewingDependant = !!dependantId;
const [subject, setSubject] = useState(null);
const [subjectLoading, setSubjectLoading] = useState(true);

const [admissions, setAdmissions] = useState([]);
const [admissionsLoading, setAdmissionsLoading] = useState(false);

const [procedures, setProcedures] = useState([]);
const [proceduresLoading, setProceduresLoading] = useState(false);

  const filterSubjectRecords = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => (
      isViewingDependant && dependantId ? item?.dependantId === dependantId : !item?.dependantId
    ));
  };

// Helper to navigate with loading
const safeNavigate = (path, options) => {
  setIsNavigating(true);
  navigate(path, options);
};

// Lock the patient record for this doctor before navigation
const lockPatientForConsultation = async () => {
  try {
    if (isViewingDependant && dependantId) {
      const { updateDependantStatus } = await import('@/services/api/dependantAPI');
      await updateDependantStatus(dependantId, { status: 'in_consultation' });
    } else if (patientId) {
      await updatePatientStatus(patientId, { status: 'in_consultation' });
    }
  } catch {
    toast.error("Failed to lock patient record for consultation. Please try again.");
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
  if (!isViewingDependant) {
    const guardian = patient || {};
    return {
      id: guardian.id,
      fullName: `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || guardian.name || 'Unknown',
      gender: guardian.gender,
      phone: guardian.phone || guardian.phoneNumber,
      hospitalId: guardian.hospitalId,
      status: guardian.status,
      hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
      relationshipType: null,
    };
  }

  const dep = subject || dependantSnapshot || {};
  const guardian = dep.patient || patient || {};

  const ownHmos = Array.isArray(guardian.hmos)
    ? guardian.hmos.filter(h => h.dependantId === dep.id)
    : [];

  return {
    id: dep.id || dependantId,
    fullName: `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || dep.fullName || 'Dependant',
    gender: dep.gender || '—',
    phone: dep.phone || guardian.phone || guardian.phoneNumber,
    hospitalId: guardian.hospitalId,
    status: dep.status || dependantSnapshot?.status || 'Unknown',
    hmos: ownHmos,
    relationshipType: dep.relationshipType,
  };
}, [isViewingDependant, subject, dependantSnapshot, patient, dependantId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getVitalsByPatient(patientId);
        const list = normalizeVitalsResponse(res);
        const scopedList = filterSubjectRecords(list);
        if (mounted) setVitals(scopedList);

         if (scopedList.length > 0) {
          const sorted = [...scopedList].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setLatest(sorted[0]);
          setSortedVitals(sorted);
        } else {
          setLatest(null);
          setSortedVitals([]);
        }
        const fromVitalsPatient = scopedList?.[0]?.patient;
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
  }, [patientId, isViewingDependant, dependantId]);



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
        const res = await getConsultations( 
          isViewingDependant ? { patientId, dependantId } : { patientId } 
        );
        const raw = res?.data ?? res ?? [];
        let list = Array.isArray(raw) ? raw : raw?.data ?? [];
        list = filterSubjectRecords(list);
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
  }, [patientId, isViewingDependant, dependantId]);

  useEffect(() => {
    let mounted = true;
    const loadLabs = async () => {
      try {
        setLabLoading(true);
        const res = await getLabResults({ patientId });
        const raw = res?.data ?? res ?? [];
        let list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        list = filterSubjectRecords(list);
        if (mounted) setLabResults(list);
      } finally {
        if (mounted) setLabLoading(false);
      }
    };
    loadLabs();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

useEffect(() => {
  let mounted = true;

  const loadData = async () => {
    try {
      setPrescriptionsLoading(true);

      const [presRes, patientRes] = await Promise.all([
       getPrescriptionByPatientId(patientId, isViewingDependant ? { dependantId } : {}),
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

      list = filterSubjectRecords(list);

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


useEffect(() => {
  return () => {
    if (isViewingDependant && dependantId) {
      import('@/services/api/dependantAPI').then(({ getDependantById, updateDependantStatus }) => {
        getDependantById(dependantId)
          .then((res) => {
            const currentStatus = (
              res?.data?.data?.dependant?.status ??
              res?.data?.dependant?.status ??
              res?.data?.status ??
              ''
            ).toString().toLowerCase();
            if (currentStatus === 'in_consultation') {
              updateDependantStatus(dependantId, { status: 'awaiting_doctor' }).catch(() => {});
            }
          })
          .catch(() => {});
      });
    } else if (patientId) {
      getPatientById(patientId).then((res) => {
        const currentStatus = res?.data?.status ?? '';
        if (currentStatus.toLowerCase() === 'in_consultation') {
          updatePatientStatus(patientId, { status: 'awaiting_doctor' }).catch(() => {});
        }
      }).catch(() => {});
    }
    localStorage.setItem('refreshIncoming', Date.now().toString());
  };
}, [patientId, dependantId, isViewingDependant]);

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
        list = filterSubjectRecords(list);
        if (mounted) setLabInvestigations(list);
      } catch (err) {
        // toast .error("Failed to load lab investigations");
      } finally {
        if (mounted) setInvestigationsLoading(false);
      }
    };
    if (patientId) loadInvestigations();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);


  useEffect(() => {
  let mounted = true;
  const loadAdmissions = async () => {
    try {
      setAdmissionsLoading(true);
      const res = await getAdmissionByPatientId(patientId);
      const rawData = res?.data ?? res; 
      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Object.keys(rawData).length > 0) list = [rawData];
      }
      list = filterSubjectRecords(list);
      if (mounted) setAdmissions(list);
    } catch (err) {
      // getAdmissionByPatientId already suppresses 404s and returns []
      console.error("Failed to load admissions", err);
    } finally {
      if (mounted) setAdmissionsLoading(false);
    }
  };
  if (patientId) loadAdmissions();
  return () => { mounted = false; };
}, [patientId, isViewingDependant, dependantId]);

  // Fetch procedures (surgical notes) tied to this subject's lab investigations
  useEffect(() => {
    let mounted = true;
    const loadProcedures = async () => {
      if (!labInvestigations.length) {
        if (mounted) setProcedures([]);
        return;
      }
      try {
        setProceduresLoading(true);
        const results = await Promise.allSettled(
          labInvestigations.map((inv) => getSurgeryByInvestigationRequestId(inv._id || inv.id))
        );
        const list = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value?.data)
          .filter(Boolean);
        if (mounted) setProcedures(list);
      } catch (err) {
        console.error("Failed to load procedures", err);
      } finally {
        if (mounted) setProceduresLoading(false);
      }
    };
    loadProcedures();
    return () => { mounted = false; };
  }, [labInvestigations]);

  // Fetch dependants on-demand as we encounter them in various data
  useEffect(() => {
    const dependantIdsNeeded = new Set();

    // Collect all dependant IDs from various sources
    [consultations, prescriptions, sortedVitals, labResults, labInvestigations, admissions, procedures]?.forEach(arr => {
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
  }, [consultations, prescriptions, sortedVitals, labResults, labInvestigations, admissions, procedures, dependantCache]);


const isEligibleForAntenatal = useMemo(() => {
  const subject = isViewingDependant ? dependantSnapshot : patient;
  return subject?.gender?.toLowerCase() === 'female';
}, [patient, dependantSnapshot, isViewingDependant]);


  // Fetch antenatal records for eligible female patients
  useEffect(() => {
    if (!isEligibleForAntenatal) return;

    let mounted = true;
   const loadAntenatalRecords = async () => {
      try {
        setAntenatalLoading(true);
        const res = await getAnteNatalRecordByPatientId(patientId);
        const raw = res?.data ?? res ?? [];

        const allRecords = (Array.isArray(raw) ? raw : [])
          .flatMap(wrapper => {
            if (wrapper.patientId !== patientId) return [];
            return (wrapper.anteNatalRecords || []).map(r => ({
              ...r,
              __wrapperId: wrapper._id,
            }));
          });

        if (mounted) {
          const sorted = [...allRecords].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          const scoped = isViewingDependant && dependantId
            ? sorted.filter(r => r.dependantId === dependantId)
            : sorted.filter(r => !r.dependantId);

          setAntenatalRecords(scoped);

          
        }
      } catch (err) {
        console.error("Failed to load antenatal records", err);
      } finally {
        if (mounted) setAntenatalLoading(false);
      }
    };

    loadAntenatalRecords();
    return () => { mounted = false; };
  }, [patientId, isEligibleForAntenatal, isViewingDependant, dependantId]);

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
      setLabInvestigations(filterSubjectRecords(list));
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
      setPrescriptions(filterSubjectRecords(list));
    } catch (err) {
      console.error("Failed to refresh prescriptions", err);
    }
  };

  // Refresh admissions after billing
  const refreshAdmissions = async () => {
    try {
      const res = await getAdmissionByPatientId(patientId);
      const rawData = res?.data ?? res;
      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Object.keys(rawData).length > 0) {
          list = [rawData];
        }
      }
      setAdmissions(filterSubjectRecords(list));
    } catch (err) {
      console.error("Failed to refresh admissions", err);
    }
  };

  // Refresh all after billing
  const refreshBillableItems = async () => {
    await Promise.all([refreshLabInvestigations(), refreshPrescriptions(), refreshAdmissions()]);
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



  const getLabInvestigationPrice = (testName) => {
    if (!testName) return 0;
    const normalizedTestName = String(testName).toLowerCase().trim();
    const match = serviceCharges.find(charge => {
      const serviceName = String(charge?.service || charge?.name || '').toLowerCase().trim();
      return serviceName === normalizedTestName || serviceName.includes(normalizedTestName);
    });
    return Number(match?.amount || match?.price || 0);
  };



    const getLabInvestigationBillItems = () => {
      if (!Array.isArray(investigations)) return [];

      const unbilledInvestigations = investigations.filter(inv => !inv.isBilled && !inv.billId);

      return unbilledInvestigations.flatMap(inv => {
        const serviceCharge = serviceCharges.find(sc => sc.id === inv.serviceChargeId);
        if (serviceCharge && !serviceCharge.isBillable) return [];

        const tests = Array.isArray(inv.tests) ? inv.tests : [];

        if (tests.length === 0) {
          return [{
            serviceChargeId: inv?.serviceChargeId || '',
            code: 'LAB',
            description: inv.type || 'Lab Investigation',
            quantity: 1,
            price: 0,
            investigationId: inv?.id || inv?._id,
          }];
        }

        return tests.map(test => {
          const testName = typeof test === 'string' ? test : (test?.name || test?.code || '');
          return {
            serviceChargeId: inv?.serviceChargeId || '',
            code: 'LAB',
            description: testName || 'Lab Test',
            quantity: 1,
            price: getLabInvestigationPrice(testName) || 0,
            investigationId: inv?.id || inv?._id,
          };
        });
      });
    };

    const getPrescriptionBillItems = () => {
      if (!Array.isArray(prescriptions)) return [];

      const unbilledPrescriptions = prescriptions.filter(pres => !pres.isBilled && !pres.billId);

      return unbilledPrescriptions.flatMap(pres => {
        const serviceCharge = serviceCharges.find(sc => sc.id === pres.serviceChargeId);
        if (serviceCharge && !serviceCharge.isBillable) return [];

        const medications = Array.isArray(pres.medications) ? pres.medications : [];

        if (medications.length === 0) {
          return [{
            serviceChargeId: pres?.serviceChargeId || '',
            code: 'PRESCRIPTION',
            description: 'Prescription',
            quantity: 1,
            price: 0,
            prescriptionId: pres?.id || pres?._id,
          }];
        }

        return medications.map(med => ({
          serviceChargeId: pres?.serviceChargeId || '',
          code: 'PRESCRIPTION',
          description: `${med.drugName} (${med.dosage})`,
          quantity: 1,
          price: Number(getDrugPrice(med?.drugName)) || 0,
          prescriptionId: pres?.id || pres?._id,
        }));
      });
    };

    const getAdmissionBillItems = () => {
      if (!Array.isArray(admissions)) return [];

      const unbilledAdmissions = admissions.filter(adm => !adm.isBilled && !adm.billId);

      return unbilledAdmissions.flatMap(adm => {
        const items = Array.isArray(adm.admissions) ? adm.admissions : [];

        if (items.length === 0) {
          return [{
            serviceChargeId: '',
            code: 'ADMISSION',
            description: adm.ward || 'Admission',
            quantity: 1,
            price: 0,
            admissionId: adm?.id || adm?._id,
          }];
        }

        return items.map(item => {
          const serviceCharge = serviceCharges.find(sc => sc.id === item?.serviceChargeId);
          if (serviceCharge && !serviceCharge.isBillable) return null;

          return {
            serviceChargeId: item?.serviceChargeId || '',
            code: 'ADMISSION',
            description: item.name || adm.ward || 'Admission Item',
            quantity: 1,
            price: Number(item?.amount) || 0,
            admissionId: adm?.id || adm?._id,
          };
        }).filter(Boolean);
      });
    };
  // Helper function to check if item is within last 48 hours
  const isWithin48Hours = (createdAt) => {
    if (!createdAt) return false;
    const itemTime = new Date(createdAt).getTime();
    const now = Date.now();
    const hours48Ms = 48 * 60 * 60 * 1000;
    return now - itemTime < hours48Ms;
  };

  const investigations = useMemo(() => 
    Array.isArray(labInvestigations)
      ? labInvestigations.filter(inv => {
          const status = (inv?.status || '').toLowerCase();
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

          const nurseId = vital.nurseId || vital.nurse?.id || vital.nurse?._id || vital.createdBy;

          return {
            ...vital,
            isForDependant: isDependant,
            forName,
            nurseName: vital.nurseName || (nurseId ? (nurseNameById[nurseId] || 'Unknown Nurse') : 'Unknown Nurse')
          };
        })
      : [],
    [sortedVitals, dependantCache, patient, nurseNameById]
  );

  // Load nurse names for vitals
  const normalizeUserResponse = (response) => {
    const payload = response?.data ?? response;
    const candidate = payload?.data ?? payload?.user ?? payload;
    return candidate?.user ?? candidate;
  };

  useEffect(() => {
    const loadNurses = async () => {
      if (!Array.isArray(sortedVitals) || sortedVitals.length === 0) return;
      const ids = new Set();
      sortedVitals.forEach((v) => {
        const id = v.nurseId || v.nurse?.id || v.nurse?._id || v.createdBy;
        if (id && !nurseNameById[id]) ids.add(id);
      });
      if (ids.size === 0) return;
      try {
        const responses = await Promise.allSettled(Array.from(ids).map(id => usersAPI.getUserById(id)));
        const newNames = {};
        Array.from(ids).forEach((id, idx) => {
          const res = responses[idx];
          if (res?.status === 'fulfilled') {
            const userData = normalizeUserResponse(res.value);
            newNames[id] = userData?.fullName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown Nurse';
          } else {
            newNames[id] = 'Unknown Nurse';
          }
        });
        setNurseNameById(prev => ({ ...prev, ...newNames }));
      } catch (e) {
        console.error('Failed loading nurse names', e);
      }
    };
    loadNurses();
  }, [sortedVitals, nurseNameById]);

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
            onBack={() => navigate(fromIncoming ? "/dashboard/doctor/incoming" : "/dashboard/doctor/patientVitals")}
          />

           {/* Patient Info */}
            <PatientDetailsCard
              patientId={patientId}
              patient={patient}
              summarySubject={summarySubject}
              isViewingDependant={isViewingDependant}
            />

          {isViewingDependant && summarySubject?.fullName && (
            <div className="mb-4 text-sm text-base-content/70">
              Viewing records for <strong>{summarySubject.fullName}</strong>
              {summarySubject.relationshipType ? ` (${summarySubject.relationshipType})` : ""}
              {patientName ? <> — Dependant of <strong>{patientName}</strong></> : null}
            </div>
          )}

          <div>
              <SendPatientModal
                patientId={patientId}
                patient={patient}
                defaultDependantId={dependantId}
                defaultDependantLabel={summarySubject?.fullName}
                lockSubject
                onUpdated={() => navigate('/dashboard/doctor')}
                allowedRoles={['nurse', 'labtechnician', 'pharmacist','cashier', 'hmo']}
              />
             
            </div>

          <CurrentVitalsCard patient={summarySubject} latest={enrichedLatest} loading={loading} onRecordOpen={() => setIsRecordOpen(true)} buttonHidden={true} />

          {/* Antenatal Records Section */}
          {isEligibleForAntenatal && (
            <div className="card bg-base-100 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg font-semibold text-base-content">Antenatal Records</h3>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/dashboard/doctor/antenatal-records/${patientId}/view`, {
                          state: {
                            from: fromIncoming ? "incoming" : "patients",
                            patientSnapshot: patient,
                            dependantId: dependantId || null,
                            dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                          }
                        } )}
                      disabled={antenatalRecords.length === 0}
                    >
                      View Records
                    </button>
                    <button
                      className="btn btn-secondary btn-sm gap-2"
                     onClick={() => lockAndNavigate(
                        `/dashboard/doctor/antenatal-records/${patientId}`,
                        {
                          state: {
                            from: fromIncoming ? "incoming" : "patients",
                            patientSnapshot: patient,
                            dependantId: dependantId || null,
                            dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                          }
                        }
                      )}
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

                  const doctorName = c?.doctor
                    ? `Dr. ${c.doctor.firstName || ""} ${c.doctor.lastName || ""}`.trim()
                    : c?.doctorName || c?.createdBy?.name || "Unknown Doctor";

                  return {
                    id: c?._id || c?.id,
                    type: "Consultation",
                    diagnosis: c?.diagnosis || "—",
                    time: c?.createdAt ? formatNigeriaTime(c.createdAt) : "—",
                    date: c?.createdAt ? formatNigeriaDate(c.createdAt) : "—",
                    doctorName,
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
              `/dashboard/doctor/medical-history/${patientId}/add`,
              {
                state: {
                  from: fromIncoming ? "incoming" : "patients",
                  patientSnapshot: patient,
                  dependantId,
                  dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                },
              }
            )} onViewDetails={(row) => {
                const cid = row?.id;
                if (cid) lockAndNavigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cid}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient, dependantId,                                         // NEW
                  dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
              } });
              }}
             
              onViewAll={() => navigate(`/dashboard/doctor/view-consultation-records/${patientId}`, {
                state: {
                  from: fromIncoming ? "incoming" : "patients",
                  patientSnapshot: patient,
                  dependantId,
                  dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                },
              })}
             onViewMedicalHistory={() => navigate(
              `/dashboard/doctor/medical-record-history/${patientId}${dependantId ? `?dependantId=${dependantId}` : ''}`,
              {
                state: {
                  from: fromIncoming ? "incoming" : "patients",
                  patientSnapshot: patient,
                  dependantId: dependantId || null,
                  dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                },
              }
            )}

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
            onViewAll={() => navigate(`/dashboard/doctor/view-prescriptions/${patientId}`, {
              state: {
                from: fromIncoming ? "incoming" : "patients",
                dependantId,
                dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
              },
            })}
          />

          <LabInvestigationRequestTable 
            investigations={enrichedInvestigations}
            loading={investigationsLoading}
            onViewAll={() => navigate(`/dashboard/doctor/view-investigations/${patientId}`, {
              state: {
                from: fromIncoming ? "incoming" : "patients",
                dependantId,
                dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
              },
            })}
          />
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-base-content">Procedures / Surgical Notes</h3>
              </div>
              {proceduresLoading ? (
                <div className="skeleton h-4 w-48" />
              ) : procedures.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table w-full text-center text-sm">
                    <thead>
                      <tr>
                        <th>For</th>
                        <th>Procedure</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {procedures.slice(0, 5).map((proc) => {
                        const isForDependant = !!proc?.dependantId;
                        const dependant = isForDependant
                          ? dependantCache[proc.dependantId]?.data?.dependant || dependantCache[proc.dependantId]?.dependant || dependantCache[proc.dependantId]
                          : null;
                        const forName = isForDependant
                          ? `${dependant?.firstName || ''} ${dependant?.lastName || ''}`.trim() || 'Dependant'
                          : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
                        const relatedInvestigation = labInvestigations.find(
                          (inv) => (inv._id || inv.id) === proc.investigationRequestId
                        );
                        const consultationIdForProc = relatedInvestigation?.consultationId;

                        return (
                          <tr key={proc._id} className="hover">
                            <td>
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <span className="badge badge-sm badge-outline">
                                  {isForDependant ? 'Dependant' : 'Patient'}
                                </span>
                                <span className="text-sm font-semibold text-base-content">{forName}</span>
                              </div>
                            </td>
                            <td className="text-left">
                              {proc.procedureName} {proc.procedureCode && `(${proc.procedureCode})`}
                            </td>
                            <td>
                              <span className={`badge badge-sm ${proc.status === 'completed' ? 'badge-success' : proc.status === 'in_progress' ? 'badge-info' : proc.status === 'cancelled' ? 'badge-error' : 'badge-ghost'}`}>
                                {proc.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td>{proc.scheduledDate ? formatNigeriaDate(proc.scheduledDate) : '—'}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-ghost"
                                disabled={!consultationIdForProc}
                                onClick={() => consultationIdForProc && lockAndNavigate(
                                  `/dashboard/doctor/medical-history/${patientId}/consultation/${consultationIdForProc}`,
                                  {
                                    state: {
                                      from: fromIncoming ? "incoming" : "patients",
                                      patientSnapshot: patient,
                                      dependantId,
                                      dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
                                    },
                                  }
                                )}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {procedures.length > 5 && (
                    <p className="text-xs text-base-content/50 mt-2">
                      Showing 5 of {procedures.length} procedures
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-base-content/70">No procedures recorded</p>
              )}
            </div>
          </div>

          <AdmissionHistoryTable
            loading={admissionsLoading}
            rows={useMemo(() => (
              Array.isArray(admissions) ? admissions.map((a) => {
                const isDependant = !!a?.dependantId;

                const dependant = isDependant
                  ? dependantCache[a.dependantId]?.data?.dependant || dependantCache[a.dependantId]?.dependant || dependantCache[a.dependantId]
                  : null;

                const forName = isDependant
                  ? `${dependant?.firstName || ''} ${dependant?.lastName || ''}`.trim() || 'Dependant'
                  : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();

                const totalPrice = (a?.admissions || []).reduce(
                  (sum, item) => sum + (Number(item?.amount) || 0), 0
                );

                return {
                  id: a?._id || a?.id,
                  status: a?.status || 'active',
                  ward: a?.ward || '—',
                  date: a?.createdAt ? formatNigeriaDate(a.createdAt) : "—",
                  itemsCount: a?.admissions?.length || 0,
                  itemsSummary: a?.admissions?.slice(0, 2).map(item => item.name) || [],
                  totalPrice: totalPrice > 0 ? totalPrice : null,
                  isForDependant: isDependant,
                  forName,
                };
              }) : []
              // eslint-disable-next-line react-hooks/exhaustive-deps
            ), [admissions, dependantCache, patientName])}
            onViewAll={() => navigate(`/dashboard/doctor/view-admissions/${patientId}`, {
              state: {
                from: fromIncoming ? "incoming" : "patients",
                dependantId,
                dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
              },
            })}
          />
          <VitalsHistoryTable 
            sortedVitals={enrichedVitals} 
            loading={loading}
            patientName={summarySubject?.fullName || `${summarySubject?.firstName || ''} ${summarySubject?.lastName || ''}`.trim() || 'Patient'}
            onViewAll={() => navigate(`/dashboard/doctor/view-vitals/${patientId}`, {
              state: {
                from: fromIncoming ? "incoming" : "patients",
                dependantId,
                dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,
              },
            })}
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
                    onClick={() => latestLab && navigate(`/dashboard/doctor/labResults/${latestLab?._id || latestLab?.id}`)}
                  >
                    View Lab Result
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!labResults || labResults.length === 0}
                    onClick={() => navigate(`/dashboard/doctor/view-lab-results/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients" } })}
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
                const admissionItems = getAdmissionBillItems();
                const allItems = [...labItems, ...prescriptionItems, ...admissionItems];
                
               
                
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
                  const admissionItems = getAdmissionBillItems();
                  const allItems = [...labItems, ...prescriptionItems, ...admissionItems];
                  
                
                  
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
  dependantId={dependantId}
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
            dependantId={dependantId}
            defaultItems={billDefaults}
            onSuccess={() => {
              setBilledItemIds(prev => {
                const next = new Set(prev);
                billDefaults.forEach(item => {
                  if (item.investigationId) next.add(item.investigationId);
                  if (item.prescriptionId) next.add(item.prescriptionId);
                  if (item.admissionId) next.add(item.admissionId);
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