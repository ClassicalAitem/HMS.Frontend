import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PharmacistLayout } from '@/layouts/pharmacist';
import KolakLoader from '@/components/common/KolakLoader';
import api from '@/services/api/apiClient';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaBed, FaTint, FaExchangeAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import { getPatientById } from '@/services/api/patientsAPI';
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
  const [activeTab, setActiveTab] = useState('treatment');

  // Listen to keyboard shortcuts to switch admission tabs (Alt+1 to Alt+4)
  useEffect(() => {
    const handleSwitchAdmissionTab = (e) => {
      const num = e?.detail?.tabNum;
      const tabMap = {
        1: 'treatment',
        2: 'blood',
        3: 'iv-fluids',
        4: 'ebt',
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
        ];
        if (!admission) {
          fetchPromises.push(getAdmissionByPatientId(patientId));
        }

        const results = await Promise.allSettled(fetchPromises);
        const pRes = results[0];
        const vRes = results[1];
        const aRes = results[2];

        if (mounted && pRes?.status === 'fulfilled') {
          const data = pRes.value?.data?.data ?? pRes.value?.data ?? pRes.value;
          setPatient(data);
        }

        if (mounted && vRes?.status === 'fulfilled') {
          const list = normalizeVitalsResponse(vRes.value);
          setVitals(list);
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
        <div className="flex gap-2 border-b border-base-200">
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
