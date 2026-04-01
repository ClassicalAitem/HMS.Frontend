import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import NurseSidebar from "@/components/nurse/dashboard/Sidebar";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const NurseAntenatalRecords = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPatient = async () => {
      try {
        setPatientLoading(true);
        const res = await getPatientById(patientId);
        if (mounted) setPatient(res?.data ?? res);
      } catch (err) {
        console.error("Failed to load patient", err);
      } finally {
        if (mounted) setPatientLoading(false);
      }
    };
    if (patientId) fetchPatient();
    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const data = await getAnteNatalRecordByPatientId(patientId);
        if (mounted) setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch antenatal records", err);
        if (mounted) setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (patientId) fetchRecords();
    return () => { mounted = false; };
  }, [patientId]);

  const heading = useMemo(() => {
    if (patient) return `${patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}`;
    return "Antenatal Records";
  }, [patient]);

  const getPresentPregnancy = (record) => record?.presentPregnancy || record?.presentPregnancyHistories?.[0] || {};
  const getExams = (record) => record?.antenatalExaminations || record?.anteNatalExamination || [];

  return (
    <div className="flex h-screen">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-base-200 lg:static lg:inset-0">
        <NurseSidebar />
      </div>
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={() => {}} />
        <div className="flex overflow-y-auto flex-col p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">{heading}</h1>
              <p className="text-sm text-base-content/70">All antenatal records</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/nurse/patient/${patientId}`)}>
                Back to Patient
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedRecord(null)} disabled={!selectedRecord}>
                Clear selection
              </button>
            </div>
          </div>

          {loading || patientLoading ? (
            <div className="flex justify-center py-8"><div className="loading loading-spinner loading-lg" /></div>
          ) : records.length === 0 ? (
            <EmptyState title="No antenatal records" description="No antenatal records were found for this patient." />
          ) : (
            <>
              {/* Summary cards (doctor pattern) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <h3 className="card-title text-lg font-semibold">Summary</h3>
                    <div className="text-sm mt-2">
                      <p>Total records: <span className="font-semibold">{records.length}</span></p>
                      <p>
                        Total examinations: <span className="font-semibold">{records.reduce((sum, r) => sum + ((r.antenatalExaminations || r.anteNatalExamination || []).length || 0), 0)}</span>
                      </p>
                      <div className="mt-2">
                        <span className="text-xs text-base-content/70">Latest remarks:</span>
                        <div className="mt-1 text-xs text-base-content/80 bg-base-100/50 p-2 rounded max-h-20 overflow-y-auto">
                          {(() => {
                            const latest = [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                            const latestExam = (latest ? (latest.anteNatalExamination || latest.antenatalExaminations || []) : []).sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0))[0];
                            return latestExam?.remark || "No remarks";
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                  <div className="card-body p-4">
                    <h3 className="card-title text-lg font-semibold">Latest Pregnancy</h3>
                    {(() => {
                      const latest = [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                      const present = latest ? (latest.presentPregnancy || latest.presentPregnancyHistories?.[0] || {}) : {};
                      return latest ? (
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between mb-1"><span className="text-base-content/70">EDD:</span><span className="font-medium">{(present.EDD || present.edd) ? formatNigeriaDate(present.EDD || present.edd) : '—'}</span></div>
                          <div className="flex justify-between mb-1"><span className="text-base-content/70">LMP:</span><span className="font-medium">{(present.LMP || present.lmp) ? formatNigeriaDate(present.LMP || present.lmp) : '—'}</span></div>
                          <div className="flex justify-between"><span className="text-base-content/70">Gestational age:</span><span className="font-medium">{(present.durationOfPregnancyInWeek || present.durationInWeeks) ? `${present.durationOfPregnancyInWeek || present.durationInWeeks} w` : '—'}</span></div>
                        </div>
                      ) : (
                        <p className="text-sm text-base-content/70">No pregnancy summary available</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Booking date</th>
                      <th>LMP</th>
                      <th>EDD</th>
                      <th>Gestation</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => {
                      const presentPregnancy = getPresentPregnancy(record);
                      return (
                        <tr key={record._id || record.id || idx} className={selectedRecord?._id === record._id ? 'bg-base-200' : ''}>
                          <td>{idx + 1}</td>
                          <td>{presentPregnancy.dateOfBooking ? formatNigeriaDate(presentPregnancy.dateOfBooking) : '—'}</td>
                          <td>{presentPregnancy.LMP || presentPregnancy.lmp ? formatNigeriaDate(presentPregnancy.LMP || presentPregnancy.lmp) : '—'}</td>
                          <td>{presentPregnancy.EDD || presentPregnancy.edd ? formatNigeriaDate(presentPregnancy.EDD || presentPregnancy.edd) : '—'}</td>
                          <td>{presentPregnancy.durationOfPregnancyInWeek || presentPregnancy.durationInWeeks ? `${presentPregnancy.durationOfPregnancyInWeek || presentPregnancy.durationInWeeks} w` : '—'}</td>
                          <td>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="text-right">
                            <button type="button" className="btn btn-xs btn-primary" onClick={() => setSelectedRecord(record)}>
                              View details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedRecord && (
                <div className="p-4 border rounded-lg bg-base-100">
                  <h3 className="text-lg font-semibold mb-3">Record Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <div><span className="font-medium">Doctor ID:</span> {selectedRecord.doctorId || '—'}</div>
                    <div><span className="font-medium">Record ID:</span> {selectedRecord._id || selectedRecord.id || '—'}</div>
                    <div><span className="font-medium">Created:</span> {selectedRecord.createdAt ? formatNigeriaDate(selectedRecord.createdAt) : '—'}</div>
                    <div><span className="font-medium">Updated:</span> {selectedRecord.updatedAt ? formatNigeriaDate(selectedRecord.updatedAt) : '—'}</div>
                  </div>

                  {selectedRecord.medicalHistories && selectedRecord.medicalHistories.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-base-content mb-2">Medical History</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {Object.entries(selectedRecord.medicalHistories[0]).map(([key, value]) => (
                          <div key={key} className="flex justify-between bg-base-200/50 p-2 rounded">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span>{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRecord.familyHistories && selectedRecord.familyHistories.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-base-content mb-2">Family History</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {Object.entries(selectedRecord.familyHistories[0]).map(([key, value]) => (
                          <div key={key} className="flex justify-between bg-base-200/50 p-2 rounded">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span>{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRecord.obstetricHistories && selectedRecord.obstetricHistories.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-base-content mb-2">Obstetric History</h4>
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full text-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Duration</th>
                              <th>Birth Weight</th>
                              <th>Complication</th>
                              <th>Outcome</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.obstetricHistories.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.Date ? formatNigeriaDate(item.Date) : '—'}</td>
                                <td>{item.durationOfPregnancy || '—'}</td>
                                <td>{item.birthWeight || '—'}</td>
                                <td>{item.complicationInPregnancy || '—'}</td>
                                <td>{item.aliveOrDead || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="font-medium text-base-content mb-2">Present Pregnancy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-3">
                      <div className="flex justify-between p-2 bg-base-200/50 rounded">
                        <span>Date of Booking</span>
                        <span>{getPresentPregnancy(selectedRecord).dateOfBooking ? formatNigeriaDate(getPresentPregnancy(selectedRecord).dateOfBooking) : '—'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded">
                        <span>LMP</span>
                        <span>{getPresentPregnancy(selectedRecord).LMP || getPresentPregnancy(selectedRecord).lmp ? formatNigeriaDate(getPresentPregnancy(selectedRecord).LMP || getPresentPregnancy(selectedRecord).lmp) : '—'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded">
                        <span>EDD</span>
                        <span>{getPresentPregnancy(selectedRecord).EDD || getPresentPregnancy(selectedRecord).edd ? formatNigeriaDate(getPresentPregnancy(selectedRecord).EDD || getPresentPregnancy(selectedRecord).edd) : '—'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded">
                        <span>Gestation</span>
                        <span>{getPresentPregnancy(selectedRecord).durationOfPregnancyInWeek || getPresentPregnancy(selectedRecord).durationInWeeks ? `${getPresentPregnancy(selectedRecord).durationOfPregnancyInWeek || getPresentPregnancy(selectedRecord).durationInWeeks} w` : '—'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded">
                        <span>Bleeding</span>
                        <span>{getPresentPregnancy(selectedRecord).bleeding || '—'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded">
                        <span>FMF</span>
                        <span>{getPresentPregnancy(selectedRecord).FMF || '—'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between p-2 bg-base-200/50 rounded"><span>Headache</span><span>{getPresentPregnancy(selectedRecord).headache || '—'}</span></div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded"><span>Oedema</span><span>{getPresentPregnancy(selectedRecord).oedema || '—'}</span></div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded"><span>Jaundice</span><span>{getPresentPregnancy(selectedRecord).jaundice || '—'}</span></div>
                      <div className="flex justify-between p-2 bg-base-200/50 rounded"><span>Vaginal Discharge</span><span>{getPresentPregnancy(selectedRecord).vaginalDischarge || '—'}</span></div>
                    </div>
                  </div>

                  <h4 className="font-medium">Antenatal Examinations</h4>
                  {getExams(selectedRecord).length > 0 ? (
                    <div className="space-y-3">
                      {getExams(selectedRecord).map((exam, idx) => (
                        <div key={idx} className="border border-base-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <strong>Exam #{idx + 1}</strong>
                            <span className="text-xs text-base-content/70">{exam.Date ? formatNigeriaDate(exam.Date) : 'No date'}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>Fundus: {exam.heightOfFundus || '—'}</div>
                            <div>PP-Brim: {exam.relationOfPPToBrim || '—'}</div>
                            <div>Fetal Heart: {exam.foetalHeart || '—'}</div>
                            <div>B.P.: {exam.bloodPressure || '—'}</div>
                            <div>Next Visit: {exam.nextVisit || '—'}</div>
                          </div>
                          <div className="mt-2 text-sm text-base-content/80">Remark: {exam.remark || 'No remark'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base-content/70 text-sm">No examination entries for this record.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseAntenatalRecords;
