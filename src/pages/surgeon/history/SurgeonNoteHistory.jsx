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

  const loadNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const records = responseList(await getAllSurgeries());
      const uniquePatientIds = [...new Set(records.map((note) => note.patientId).filter(Boolean))];
      const patientEntries = await Promise.all(uniquePatientIds.map(async (id) => {
        try {
          const response = await getPatientById(id);
          return [id, response?.data || response];
        } catch {
          return [id, null];
        }
      }));
      setPatients(Object.fromEntries(patientEntries));
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
      const patient = patients[note.patientId];
      return !value || [patientName(patient), note.patientId, note.procedureName, note.status]
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
                    const patient = patients[note.patientId];
                    return <tr key={note._id || note.id} className="hover:bg-base-200/40">
                      <td><div className="flex items-center gap-2"><FaUserInjured className="text-primary" /><div><div className="font-semibold">{patientName(patient)}</div><div className="text-xs text-base-content/50 font-mono">ID: {patient?.hospitalId || note.patientId || "—"}</div></div></div></td>
                      <td><div className="font-medium">{note.procedureName || "Surgical Procedure"}</div><div className="text-xs text-base-content/50 font-mono">{note.procedureCode || "No procedure code"}</div></td>
                      <td><div className="text-xs">{note.scheduledDate ? formatNigeriaDate(note.scheduledDate) : "—"}</div><div className="text-xs text-base-content/50">{note.startTime ? formatNigeriaTime(note.startTime) : "—"}</div></td>
                      <td><span className={`badge badge-sm capitalize ${note.status === "completed" ? "badge-success text-white" : note.status === "cancelled" ? "badge-error text-white" : "badge-warning"}`}>{note.status || "scheduled"}</span></td>
                      <td className="text-right"><button className="btn btn-xs btn-primary text-white gap-1" onClick={() => navigate(note.investigationRequestId ? `/dashboard/surgeon/write-surgical-note/${note.investigationRequestId}` : "/dashboard/surgeon/write-surgical-note", { state: { from: "history", editSurgery: note } })}><FaEdit /> Edit Note</button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SurgeonNoteHistory;
