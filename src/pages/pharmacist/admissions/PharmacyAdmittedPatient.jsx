import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PharmacistLayout } from '@/layouts/pharmacist';
import KolakLoader from '@/components/common/KolakLoader';
import api from '@/services/api/apiClient';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaBed, FaTint, FaExchangeAlt, FaFileInvoiceDollar, FaPills } from 'react-icons/fa';
import { getPatientById } from '@/services/api/patientsAPI';
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI';
import { getVitalsByPatient, normalizeVitalsResponse } from '@/services/api/vitalsAPI';
import PatientDetailsCard from '@/components/common/PatientDetailsCard';
import CurrentVitalsCard from '@/components/doctor/patient/CurrentVitalsCard';
import TreatmentPlanTab from '@/components/admitted/TreatmentPlanTab';
import BloodTransfusionTab from '@/components/admitted/BloodTransfusionTab';
import IvFluidTab from '@/components/admitted/IvFluidTab';
import EbtTab from '@/components/admitted/EbtTab';
import { FaDroplet } from 'react-icons/fa6';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';

const PharmacyAdmittedPatient = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [admission, setAdmission] = useState(location?.state?.admission || null);
  const admissionId = admission?._id || admission?.id;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('treatment');

  // Listen to keyboard shortcuts to switch admission tabs (Alt+1 to Alt+5)
  useEffect(() => {
    const handleSwitchAdmissionTab = (e) => {
      const num = e?.detail?.tabNum;
      const tabMap = {
        1: 'treatment',
        2: 'prescriptions',
        3: 'blood',
        4: 'iv-fluids',
        5: 'ebt',
      };
      if (num && tabMap[num]) {
        setActiveTab(tabMap[num]);
      }
    };
    window.addEventListener('switch-admission-tab', handleSwitchAdmissionTab);
    return () => window.removeEventListener('switch-admission-tab', handleSwitchAdmissionTab);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setVitalsLoading(true);
      try {
        const fetchPromises = [
          getPatientById(patientId),
          getVitalsByPatient(patientId),
          getPrescriptionByPatientId(patientId),
        ];
        if (!admission) {
          fetchPromises.push(getAdmissionByPatientId(patientId));
        }

        const results = await Promise.allSettled(fetchPromises);
        const pRes = results[0];
        const vRes = results[1];
        const rxRes = results[2];
        const aRes = results[3];

        if (mounted && pRes?.status === 'fulfilled') {
          const data = pRes.value?.data?.data ?? pRes.value?.data ?? pRes.value;
          setPatient(data);
        }

        if (mounted && vRes?.status === 'fulfilled') {
          const list = normalizeVitalsResponse(vRes.value);
          setVitals(list);
        }

        if (mounted && rxRes?.status === 'fulfilled') {
          const raw = rxRes.value?.data ?? rxRes.value;
          const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
          setPrescriptions(list);
        }

        if (mounted && aRes?.status === 'fulfilled') {
          const data = aRes.value?.data?.data ?? aRes.value?.data ?? aRes.value;
          if (Array.isArray(data)) {
            const active = data.find((a) => a.status !== 'discharged') || data[0];
            if (active) setAdmission(active);
          } else if (data) {
            setAdmission(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load admission details', err);
      } finally {
        if (mounted) {
          setLoading(false);
          setVitalsLoading(false);
        }
      }
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, [patientId]);

  const summarySubject = useMemo(() => {
    return {
      ...(patient || {}),
      status: patient?.status || 'Admitted',
      statusSenderName: patient?.statusSenderName,
      statusUser: patient?.statusUser,
      updatedAt: patient?.updatedAt,
      hmos: Array.isArray(patient?.hmos) ? patient?.hmos.filter((h) => !h.dependantId) : [],
      relationshipType: null,
    };
  }, [patient]);

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="space-y-6 min-w-0">
        {/* Header section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/pharmacist/admissions')}
              className="btn btn-sm btn-ghost btn-circle shrink-0"
              title="Back to Admissions"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                <FaBed className="text-primary" /> Ward Treatment Plans
              </h1>
              <p className="text-base-content/70 text-sm mt-1">
                Patient ID: {patientId} • Ward: {admission?.ward || admission?.wardId || 'General'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/pharmacist/incoming/${patientId}`)}
              className="btn btn-sm btn-primary shrink-0"
            >
              <FaPills className="w-3.5 h-3.5 mr-1" /> Open Dispense Queue
            </button>
          </div>
        </div>

        {/* Patient Header Details */}
        <PatientDetailsCard
          patient={patient || admission?.patient}
          summarySubject={summarySubject}
          isViewingDependant={false}
        />

        {/* Vitals Summary */}
        <div className="bg-base-100 rounded-xl shadow-lg border border-base-200 p-6 mb-6">
          <CurrentVitalsCard
            patientId={patientId}
            dependantId={null}
            vitalsList={vitals}
            loading={vitalsLoading}
            buttonHidden={true}
          />
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-base-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('treatment')}
            className={`btn btn-sm rounded-none border-b-2 font-bold ${
              activeTab === 'treatment'
                ? 'btn-ghost border-primary text-primary'
                : 'btn-ghost border-transparent text-base-content/60'
            }`}
          >
            Treatment Plans
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`btn btn-sm rounded-none border-b-2 font-bold ${
              activeTab === 'prescriptions'
                ? 'btn-ghost border-primary text-primary'
                : 'btn-ghost border-transparent text-base-content/60'
            }`}
          >
            <FaPills className="w-3.5 h-3.5" /> Prescriptions & Post-Op Meds
            {prescriptions.length > 0 && (
              <span className="badge badge-sm badge-primary text-white ml-1.5">{prescriptions.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('blood')}
            className={`btn btn-sm rounded-none border-b-2 font-bold ${
              activeTab === 'blood'
                ? 'btn-ghost border-error text-error'
                : 'btn-ghost border-transparent text-base-content/60'
            }`}
          >
            <FaDroplet className="w-3.5 h-3.5" /> Blood Transfusion Preps
          </button>
          <button
            onClick={() => setActiveTab('iv-fluids')}
            className={`btn btn-sm rounded-none border-b-2 font-bold ${
              activeTab === 'iv-fluids'
                ? 'btn-ghost border-info text-info'
                : 'btn-ghost border-transparent text-base-content/60'
            }`}
          >
            <FaTint className="w-3.5 h-3.5" /> IV Fluids Consumables
          </button>
          <button
            onClick={() => setActiveTab('ebt')}
            className={`btn btn-sm rounded-none border-b-2 font-bold ${
              activeTab === 'ebt'
                ? 'btn-ghost border-secondary text-secondary'
                : 'btn-ghost border-transparent text-base-content/60'
            }`}
          >
            <FaExchangeAlt className="w-3.5 h-3.5" /> EBT Consumables
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'treatment' && (
            <TreatmentPlanTab
              admissionId={admissionId}
              isPharmacy={true}
              isNurse={false}
            />
          )}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-base-100 p-4 rounded-lg border border-base-200 gap-3">
                <div>
                  <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                    <FaPills /> Prescriptions & Post-Operative Medications
                  </h3>
                  <p className="text-sm text-base-content/60">
                    Review and dispense medications prescribed during surgery or inpatient stay.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/dashboard/pharmacist/incoming/${patientId}`)}
                  className="btn btn-sm btn-primary shrink-0"
                >
                  <FaPills className="w-3.5 h-3.5 mr-1" /> Dispense in Pharmacy Queue
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="bg-base-100 rounded-lg border border-dashed border-base-300 p-8 text-center text-sm text-base-content/60">
                  No prescriptions or post-operative medications found for this patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx, idx) => (
                    <div key={rx._id || rx.id || idx} className="bg-base-100 rounded-lg border border-base-200 p-4 shadow-sm">
                      <div className="flex justify-between items-start border-b border-base-200 pb-2 mb-3">
                        <div>
                          <span className="font-semibold text-sm">
                            Prescription #{idx + 1}
                            {rx.surgeryId && <span className="badge badge-sm badge-secondary ml-2">Post-Operative</span>}
                          </span>
                          <span className="text-xs text-base-content/50 ml-3">
                            {rx.createdAt ? new Date(rx.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <span className={`badge badge-sm capitalize ${
                          rx.status === 'completed' || rx.status === 'dispensed'
                            ? 'badge-success text-white'
                            : 'badge-warning'
                        }`}>
                          {rx.status || 'Pending'}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="table table-sm w-full">
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Medication</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(rx.medications || []).map((m, mIdx) => (
                              <tr key={mIdx}>
                                <td className="capitalize font-medium text-xs">{m.medicationType || 'Tablet'}</td>
                                <td className="font-bold text-sm text-primary">{m.drugName}</td>
                                <td>{m.dosage || `${m.dosageAmount || ''} ${m.dosageUnit || ''}`}</td>
                                <td><span className="badge badge-sm badge-ghost">{m.frequency}</span></td>
                                <td>{m.duration}</td>
                                <td className="text-xs text-base-content/70">{m.instructions || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'blood' && (
            <BloodTransfusionTab
              patientId={patientId}
              admissionId={admissionId}
              isPharmacist={true}
            />
          )}
          {activeTab === 'iv-fluids' && (
            <IvFluidTab
              patientId={patientId}
              admissionId={admissionId}
              isPharmacist={true}
            />
          )}
          {activeTab === 'ebt' && (
            <EbtTab
              patientId={patientId}
              admissionId={admissionId}
              isPharmacist={true}
            />
          )}
        </div>
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyAdmittedPatient;
