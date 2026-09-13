import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import { getAllSurgeries } from "@/services/api/surgeryAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import { FaFileMedical, FaSearch, FaUserInjured, FaEdit } from "react-icons/fa";

const responseList = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(data) ? data : [];
};

const patientName = (patient) =>
  patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Unknown Patient";

const SurgeonNoteHistory = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const loadNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const records = responseList(await getAllSurgeries());
      
      const patientsMap = {};
      records.forEach(note => {
        if (note.patientId && note.patient) {
          patientsMap[note.patientId] = note.patient;
        } else if (note.dependantId && note.dependant) {
          patientsMap[note.dependantId] = note.dependant;
        } else if (note.opdPatientId && note.opdPatient) {
          patientsMap[note.opdPatientId] = note.opdPatient;
        }
      });
      
      setPatients(patientsMap);
      setNotes(records);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load surgical note history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, []);

  const filteredNotes = useMemo(() => {
    const value = query.trim().toLowerCase();
    return notes.filter((note) => {
      const pId = note.dependantId || note.opdPatientId || note.patientId;
      const patient = patients[pId];
      return !value || [patientName(patient), pId, note.procedureName, note.status]
        .filter(Boolean).join(" ").toLowerCase().includes(value);
    });
  }, [notes, patients, query]);

  return (
    <div className="flex h-screen bg-base-200/50">
      <Sidebar />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header />
        <main className="overflow-y-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8 h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><FaFileMedical className="w-5 h-5" /></div>
              <div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">Surgical Note History</h1>
                <p className="text-xs text-base-content/60 mt-1">Review and complete saved operative records.</p>
              </div>
            </div>
            <button className="btn btn-sm btn-ghost border border-base-300" onClick={loadNotes}>Refresh</button>
          </div>

          <div className="card bg-base-100 p-4 shadow-sm border border-base-200">
            <label className="input input-bordered input-sm flex items-center gap-2 max-w-lg">
              <FaSearch className="text-base-content/40" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient, ID, or procedure" />
            </label>
          </div>

          {error && <div className="alert alert-error text-sm">{error}</div>}
          {loading ? <div className="text-center py-12"><span className="loading loading-spinner text-primary" /></div> : filteredNotes.length === 0 ? (
            <EmptyState title="No Surgical Notes Found" description={query ? "Try a different search." : "Saved surgical notes will appear here."} />
          ) : (
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-x-auto">
              <table className="table w-full">
                <thead><tr><th>Patient</th><th>Procedure</th><th>Date & Time</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                <tbody>
                  {filteredNotes.map((note) => {
                    const pId = note.dependantId || note.opdPatientId || note.patientId;
                    const patient = patients[pId];
                    return <tr key={note._id || note.id} className="hover:bg-base-200/40">
                      <td><div className="flex items-center gap-2"><FaUserInjured className="text-primary" /><div><div className="font-semibold">{patientName(patient)}</div><div className="text-xs text-base-content/50 font-mono">ID: {patient?.hospitalId || pId || "—"}</div></div></div></td>
                      <td><div className="font-medium">{note.procedureName || "Surgical Procedure"}</div><div className="text-xs text-base-content/50 font-mono">{note.procedureCode || "No procedure code"}</div></td>
                      <td><div className="text-xs">{note.scheduledDate ? formatNigeriaDate(note.scheduledDate) : "—"}</div><div className="text-xs text-base-content/50">{note.startTime ? formatNigeriaTime(note.startTime) : "—"}</div></td>
                      <td><span className={`badge badge-sm capitalize ${note.status === "completed" ? "badge-success text-white" : note.status === "cancelled" ? "badge-error text-white" : "badge-warning"}`}>{note.status || "scheduled"}</span></td>
                      <td className="text-right">
                        {note.status === "completed" ? (
                          <button
                            className="btn btn-xs btn-ghost gap-1 border border-base-300"
                            onClick={() => {
                              setSelectedNote({ note, patient });
                              setIsModalOpen(true);
                            }}
                          >
                            <FaSearch /> View
                          </button>
                        ) : (
                          <button
                            className="btn btn-xs btn-primary text-white gap-1"
                            onClick={() =>
                              navigate(
                                note.investigationRequestId
                                  ? `/dashboard/surgeon/write-surgical-note/${note.investigationRequestId}`
                                  : "/dashboard/surgeon/write-surgical-note",
                                { state: { from: "history", editSurgery: note } }
                              )
                            }
                          >
                            {note.status === "in_progress" ? (
                              <><FaEdit /> Edit Note</>
                            ) : (
                              <><FaFileMedical /> Write Note</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}

          {isModalOpen && selectedNote && (
            <div className="modal modal-open backdrop-blur-xs bg-black/40" onClick={() => setIsModalOpen(false)}>
              <div className="modal-box w-11/12 max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Surgical Note Details</h3>
                  <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setIsModalOpen(false)}>✕</button>
                </div>
                <div className="overflow-y-auto max-h-[70vh] p-1">
                  {(() => {
                    const { note, patient: pt } = selectedNote;
                    const fullName = patientName(pt);
                    const hospitalId = pt?.hospitalId || note.patientId || "—";
                    const gender = pt?.gender || "—";
                    
                    let age = pt?.age || "—";
                    if (pt?.dob || pt?.dateOfBirth) {
                      const dob = new Date(pt.dob || pt.dateOfBirth);
                      if (!isNaN(dob)) {
                        const diff = new Date() - dob;
                        age = Math.floor(diff / 31557600000) + " yrs";
                      }
                    }

                    const phone = pt?.phone || pt?.phoneNumber || "—";
                    const procedureName = note.procedureName || "Surgical Procedure";
                    const status = note.status || "completed";
                    const createdAt = note.createdAt ? formatNigeriaDate(note.createdAt) : "—";
                    const hmos = pt?.hmos || [];

                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-6 items-start bg-base-100 p-5 rounded-xl border border-base-200">
                          <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary text-primary flex items-center justify-center text-3xl font-bold overflow-hidden">
                              {pt?.photo || pt?.profilePicture ? (
                                <img src={pt.photo || pt.profilePicture} alt={fullName} className="w-full h-full object-cover" />
                              ) : (
                                fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="badge badge-success text-white font-semibold capitalize">
                                {status?.replace("_", " ")}
                            </span>
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 w-full">
                            <div>
                              <p className="text-[11px] uppercase font-semibold text-base-content/50">Patient Name</p>
                              <p className="font-bold text-base text-base-content break-words">{fullName}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase font-semibold text-base-content/50">Patient ID</p>
                              <p className="font-bold text-base text-base-content break-words">{hospitalId}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase font-semibold text-base-content/50">Gender / Age</p>
                              <p className="font-bold text-base text-base-content">{gender} {age !== "—" ? `/ ${age}` : ""}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase font-semibold text-base-content/50">Phone Number</p>
                              <p className="font-bold text-base text-base-content">{phone}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-[11px] uppercase font-semibold text-base-content/50">Procedure Name</p>
                              <p className="font-bold text-base text-primary">{procedureName}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase font-semibold text-base-content/50">Date Added</p>
                              <p className="font-bold text-base text-base-content">{createdAt}</p>
                            </div>
                          </div>
                        </div>

                        {hmos.length > 0 && (
                          <div className="bg-base-100 p-5 rounded-xl border border-base-200">
                            <h4 className="text-xs uppercase font-bold mb-3 text-base-content/50">Insurance / HMO</h4>
                            <div className="flex flex-wrap gap-2">
                              {hmos.map((h, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-md bg-base-200 px-3 py-2 text-sm border border-base-300">
                                  <span className="font-medium text-base-content">
                                    {h.provider || "—"} <span className="text-base-content/60">({h.plan || "—"})</span>
                                  </span>
                                  <span className="badge badge-xs badge-info">Active</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-base-100 p-5 rounded-xl border border-base-200 shadow-sm mt-2">
                          <h4 className="text-xs uppercase font-bold mb-4 text-base-content/50 border-b border-base-200 pb-2">Completed Surgical Report</h4>
                          
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-base-content/50">Surgeon Team</p>
                                <div className="text-sm font-medium">
                                  {note.surgeonTeam?.map(s => s.surgeonName).join(", ") || "—"}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-base-content/50">Assistants</p>
                                <div className="text-sm font-medium">
                                  {note.surgeonAssistants?.map(a => a.assistantName).join(", ") || "—"}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-base-content/50">Start Time</p>
                                <div className="text-sm font-medium">{note.startTime || "—"}</div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-base-content/50">End Time</p>
                                <div className="text-sm font-medium">{note.endTime || "—"}</div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-base-content/50">Operation Room</p>
                                <div className="text-sm font-medium">{note.operationRoom || "—"}</div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-base-content/50">Estimated Blood Loss</p>
                                <div className="text-sm font-medium">{note.estimatedBloodLoss ? `${note.estimatedBloodLoss} ml` : "—"}</div>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50">Operative Notes</p>
                              <p className="text-sm text-base-content whitespace-pre-line bg-base-200/50 p-3 rounded-lg mt-1">
                                {note.notes || "—"}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50">Outcomes</p>
                              <p className="text-sm text-base-content whitespace-pre-line bg-base-200/50 p-3 rounded-lg mt-1">
                                {note.outcomes || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50">Surgical Findings</p>
                              <p className="text-sm text-base-content whitespace-pre-line bg-base-200/50 p-3 rounded-lg mt-1">
                                {note.surgicalFindings || "—"}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50">Complications</p>
                              <p className={`text-sm whitespace-pre-line p-3 rounded-lg mt-1 font-medium ${note.complications ? 'text-error bg-error/10' : 'text-base-content bg-base-200/50'}`}>
                                {note.complications || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50">Specimens for Histology</p>
                              <p className="text-sm text-base-content whitespace-pre-line bg-base-200/50 p-3 rounded-lg mt-1">
                                {note.specimensForHistology?.replace("_", " ") || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50 mb-1">Anesthesia Administered</p>
                              {note.anesthesiaDosages?.length > 0 ? (
                                <div className="overflow-x-auto border border-base-200 rounded-lg">
                                  <table className="table table-xs w-full">
                                    <thead>
                                      <tr className="bg-base-200/50">
                                        <th className="font-semibold text-base-content/70">Type</th>
                                        <th className="font-semibold text-base-content/70">Name</th>
                                        <th className="font-semibold text-base-content/70">Dosage</th>
                                        <th className="font-semibold text-base-content/70">Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {note.anesthesiaDosages.map((a, i) => (
                                        <tr key={i} className="border-b border-base-200 last:border-0">
                                          <td>{a.anesthesiaType || "—"}</td>
                                          <td>{a.anestheticName || "—"}</td>
                                          <td>{a.dosage || "—"}</td>
                                          <td>{a.anestheticNote || "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-base-content/50 bg-base-200/50 p-3 rounded-lg">No anesthesia recorded</p>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50 mb-1">Theatre Vitals</p>
                              {note.vitalSigns?.length > 0 ? (
                                <div className="overflow-x-auto border border-base-200 rounded-lg">
                                  <table className="table table-xs w-full">
                                    <thead>
                                      <tr className="bg-base-200/50">
                                        <th className="font-semibold text-base-content/70">BP</th>
                                        <th className="font-semibold text-base-content/70">HR</th>
                                        <th className="font-semibold text-base-content/70">Resp</th>
                                        <th className="font-semibold text-base-content/70">Temp</th>
                                        <th className="font-semibold text-base-content/70">SpO2</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {note.vitalSigns.map((v, i) => (
                                        <tr key={i} className="border-b border-base-200 last:border-0">
                                          <td>{v.bloodPressure || "—"}</td>
                                          <td>{v.heartRate || "—"}</td>
                                          <td>{v.respiratoryRate || "—"}</td>
                                          <td>{v.temperature ? `${v.temperature}°C` : "—"}</td>
                                          <td>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-base-content/50 bg-base-200/50 p-3 rounded-lg">No vitals recorded</p>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50 mb-1">Post Operative Assessment</p>
                              {note.postOperativeAssessment?.length > 0 ? (
                                <div className="overflow-x-auto border border-base-200 rounded-lg">
                                  <table className="table table-xs w-full">
                                    <thead>
                                      <tr className="bg-base-200/50">
                                        <th className="font-semibold text-base-content/70">Medication</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {note.postOperativeAssessment.map((p, i) => (
                                        <tr key={i} className="border-b border-base-200 last:border-0">
                                          <td>{p.medication || "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-base-content/50 bg-base-200/50 p-3 rounded-lg">No post operative assessment recorded</p>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-semibold text-base-content/50 mb-1">Baby Assessment</p>
                              {note.babyAssessment?.length > 0 ? (
                                <div className="overflow-x-auto border border-base-200 rounded-lg">
                                  <table className="table table-xs w-full">
                                    <thead>
                                      <tr className="bg-base-200/50">
                                        <th className="font-semibold text-base-content/70">Sex</th>
                                        <th className="font-semibold text-base-content/70">Weight</th>
                                        <th className="font-semibold text-base-content/70">Condition</th>
                                        <th className="font-semibold text-base-content/70">APGAR (1 min)</th>
                                        <th className="font-semibold text-base-content/70">APGAR (5 min)</th>
                                        <th className="font-semibold text-base-content/70">APGAR (10 min)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {note.babyAssessment.map((b, i) => (
                                        <tr key={i} className="border-b border-base-200 last:border-0">
                                          <td className="capitalize">{b.sex || "—"}</td>
                                          <td>{b.weight || "—"}</td>
                                          <td>{b.condition || "—"}</td>
                                          <td>{b.apgarScore1Min || "—"}</td>
                                          <td>{b.apgarScore5Min || "—"}</td>
                                          <td>{b.apgarScore10Min || "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-base-content/50 bg-base-200/50 p-3 rounded-lg">No baby assessment recorded</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SurgeonNoteHistory;
