import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { getVitalsByPatient, createVital } from "@/services/api/vitalsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { Skeleton } from "@heroui/skeleton";

const PatientVitalsDetails = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vitals, setVitals] = useState([]);
  const [patient, setPatient] = useState(null);
  // Record vitals modal state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordForm, setRecordForm] = useState({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", notes: "" });

  // Use patient snapshot from navigation if available to render immediately
  useEffect(() => {
    const snap = location?.state?.patientSnapshot;
    console.log('let me see snap:', snap);
    if (snap) {
      setPatient((prev) => prev || snap);
    }

    console.log('PatientVitalsDetails: patientId from params:', patientId);
  }, [location?.state]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
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
            // Silent fallback; page still renders vitals
          }
        }
      } catch (e) {
        console.error("PatientVitalsDetails: fetch error", e);
        if (mounted) setError("Failed to load vitals");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
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

  const patientUUID = patient?.id || location?.state?.patientSnapshot?.id || "";
  console.log('Iwant to see patient:', patient);
  const patientHospitalId = patient?.hospitalId || location?.state?.patientSnapshot?.hospitalId || patientId || "";

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
        <Sidebar onCloseSidebar={closeSidebar} />
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
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/nurse/patient')}>Back to Patients</button>
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
                      <Skeleton isLoaded={!loading} className="w-full h-full rounded-full flex items-center justify-center bg-primary">
                        <div className="w-full h-full grid place-items-center bg-primary text-primary-content text-2xl font-bold">
                          {getInitials(patient?.firstName, patient?.lastName)}
                        </div>
                      </Skeleton>
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current vitals */}
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-base-content">Current Vitals</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setIsRecordOpen(true)}>+ Record Vitals</button>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full" />
                  ))}
                </div>
              ) : latest ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="stat bg-base-200 rounded">
                    <div className="stat-title">Heart Rate</div>
                    <div className="stat-value text-xl">{latest?.heartRate ?? latest?.pulse ?? '—'} bpm</div>
                  </div>
                  <div className="stat bg-base-200 rounded">
                    <div className="stat-title">Blood Pressure</div>
                    <div className="stat-value text-xl">{latest?.bloodPressure ?? latest?.bp ?? '—'}</div>
                  </div>
                  <div className="stat bg-base-200 rounded">
                    <div className="stat-title">Oxygen</div>
                    <div className="stat-value text-xl">{latest?.oxygenSaturation ?? latest?.oxygen ?? latest?.spo2 ?? '—'}%</div>
                  </div>
                  <div className="stat bg-base-200 rounded">
                    <div className="stat-title">Temperature</div>
                    <div className="stat-value text-xl">{latest?.temperature ?? '—'}°F</div>
                  </div>
                  <div className="stat bg-base-200 rounded">
                    <div className="stat-title">Respiratory</div>
                    <div className="stat-value text-xl">{latest?.respiratoryRate ?? '—'} rpm</div>
                  </div>
                  <div className="stat bg-base-200 rounded">
                    <div className="stat-title">Last Updated</div>
                    <div className="stat-value text-xl">{latest?.createdAt ? new Date(latest?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                  </div>
                </div>
              ) : (
                <EmptyState title="No vitals available" description="No vitals recorded for this patient yet." />
              )}
            </div>
          </div>

          {/* Vitals History */}
          <div className="shadow-xl card bg-base-100">
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
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Blood Pressure</th>
                        <th>Heart Rate</th>
                        <th>Temperature</th>
                        <th>Respiratory Rate</th>
                        <th>O2 Saturation</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitals?.length ? vitals.map((v, i) => (
                        <tr key={i} className="hover">
                          <td>{v?.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td>{v?.bloodPressure ?? '—'}</td>
                          <td>{v?.heartRate ?? '—'} bpm</td>
                          <td>{v?.temperature ?? '—'}°F</td>
                          <td>{v?.respiratoryRate ?? '—'} rpm</td>
                          <td>{v?.oxygenSaturation ?? v?.oxygen ?? '—'}%</td>
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