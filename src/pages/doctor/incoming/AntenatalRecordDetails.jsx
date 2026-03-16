import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import toast from "react-hot-toast";

const AntenatalRecordDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [patient, setPatient] = useState(null);
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState(null);
  const [dependants, setDependants] = useState([]);

  useEffect(() => {
    console.log('AntenatalRecordDetails: Component mounted with patientId:', patientId);
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const loadPatient = async () => {
      try {
        setLoadingPatient(true);
        setError(null);
        console.log('Loading patient data for ID:', patientId);
        const res = await getPatientById(patientId);
        const pData = res?.data ?? res;
        console.log('Patient data loaded:', pData);
        if (mounted) setPatient(pData);
      } catch (err) {
        console.error("Failed to load patient:", err);
        if (mounted) {
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            setError('Request timed out. Please check your connection and try again.');
          } else {
            setError(`Failed to load patient: ${err.message}`);
          }
        }
      } finally {
        if (mounted) setLoadingPatient(false);
      }
    };

    if (patientId) {
      loadPatient();
    } else {
      console.error('No patientId provided');
      setError('No patient ID provided');
      setLoadingPatient(false);
    }

    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const loadAntenatalRecord = async () => {
      try {
        setLoadingData(true);
        setError(null);
        console.log('Loading antenatal records for patient ID:', patientId);
        const res = await getAnteNatalRecordByPatientId(patientId);
        console.log('Antenatal records response:', res);
        const records = res?.data ?? res ?? [];
        console.log('Processed antenatal records:', records);
        if (mounted) {
          setAntenatalRecords(Array.isArray(records) ? records : []);
        }
      } catch (err) {
        console.error("Failed to load antenatal record:", err);
        if (mounted) {
        
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            setError('Request timed out. Please check your connection and try again.');
          } else if (err.response?.status !== 404) {
            setError(`Failed to load antenatal record: ${err.message}`);
          }
        }
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    if (patientId) {
      loadAntenatalRecord();
    }

    return () => { mounted = false; };
  }, [patientId]);
  useEffect(() => {
  let mounted = true;
  const fetchDependants = async () => {
    try {
      const res = await getAllDependantsForPatient(patientId);
      const raw = res?.data?.data?.dependants ?? res?.data?.dependants ?? res?.data ?? [];
      const normalized = (Array.isArray(raw) ? raw : []).map(dep => ({
        ...dep,
        id: dep.id || dep._id,
        fullName: dep.fullName || `${dep.firstName || ""} ${dep.lastName || ""}`.trim(),
      }));
      if (mounted) setDependants(normalized);
    } catch {
      toast.error("Failed to load dependants for patient. Dependant-related features may not work properly.");
    }
  };
  if (patientId) fetchDependants();
  return () => { mounted = false; };
}, [patientId]);
const getDependantName = (dependantId) => {
  if (!dependantId) return null;
  const dep = dependants.find(d => d.id === dependantId);
  return dep ? `${dep.fullName} (${dep.relationshipType || 'Dependant'})` : null;
};

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (loadingPatient || loadingData) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="alert alert-error max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Antenatal Record Details</h1>
              <p className="text-base-content/70 mt-1">
                Patient: {patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/dashboard/doctor/patient-details/${patientId}`)}
              >
                Back to Patient
              </button>
              <button
                className="btn btn-secondary gap-2"
                onClick={() => navigate(`/dashboard/doctor/antenatal-records/${patientId}`)}
              >
                <span>+</span> Add New Record
              </button>
            </div>
          </div>

          {antenatalRecords.length > 0 ? (
            <div className="space-y-6">
              {/* List of Records */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-6">
                  <h3 className="card-title text-lg font-semibold text-base-content mb-4">Antenatal Records</h3>
                  <div className="space-y-4">
                    {antenatalRecords.map((record, index) => {
  const dependantName = getDependantName(record.dependantId);
  return (
    <div key={record._id || record.id || index} className="border border-base-300 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-base-content">
              Pregnancy #{index + 1}
              {record.presentPregnancyHistories?.[0]?.EDD && (
                <span className="text-sm text-base-content/70 ml-2">
                  (EDD: {new Date(record.presentPregnancyHistories[0].EDD).toLocaleDateString()})
                </span>
              )}
            </h4>
          </div>

          {/* ✅ Show who this record is for */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-base-content/50">Record for:</span>
            {dependantName ? (
              <span className="badge badge-secondary badge-sm">{dependantName}</span>
            ) : (
              <span className="badge badge-primary badge-sm">
                {patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()} (Patient)
              </span>
            )}
          </div>

          <p className="text-sm text-base-content/70">
            Created: {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setSelectedRecord(selectedRecord?._id === record._id ? null : record)}
          >
            {selectedRecord?._id === record._id ? 'Hide Details' : 'View Details'}
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => navigate(`/dashboard/doctor/antenatal-records/${patientId}/edit/${index}`)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
})}
                  </div>
                </div>
              </div>

              {/* Selected Record Details */}
              {selectedRecord && (
                <div className="space-y-6">
                  {/* Present Pregnancy */}
                  {selectedRecord.presentPregnancyHistories && selectedRecord.presentPregnancyHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-6">
                        <h3 className="card-title text-lg font-semibold text-base-content mb-4">Present Pregnancy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="stat bg-base-200/50 rounded-lg p-4">
                            <div className="stat-title text-sm">Expected Date of Delivery</div>
                            <div className="stat-value text-lg">
                              {selectedRecord.presentPregnancyHistories[0].EDD ? new Date(selectedRecord.presentPregnancyHistories[0].EDD).toLocaleDateString() : '-'}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-4">
                            <div className="stat-title text-sm">Last Menstrual Period</div>
                            <div className="stat-value text-lg">
                              {selectedRecord.presentPregnancyHistories[0].LMP ? new Date(selectedRecord.presentPregnancyHistories[0].LMP).toLocaleDateString() : '-'}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-4">
                            <div className="stat-title text-sm">Gestational Age</div>
                            <div className="stat-value text-lg">
                              {selectedRecord.presentPregnancyHistories[0].durationOfPregnancyInWeek || 0} weeks
                            </div>
                          </div>
                        </div>

                        <div className="divider"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-base-content mb-3">Symptoms</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Bleeding:</span>
                                <span className={selectedRecord.presentPregnancyHistories[0].bleeding === 'yes' ? 'text-error font-medium' : 'text-base-content/70'}>
                                  {selectedRecord.presentPregnancyHistories[0].bleeding || 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Headache:</span>
                                <span className={selectedRecord.presentPregnancyHistories[0].headache === 'yes' ? 'text-warning font-medium' : 'text-base-content/70'}>
                                  {selectedRecord.presentPregnancyHistories[0].headache || 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vomiting:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].vomiting || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Oedema:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].oedema || 'No'}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-base-content mb-3">Other Conditions</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Constipation:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].constipation || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Urinary Symptoms:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].urinarySymptoms || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Jaundice:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].jaundice || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vaginal Discharge:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].vaginalDischarge || 'No'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedRecord.presentPregnancyHistories[0].otherSymptoms && (
                          <div className="mt-4">
                            <h4 className="font-medium text-base-content mb-2">Other Symptoms</h4>
                            <p className="text-base-content/80 bg-base-200/50 p-3 rounded-lg">
                              {selectedRecord.presentPregnancyHistories[0].otherSymptoms}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Previous Medical History */}
                  {selectedRecord.medicalHistories && selectedRecord.medicalHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-6">
                        <h3 className="card-title text-lg font-semibold text-base-content mb-4">Previous Medical History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedRecord.medicalHistories[0].heartDisease && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Heart Disease:</span>
                              <span>{selectedRecord.medicalHistories[0].heartDisease}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].hypertension && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Hypertension:</span>
                              <span className={selectedRecord.medicalHistories[0].hypertension === 'yes' ? 'text-error font-medium' : ''}>
                                {selectedRecord.medicalHistories[0].hypertension}
                              </span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].kidney && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Kidney:</span>
                              <span>{selectedRecord.medicalHistories[0].kidney}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].yawnOrSyphilis && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Yaws/Syphilis:</span>
                              <span>{selectedRecord.medicalHistories[0].yawnOrSyphilis}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].previousOperation && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Previous Operation:</span>
                              <span>{selectedRecord.medicalHistories[0].previousOperation}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].other && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Others:</span>
                              <span>{selectedRecord.medicalHistories[0].other}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Family History */}
                  {selectedRecord.familyHistories && selectedRecord.familyHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-6">
                        <h3 className="card-title text-lg font-semibold text-base-content mb-4">Family History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {selectedRecord.familyHistories[0].twins && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Twins:</span>
                              <span className={selectedRecord.familyHistories[0].twins === 'yes' ? 'text-info font-medium' : ''}>
                                {selectedRecord.familyHistories[0].twins}
                              </span>
                            </div>
                          )}
                          {selectedRecord.familyHistories[0].malformation && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Malformation:</span>
                              <span>{selectedRecord.familyHistories[0].malformation}</span>
                            </div>
                          )}
                          {selectedRecord.familyHistories[0].tuberculosis && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg">
                              <span className="font-medium">Tuberculosis:</span>
                              <span className={selectedRecord.familyHistories[0].tuberculosis === 'yes' ? 'text-warning font-medium' : ''}>
                                {selectedRecord.familyHistories[0].tuberculosis}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Obstetric History */}
                  {selectedRecord.obstetricHistories && selectedRecord.obstetricHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-6">
                        <h3 className="card-title text-lg font-semibold text-base-content mb-4">Previous Obstetric History</h3>
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr className="bg-base-200">
                                <th className="font-semibold">Date</th>
                                <th className="font-semibold">Duration of Pregnancy</th>
                                <th className="font-semibold">Birth Weight</th>
                                <th className="font-semibold">Complication</th>
                                <th className="font-semibold">Alive/Dead</th>
                                <th className="font-semibold">Age of Death</th>
                                <th className="font-semibold">Cause of Death</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.obstetricHistories.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.Date ? new Date(item.Date).toLocaleDateString() : '-'}</td>
                                  <td>{item.durationOfPregnancy || '-'}</td>
                                  <td>{item.birthWeight || '-'}</td>
                                  <td>{item.complicationInPregnancy || '-'}</td>
                                  <td>
                                    <span className={`badge ${item.aliveOrDead === 'Alive' ? 'badge-success' : 'badge-error'}`}>
                                      {item.aliveOrDead || '-'}
                                    </span>
                                  </td>
                                  <td>{item.ageAtDeath || '-'}</td>
                                  <td>{item.causeOfDeath || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Antenatal Examinations */}
                  {selectedRecord.anteNatalExamination && selectedRecord.anteNatalExamination.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-6">
                        <h3 className="card-title text-lg font-semibold text-base-content mb-4">Antenatal Examinations</h3>
                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr className="bg-base-200">
                                <th className="font-semibold">Date</th>
                                <th className="font-semibold">Weight (kg)</th>
                                <th className="font-semibold">Blood Pressure</th>
                                <th className="font-semibold">Fundal Height</th>
                                <th className="font-semibold">Presentation</th>
                                <th className="font-semibold">Fetal Heart</th>
                                <th className="font-semibold">Next Visit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.anteNatalExamination.map((exam, idx) => (
                                <tr key={idx}>
                                  <td>{exam.Date ? new Date(exam.Date).toLocaleDateString() : '-'}</td>
                                  <td>{exam.weight || '-'}</td>
                                  <td>{exam.bloodPressure || '-'}</td>
                                  <td>{exam.heightOfFundus || '-'}</td>
                                  <td>{exam.presentationAndLife || '-'}</td>
                                  <td>{exam.foetalHeart || '-'}</td>
                                  <td>{exam.nextVisit || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-8 text-center">
                <div className="text-base-content/70">
                  <p className="text-lg mb-2">No antenatal records found</p>
                  <p className="text-sm">This patient doesn't have any antenatal records yet.</p>
                </div>
                <div className="mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/dashboard/doctor/antenatal-records/${patientId}`)}
                  >
                    Create Antenatal Record
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AntenatalRecordDetails;