import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientSummaryCard from "@/components/doctor/patient/PatientSummaryCard";
import { getConsultationById } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";

const ConsultationDetails = () => {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getConsultationById(consultationId);
        const data = res?.data ?? res;
        if (mounted) setConsultation(data);
        const pid = patientId || data?.patientId;
        if (pid) {
          const pRes = await getPatientById(pid);
          const pData = pRes?.data ?? pRes;
          if (mounted) setPatient(pData);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId, consultationId]);

  const info = useMemo(() => ({
    type: consultation?.type || consultation?.consultationType || "Consultation",
    diagnosis: consultation?.diagnosis || "—",
    date: consultation?.createdAt ? new Date(consultation.createdAt).toLocaleDateString("en-US") : "—",
    time: consultation?.createdAt ? new Date(consultation.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    admission: consultation?.admission || "—",
    allergies: consultation?.allergies || "—",
    notes: consultation?.notes,
  }), [consultation]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Medical History</h1>
              <p className="text-sm text-base-content/60">Consultation details</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}>Back</button>
          </div>

          <div className="mb-4">
            {loading ? (
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <div className="flex gap-4 items-center">
                    <div className="skeleton w-14 h-14 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-48 mb-2" />
                      <div className="skeleton h-3 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <PatientSummaryCard patient={patient} loading={false} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <div className="grid grid-cols-1 gap-6">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="skeleton h-4 w-32" />
                      <div className="skeleton h-4 w-48" />
                      <div className="skeleton h-4 w-40" />
                      <div className="skeleton h-4 w-36" />
                      <div className="skeleton h-4 w-28" />
                    </div>
                  ) : (
                    <div className="space-y-3 text-base">
                      <div>
                        <span className="text-base-content/70">Type:</span> <span className="font-medium">{info.type}</span>
                      </div>
                      <div>
                        <span className="text-base-content/70">Diagnosis:</span> <span className="font-medium">{info.diagnosis}</span>
                      </div>
                      <div>
                        <span className="text-base-content/70">Date:</span> <span className="font-medium">{info.date}</span>
                      </div>
                      <div>
                        <span className="text-base-content/70">Admission:</span> <span className="font-medium">{info.admission}</span>
                      </div>
                      <div>
                        <span className="text-base-content/70">Allergies:</span> <span className="font-medium">{info.allergies}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h3 className="text-base font-semibold mb-2">Surgeries</h3>
                {loading ? (
                  <div className="skeleton h-20 w-full" />
                ) : (
                  <div className="text-sm text-base-content/70">No Surgeries recorded yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <h3 className="text-base font-semibold mb-2">Additional Notes</h3>
              {loading ? (
                <div className="skeleton h-24 w-full" />
              ) : (
                <div className="p-4 rounded border border-base-300 text-sm text-base-content/80">
                  {info.notes || "No additional notes provided."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetails;
