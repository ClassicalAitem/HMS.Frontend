import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import NurseSidebar from "@/components/nurse/dashboard/Sidebar";
import DoctorSidebar from "@/components/doctor/dashboard/Sidebar";
import { useAppSelector } from "@/store/hooks";
import { getVitalsByPatient, createVital } from "@/services/api/vitalsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { CashierActionModal, PharmacyActionModal } from "@/components/modals";
import { toast } from "react-hot-toast";
// Use DaisyUI/Tailwind skeletons to match nurse dashboard styling
import { FiHeart, FiClock } from "react-icons/fi";
import { TbHeartbeat } from "react-icons/tb";
import { LuDroplet, LuThermometer } from "react-icons/lu";
import { GiWeightLiftingUp } from "react-icons/gi";
import InjectionModals from "../incoming/modals/InjectionModals";
import SamplingModals from "../incoming/modals/SamplingModals";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import CreateBillModal from "@/components/modals/CreateBillModal";

const PatientVitalsDetails = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === 'incoming';
  const { user } = useAppSelector((state) => state.auth);
  const role = String(user?.role || '').toLowerCase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [patient, setPatient] = useState(null);
  // Record vitals modal state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isRecordInjection, setIsRecordInjection] = useState(false);
  const [isRecordSampling, setIsRecordSampling] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordForm, setRecordForm] = useState({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", notes: "" });
  const [isSendDoctorOpen, setIsSendDoctorOpen] = useState(false);
  const [isSendPharmacyOpen, setIsSendPharmacyOpen] = useState(false);
  const [isSendCashierOpen, setIsSendCashierOpen] = useState(false);
  const [dependants, setDependants] = useState([]);
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

  // Use patient snapshot from navigation if available to render immediately
  useEffect(() => {
    const snap = location?.state?.patientSnapshot;
    console.log('let me see snap:', snap);
    if (snap) {
      setPatient((prev) => prev || snap);
    }

    console.log('PatientVitalsDetails: patientId from params:', patientId);
  }, [location?.state, patientId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);

        // Fetch vitals for this patient
        const res = await getVitalsByPatient(patientId);
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (mounted) setVitals(list);

        // Try to infer patient info from vitals; fallback to patient API
        const fromVitalsPatient = list?.[0]?.patient;
        if (fromVitalsPatient) {
          if (mounted) setPatient(fromVitalsPatient);
        } else {
          try {
            const pRes = await getPatientById(patientId);
            const pData = pRes?.data ?? pRes;
            if (mounted) setPatient(pData);
          } catch (e) {
            console.warn("PatientVitalsDetails: fallback patient fetch failed", e);
          }
        }
      } catch (e) {
        console.error("PatientVitalsDetails: fetch error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  // Get All Dependant
  useEffect(() => {
    let mounted = true;

    const fetchDependant = async () => {
      try {

        setLoading(true);
        const res = await getAllDependantsForPatient(patientId);
        console.log('Dependants response:', res);
        const data = res?.data.data.dependants ?? res;
        if (mounted)
          setDependants(Array.isArray(data) ? data : (data?.data || []));
      } catch (error) {
        console.error('Error fetching dependant data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDependant();

    return () => { mounted = false; };
  }, [patientId]);

  const latest = useMemo(() => {
    if (!Array.isArray(vitals) || vitals.length === 0) return null;
    return vitals.reduce((acc, v) => {
      const a = new Date(acc?.createdAt || 0).getTime();
      const b = new Date(v?.createdAt || 0).getTime();
      return b > a ? v : acc;
    }, vitals[0]);
  }, [vitals]);

  // Sort vitals history by time descending so latest appears first
  const sortedVitals = useMemo(() => {
    if (!Array.isArray(vitals)) return [];
    return [...vitals].sort((a, b) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return bt - at;
    });
  }, [vitals]);

  const sortedDependants = useMemo(() => {
    if (!Array.isArray(dependants)) return [];
    return [...dependants].sort((a, b) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return bt - at;
    });
  }, [dependants]);

  const patientUUID = patient?.id || location?.state?.patientSnapshot?.id || "";
  console.log('I want to see patient:', patient);
  const patientHospitalId = patient?.hospitalId || location?.state?.patientSnapshot?.hospitalId || patientId || "";
  const patientName = patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown';

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {role === 'doctor' ? (
          <DoctorSidebar />
        ) : (
          <NurseSidebar onCloseSidebar={closeSidebar} />
        )}
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Header actions */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Patient Details</h1>
              <p className="text-sm text-base-content/70">Vitals overview and history</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const base = role === 'doctor' ? '/dashboard/doctor' : '/dashboard/nurse';
                const backPath = fromIncoming ? `${base}/incoming` : role === 'doctor' ? `${base}/patientVitals` : `${base}/patient`;
                navigate(backPath);
              }}
            >
              {fromIncoming ? 'Back to Incoming' : 'Back to Patients'}
            </button>
          </div>

          {/* Patient card */}
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              {loading ? (
                <div className="flex gap-4 items-center">
                  <div className="skeleton w-14 h-14 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-48 mb-2" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="ml-4 avatar">
                    <div className="w-20 h-20 rounded-full border-3 border-primary/80 flex items-center justify-center overflow-hidden p-[2px]">
                      {loading ? (
                        <div className="skeleton w-full h-full rounded-full" />
                      ) : (
                        <div className="w-full h-full grid place-items-center bg-primary text-primary-content text-2xl font-bold">
                          {getInitials(patient?.firstName, patient?.lastName)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    {/* Top row items mimicking frontdesk style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient Name</span>
                        <span className="text-base font-medium text-base-content">{patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Gender</span>
                        <span className="text-base font-medium text-base-content capitalize">{patient?.gender || '—'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Phone Number</span>
                        <span className="text-base font-medium text-base-content">{patient?.phone || patient?.phoneNumber || '—'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient ID</span>
                        <span className="text-base font-medium text-base-content">{patientUUID || '—'}</span>
                        <span className="text-xs text-base-content/70">Hospital ID: {patientHospitalId || '—'}</span>
                </div>
              </div>

              {/* Insurance / HMO list */}
              <div className="flex justify-between items-center px-1 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
                <div className="space-y-1">
                  <span className="block text-sm font-semibold text-base-content">Insurance / HMO:</span>
                  {Array.isArray(patient?.hmos) && patient.hmos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.hmos.map((h, i) => (
                        <span key={i} className="badge badge-outline font-normal text-sm">
                          {`${h?.provider || '—'} - ${h?.plan || '—'} (${h?.expiresAt ? new Date(h.expiresAt).toLocaleDateString('en-US') : '—'})`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-base-content/70">None</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => setIsSendDoctorOpen(true)}>Send to Doctor</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsSendPharmacyOpen(true)}>Send to Pharmacy</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsCreateBillOpen(true)}>Send to Cashier</button>
                </div>
              </div>
            </div>
          </div>
              )}
            </div>
          </div>

          {/* Current vitals */}
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              {/* Header matching design */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-xl font-semibold text-base-content">Current Vitals - {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}</h2>
                  <div className="flex items-center gap-2 text-sm text-base-content/70">
                    {patient?.ward || patient?.bed ? (
                      <span>
                        {patient?.ward ? `Ward ${patient.ward}` : ''}
                        {patient?.ward && patient?.bed ? ' - ' : ''}
                        {patient?.bed ? `Bed ${patient.bed}` : ''}
                      </span>
                    ) : (
                      <span>Ward info unavailable</span>
                    )}
                    <span>•</span>
                    <span>Last updated {formatRelativeTime(latest?.createdAt)}</span>
                  </div>
                </div>
                  {patient?.status === "awaiting_vitals" ? (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setIsRecordOpen(true)}
                    >
                      + Record Vitals
                    </button>
                  ) : patient?.status === "awaiting_injection" ? (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setIsRecordInjection(true)}
                    >
                      + Record Injection
                    </button>
                  ) : patient?.status === "awaiting_sampling" ? (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setIsRecordSampling(true)}
                    >
                      + Collect Sampling
                    </button>
                  ) : null}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-20 w-full" />
                  ))}
                </div>
              ) : latest ? (
                <>
                  {/* Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Heart Rate */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <FiHeart className="w-5 h-5" />
                        <span>Heart Rate</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.heartRate ?? latest?.pulse ?? '—'}</span>
                        <span className="text-sm text-base-content/70">bpm</span>
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <TbHeartbeat className="w-5 h-5" />
                        <span>Blood Pressure</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.bloodPressure ?? latest?.bp ?? '—'}</span>
                        <span className="text-sm text-base-content/70">bpm</span>
                      </div>
                    </div>

                    {/* Oxygen */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <LuDroplet className="w-5 h-5" />
                        <span>Oxygen</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.oxygenSaturation ?? latest?.oxygen ?? latest?.spo2 ?? '—'}</span>
                        <span className="text-sm text-base-content/70">%</span>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <LuThermometer className="w-5 h-5" />
                        <span>Temperature</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.temperature ?? '—'}</span>
                        <span className="text-sm text-base-content/70">°F</span>
                      </div>
                    </div>

                    {/* Respiratory */}
                    {/* <div className="rounded-xl border border-base-300 p-3 hidden">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <LuActivity className="w-5 h-5" />
                        <span>Respiratory</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.respiratoryRate ?? '—'}</span>
                        <span className="text-sm text-base-content/70">rpm</span>
                      </div>
                    </div> */}

                    {/* Weight */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <GiWeightLiftingUp  className="w-5 h-5" />
                        <span>Weight</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.weight ?? '—'}</span>
                        <span className="text-sm text-base-content/70">kg</span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <FiClock className="w-5 h-5" />
                        <span>Last Updated</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{formatRelativeTime(latest?.createdAt) || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="mt-4">
                    <div className="rounded-xl border border-base-300 p-4">
                      <div className="text-base font-medium text-base-content">Additional Notes</div>
                      <div className="mt-2 text-sm text-base-content/80 min-h-24 whitespace-pre-wrap">
                        {latest?.notes ? latest.notes : '—'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState title="No vitals available" description="No vitals recorded for this patient yet." />
              )}
            </div>
          </div>

          {/* Dependant History */}
          <div className="shadow-xl card bg-base-100">
            <div className="p-4 card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-base-content">Dependant History</h2>
                <div className="text-sm text-base-content/70">Showing {dependants?.length || 0} readings</div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Relationship</th>
                        <th>Gender</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDependants?.length ? sortedDependants.map((v, i) => (
                        <tr key={i} className="hover">
                          <td>{v?.firstName ?? '—'}</td>
                          <td>{v?.lastName ?? '—'}</td>
                          <td>{v?.relationshipType ?? '—'}</td>
                          <td>{v?.gender ?? '—'}</td>
                          <td>
                          <button
                            className="px-3 py-1 rounded-full bg-primary text-white"
                            onClick={() => v?.id && navigate(`/dashboard/nurse/dependant/${v.id}`, { state: { from: 'incoming', patientSnapshot: data.snapshot } })}
                          >
                            View Dependant Details
                          </button></td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7}>
                            <EmptyState title="No Dependant" description="No dependant history found for this patient." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Vitals History */}
          <div className="shadow-xl card bg-base-100 mt-4">
            <div className="p-4 card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-base-content">Vitals History</h2>
                <div className="text-sm text-base-content/70">Showing {vitals?.length || 0} readings</div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Blood Pressure</th>
                        <th>Heart Rate</th>
                        <th>Temperature</th>
                        <th>Weight</th>
                        <th>O2 Saturation</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedVitals?.length ? sortedVitals.map((v, i) => (
                        <tr key={i} className="hover">
                          <td>{v?.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td>{v?.bp ?? '—'} <span className="text-sm text-base-content/70">mmHg</span></td>
                          <td>{v?.pulse ?? '—'} <span className="text-sm text-base-content/70">bpm</span></td>
                          <td>{v?.temperature ?? '—'} <span className="text-sm text-base-content/70">°F</span></td>
                          <td>{v?.weight ?? '—'} <span className="text-sm text-base-content/70">kg</span></td>
                          <td>{v?.spo2 ?? v?.oxygen ?? '—'} <span className="text-sm text-base-content/70">%</span></td>
                          <td><span className="badge badge-success">Normal</span></td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7}>
                            <EmptyState title="No history" description="No vitals history found for this patient." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Record Vitals Modal */}
          {isRecordOpen && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Record New Vitals - {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}</h3>
                <p className="py-1 text-sm">Enter the latest vital signs for this patient.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Blood Pressure</label>
                    <input type="text" placeholder="120/80" className="input input-bordered w-full"
                      value={recordForm.bp}
                      onChange={(e) => setRecordForm((f) => ({ ...f, bp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Pulse</label>
                    <input type="number" placeholder="78" className="input input-bordered w-full"
                      value={recordForm.pulse}
                      onChange={(e) => setRecordForm((f) => ({ ...f, pulse: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Weight</label>
                    <input type="number" placeholder="62" className="input input-bordered w-full"
                      value={recordForm.weight}
                      onChange={(e) => setRecordForm((f) => ({ ...f, weight: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Temperature (°F)</label>
                    <input type="number" placeholder="98.6" className="input input-bordered w-full"
                      value={recordForm.temperature}
                      onChange={(e) => setRecordForm((f) => ({ ...f, temperature: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">SpO2</label>
                    <input type="number" placeholder="98" className="input input-bordered w-full"
                      value={recordForm.spo2}
                      onChange={(e) => setRecordForm((f) => ({ ...f, spo2: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm text-base-content/70">Notes</label>
                    <textarea placeholder="Optional notes" className="textarea textarea-bordered w-full"
                      value={recordForm.notes}
                      onChange={(e) => setRecordForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>

                {recordError && <p className="mt-2 text-sm text-error">{recordError}</p>}

                <div className="modal-action">
                  <button className="btn btn-ghost" onClick={() => { setIsRecordOpen(false); setRecordError(""); }}>Cancel</button>
                  <button className={`btn btn-primary ${recordLoading ? 'loading' : ''}`} onClick={async () => {
                    try {
                      setRecordLoading(true);
                      setRecordError("");
                      const payload = {
                        patientId: patientUUID || patientId,
                        bp: recordForm.bp,
                        temperature: recordForm.temperature ? Number(recordForm.temperature) : undefined,
                        weight: recordForm.weight ? Number(recordForm.weight) : undefined,
                        pulse: recordForm.pulse ? Number(recordForm.pulse) : undefined,
                        spo2: recordForm.spo2 ? Number(recordForm.spo2) : undefined,
                        notes: recordForm.notes || undefined,
                      };
                      const res = await createVital(payload);
                      const created = res?.data ?? res;
                      // Prepend new vital to history and update latest
                      setVitals((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
                      setIsRecordOpen(false);
                      setRecordForm({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", notes: "" });
                    } catch (e) {
                      const msg = e?.response?.data?.message || 'Failed to record vitals';
                      setRecordError(msg);
                    } finally {
                      setRecordLoading(false);
                    }
                  }}>Record Vitals</button>
                </div>
              </div>
            </div>
          )}

          {/* Send to Doctor Modal */}
          {isSendDoctorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSendDoctorOpen(false)} />
              <div className="relative z-10 w-full max-w-lg shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-base-content">Confirm Send to Doctor</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsSendDoctorOpen(false)}>Close</button>
                  </div>
                  <p className="mb-4 text-sm text-base-content/70">
                    Are you sure you want to send this patient to the doctor for consultation? This will update the status to <span className="font-medium">awaiting_consultation</span> for {patientName} ({patientHospitalId || '—'}).
                  </p>
                  <div className="flex justify-end gap-3 mt-6">
                    <button className="btn" onClick={() => setIsSendDoctorOpen(false)}>Cancel</button>
                    <button
                      className="btn btn-success"
                      onClick={async () => {
                        try {
                          const promise = updatePatientStatus(patientUUID || patientId, 'awaiting_consultation');
                          toast.promise(promise, {
                            loading: 'Sending to doctor...',
                            success: 'Patient sent to doctor successfully',
                            error: (err) => err?.response?.data?.message || 'Failed to send to doctor',
                          });
                          await promise;
                          setIsSendDoctorOpen(false);
                        } catch (e) {
                          console.error("PatientVitalsDetails: send to doctor failed", e);
                        }
                      }}
                    >
                      Confirm & Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send to Pharmacy Modal */}
          {isSendPharmacyOpen && (
            <PharmacyActionModal
              isOpen={isSendPharmacyOpen}
              onClose={() => setIsSendPharmacyOpen(false)}
              patientId={patientUUID || patientId}
              defaultStatus={"awaiting_pharmacy"}
              itemsCount={0}
              medicationNames={[]}
              patientLabel={`${patientName} (${patientHospitalId || '—'})`}
              onUpdated={() => setIsSendPharmacyOpen(false)}
            />
          )}

          {/* Send to Cashier Modal */}

            <CashierActionModal
              isOpen={isSendCashierOpen}
              onClose={() => setIsSendCashierOpen(false)}
              patientId={patient?.id || patientId}
              defaultStatus={"awaiting_cashier"}
              onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
            />


          <CreateBillModal
            isOpen={isCreateBillOpen}
            onClose={() => setIsCreateBillOpen(false)}
            patientId={patientId}
            onSuccess={() => {
              setIsSendCashierOpen(true);
            }}
          />

          {/* Injection Modal */}
          {isRecordInjection && (
            <InjectionModals
              setIsRecordInjection={setIsRecordInjection}
              patientId={patientId}
              patientData={patient}
            />
          )}

          {/* Sampling Modal */}
          {isRecordSampling && (
            <SamplingModals
              setIsRecordSampling={setIsRecordSampling}
              patientId={patientId}
              patientData={patient}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientVitalsDetails;

// Helper: compute initials from first/last name with fallback
const getInitials = (firstName, lastName) => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (!f && !l) return 'U';
  const firstInitial = f ? f.charAt(0).toUpperCase() : '';
  const lastInitial = l ? l.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}` || 'U';
};

// Helper: relative time like "10 mins ago"
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const now = new Date();
  const then = new Date(dateInput);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return '';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
};