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
import LabInvestigationRequestCard from "@/components/doctor/patient/LabInvestigationRequestCard";
import RecordVitalsModal from "@/components/doctor/patient/RecordVitalsModal";
import { getVitalsByPatient, createVital, normalizeVitalsResponse, getLatestVital, sortVitalsByTime } from "@/services/api/vitalsAPI";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getConsultations } from "@/services/api/consultationAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getPrescriptionByPatientId } from "@/services/api/prescriptionsAPI";
import { getInventories } from "@/services/api/inventoryAPI";
import { getInvestigationByPatientId } from "@/services/api/investigationAPI";
import { getServiceCharges } from "@/services/api/serviceChargesAPI";
import PrescriptionHistoryTable from "@/components/doctor/patient/PrescriptionHistoryTable";
import CreateBillModal from "@/components/modals/CreateBillModal";
import { FaUserMd } from "react-icons/fa";
import SendToNurseModal from "./modals/SendToNurseModal";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import { SendToHmoModal } from "@/components/modals";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";

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
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordForm, setRecordForm] = useState({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", height: "", respiratoryRate: "" });
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
  const [isSendToNurseModalOpen, setIsSendToNurseModalOpen] = useState(false);
  const [isSendToHmoModalOpen, setIsSendToHmoModalOpen] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [billDefaults, setBillDefaults] = useState([]);
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [antenatalLoading, setAntenatalLoading] = useState(false);
const [dependants, setDependants] = useState([]);

  const [isNavigating, setIsNavigating] = useState(false);

// Helper to navigate with loading
const safeNavigate = (path, options) => {
  setIsNavigating(true);
  navigate(path, options);
};

// Lock the patient record for this doctor before navigation
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

  // When this page unmounts, release the lock so another doctor can open the profile
useEffect(() => {
  return () => {
    if (!patientId) return;
    // ✅ Release lock — don't override awaiting_hmo, awaiting_cashier etc
    // Only reset if still in_consultation
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
  const formatUTCTime = (value) => formatUTC(value, { hour: "2-digit", minute: "2-digit", hour12: false });
  const formatNigeriaDateTime = (value) => formatUTC(value, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

  // Mapped Data
  const complaints = consultation?.complaint || [];
  const medicalHistory = consultation?.medicalHistory || [];
  const surgicalHistory = consultation?.surgicalHistory || [];
  const familyHistory = consultation?.familyHistory || [];
  const socialHistory = consultation?.socialHistory || [];
  const allergyHistory = consultation?.allergicHistory || [];
  const notes = consultation?.notes || "";
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

        
        setDependants(patientData?.dependants || []);
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
        console.error("Failed to load lab investigations", err);
      } finally {
        if (mounted) setInvestigationsLoading(false);
      }
    };
    if (patientId) loadInvestigations();
    return () => { mounted = false; };
  }, [patientId]);

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
          setAntenatalRecords(Array.isArray(records) ? records : []);
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
    return labResults.slice().sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())[0];
  }, [labResults]);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

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

  // Helper function to find lab investigation price from service charges
  const getLabInvestigationPrice = (testName, investigationType) => {
    if (!testName) return 0;
    
    const testNameLower = testName.toLowerCase().trim();
    const investTypeLower = (investigationType || '').toLowerCase().trim();
    
    // First try exact match or close match on test name
    const exactMatch = serviceCharges.find(charge => {
      const chargeService = (charge?.service || '').toLowerCase().trim();
      const chargeName = (charge?.name || '').toLowerCase().trim();
      
      // Exact or very close match
      return chargeService === testNameLower || 
             chargeName === testNameLower ||
             chargeService.includes(testNameLower) ||
             chargeName.includes(testNameLower);
    });
    
    if (exactMatch) {
      return Number(exactMatch?.amount || exactMatch?.price || 0);
    }
    
    // If no exact match and we have investigation type, try matching by type
    if (investTypeLower) {
      const typeMatch = serviceCharges.find(charge => {
        const chargeService = (charge?.service || '').toLowerCase().trim();
        const chargeName = (charge?.name || '').toLowerCase().trim();
        const chargeCategory = (charge?.category || '').toLowerCase().trim();
        
        return chargeCategory.includes(investTypeLower) ||
               chargeService.includes(investTypeLower) ||
               chargeName.includes(investTypeLower);
      });
      
      if (typeMatch) {
        return Number(typeMatch?.amount || typeMatch?.price || 0);
      }
    }
    
    return 0;
  };

  // Helper function to check if item is within last 48 hours
  const isWithin48Hours = (createdAt) => {
    if (!createdAt) return false;
    const itemTime = new Date(createdAt).getTime();
    const now = Date.now();
    const hours48Ms = 48 * 60 * 60 * 1000;
    return now - itemTime < hours48Ms;
  };

  // Filter investigations to last 48 hours and exclude completed ones
  const investigations48h = useMemo(() => 
    Array.isArray(labInvestigations) ? labInvestigations.filter(inv => {
      const withinTime = isWithin48Hours(inv?.createdAt);
      const status = (inv?.status || '').toLowerCase();
      const isNotCompleted = !status.includes('completed') && !status.includes('done');
      return withinTime && isNotCompleted;
    }) : [],
    [labInvestigations]
  );

  // Filter lab results to last 48 hours
  const labResults48h = useMemo(() => 
    Array.isArray(labResults) ? labResults.filter(lab => isWithin48Hours(lab?.createdAt)) : [],
    [labResults]
  );

  // Filter prescriptions to last 48 hours
  const prescriptions48h = useMemo(() => 
    Array.isArray(prescriptions) ? prescriptions.filter(p => isWithin48Hours(p?.createdAt)) : [],
    [prescriptions]
  );

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

          <PatientSummaryCard patient={patient} loading={loading} />

          <CurrentVitalsCard patient={patient} latest={latest} loading={loading} onRecordOpen={() => setIsRecordOpen(true)} buttonHidden={true} />


          {/* Antenatal Records Section */}
          {isEligibleForAntenatal && (
            <div className="card bg-base-100 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg font-semibold text-base-content">Antenatal Records</h3>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/dashboard/doctor/antenatal-records/${patientId}/view`)}
                      disabled={antenatalRecords.length === 0}
                    >
                      View Records ({antenatalRecords.length})
                    </button>
                    <button
                      className="btn btn-secondary btn-sm gap-2"
                      onClick={() => lockAndNavigate(`/dashboard/doctor/antenatal-records/${patientId}`)}
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
                          <span className="text-base-content/70">Total Pregnancies:</span>
                          <span className="font-medium">{antenatalRecords.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-base-content/70">Latest EDD:</span>
                          <span className="font-medium">
                            {(() => {
                              const latestEDD = antenatalRecords
                                .map(r => r.presentPregnancyHistories?.[0]?.EDD)
                                .filter(Boolean)
                                .sort((a, b) => new Date(b) - new Date(a))[0];
                              return latestEDD ? formatNigeriaDate(latestEDD) : '-';
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
                          const latest = antenatalRecords.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
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

      // ✅ Determine if consultation is for a dependant or main patient
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
        forName,        // ✅ who the consultation is for
        forRelation,    // ✅ their relation
        isForDependant, // ✅ flag
      };
    }) : []
  ), [consultations, patientName])}
  loading={loading}
 onAdd={() => lockAndNavigate(
  `/dashboard/doctor/medical-history/${patientId}/add`,
  { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } }
)} onViewDetails={(row) => {
    const cid = row?.id;
    if (cid) lockAndNavigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cid}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } });
  }}
  onEdit={(row) => {
  const cid = row?.id;
  if (cid) lockAndNavigate(
    `/dashboard/doctor/medical-history/${patientId}/consultation/${cid}/edit`,
    { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } }
  );
}}
  onViewAll={() => navigate(`/dashboard/doctor/view-consultation-records/${patientId}`)}
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

              const dependant = isForDependant
                ? dependants.find(d => d.id === p.dependantId || d._id === p.dependantId)
                : null;

              const forName = isForDependant
                ? dependant
                  ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim()
                  : 'Dependant'
                : patientName; 

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
          ), [prescriptions, inventoryData, dependants, patientName])}
          />

          <LabInvestigationRequestCard 
            investigations={investigations48h}
            loading={investigationsLoading}
          />
          <VitalsHistoryTable sortedVitals={sortedVitals} loading={loading} />


      

          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-base-content">Latest Lab Result</h3>
                  {labLoading ? (
                    <div className="skeleton h-4 w-48 mt-2" />
                  ) : latestLab ? (
                    <div className="text-sm text-base-content/70">
                      {latestLab?.result?.[0]?.code || latestLab?.result?.[0]?.value || '—'} • {latestLab?.createdAt ? formatNigeriaDateTime(latestLab.createdAt) : '—'}
                    </div>
                  ) : (
                    <div className="text-sm text-base-content/70">No lab results</div>
                  )}
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!latestLab}
                  onClick={() => latestLab && navigate(`/dashboard/doctor/labResults/${latestLab?._id || latestLab?.id}`)}
                >
                  View Lab Result
                </button>
              </div>
            </div>
          </div>


          <div className="mt-6 flex items-start gap-10">
            <div>
              <button
                className="text-primary text-lg font-semibold hover:underline"
              // Find this onClick and replace it:
onClick={() => {
  const prescriptionItems = (prescriptions48h || []).flatMap(p =>
    (p?.medications || []).map(m => ({
      serviceChargeId: "",
      code: "DRUG",
      description: m?.drugName || "Medication",
      quantity: 1,
      price: Number(getDrugPrice(m?.drugName)) || 0
    }))
  );

  const investigationItems = (investigations48h || []).flatMap(inv => {
    const status = (inv?.status || '').toLowerCase();
    if (status.includes('completed') || status.includes('done')) return [];
    const tests = inv.tests || [];
    if (tests.length === 0) return [];
    return tests.map((test) => {
      const testName = typeof test === 'string' ? test : (test?.name || test?.code || 'Lab Test');
      const price = getLabInvestigationPrice(testName, inv?.type);
      return {
        serviceChargeId: inv.id || inv._id || "",
        code: "LAB",
        description: `${testName} (${inv.type || 'Lab Investigation'})`,
        quantity: 1,
        price: price > 0 ? price : 0,
        investigationId: inv.id || inv._id
      };
    });
  });

  // ✅ Always open the modal — even if no items, user can add manually
  const allItems = [...prescriptionItems, ...investigationItems];
  setBillDefaults(allItems); // will be empty array if nothing in 48h — that's fine
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
                  if (!consultation) {
                    alert('Please wait for consultation data to load or select a consultation');
                    return;
                  }
                  setIsSendToNurseModalOpen(true);
                }}
                disabled={isNavigating || !consultation}
              >
                 Send to Nurse
              </button>
              <div className="text-xs text-base-content/70">(assign nursing tasks)</div>
            </div>

            <div>
              <button 
                className="text-primary text-lg font-semibold hover:underline"
               onClick={() => {
  // if (!consultation) {
  //   alert('Please wait for consultation data to load');
  //   return;
  // }
  // ✅ Build items same as cashier
  const prescriptionItems = (prescriptions48h || []).flatMap(p =>
    (p?.medications || []).map(m => ({
      serviceChargeId: "",
      code: "DRUG",
      description: m?.drugName || "Medication",
      quantity: 1,
      price: Number(getDrugPrice(m?.drugName)) || 0
    }))
  );
  const investigationItems = (investigations48h || []).flatMap(inv => {
    const status = (inv?.status || '').toLowerCase();
    if (status.includes('completed') || status.includes('done')) return [];
    return (inv.tests || []).map(test => {
      const testName = typeof test === 'string' ? test : (test?.name || 'Lab Test');
      return {
        serviceChargeId: inv.id || inv._id || "",
        code: "LAB",
        description: `${testName} (${inv.type || 'Lab'})`,
        quantity: 1,
        price: getLabInvestigationPrice(testName, inv?.type) || 0,
      };
    });
  });
  setBillDefaults([...prescriptionItems, ...investigationItems]);
  setIsSendToHmoModalOpen(true);
}}
              >
                 Send to HMO
              </button>
              <div className="text-xs text-base-content/70">(submit for insurance approval)</div>
            </div>
          </div>

                 <SendToNurseModal
        isOpen={isSendToNurseModalOpen}
        onClose={() => setIsSendToNurseModalOpen(false)}
        consultation={consultation}
        patient={patient}
        prescriptions={prescriptions48h}
        labRequests={investigations48h}
        additionalNotes={additionalNotes}
        patientName={patientName}
        doctorName={doctorName}
        consultationDate={consultationDate}
        complaints={complaints}
        medicalHistory={medicalHistory}
        surgicalHistory={surgicalHistory}
        familyHistory={familyHistory}
        socialHistory={socialHistory}
        allergyHistory={allergyHistory}
        notes={notes}
        visitReason={visitReason}
        diagnosis={diagnosis}
        patientId={patientId}
        consultationId={consultation?._id || consultation?.id}
        onSentSuccessfully={() => navigate('/dashboard/doctor/incoming')}
       />

     <SendToHmoModal
  isOpen={isSendToHmoModalOpen}
  onClose={() => setIsSendToHmoModalOpen(false)}
  patientId={patientId}
  patientName={patientName}
  doctorName={doctorName}
  consultationDate={consultationDate}
  visitReason={visitReason}
  diagnosis={diagnosis}
  defaultItems={billDefaults}  // ✅ same items as cashier
  onSentSuccessfully={() => navigate('/dashboard/hmo/incoming')}
/>

          
          <CreateBillModal 
            isOpen={isBillModalOpen}
            onClose={() => setIsBillModalOpen(false)}
            patientId={patientId}
            defaultItems={billDefaults}
            onSuccess={() => {
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalHistory;
