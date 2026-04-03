import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { normalizeStatus, getStatusBadgeClass, getStatusDisplayText } from "@/utils/statusUtils";
import toast from "react-hot-toast";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const IncomingHmo = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  // When clicking a patient, navigate to their incoming detail view
  // (showing items pending for approval/payment)

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await getPatients();
      const allPatients = Array.isArray(res?.data) ? res.data : [];
      const awaitingHmo = allPatients.filter((p) => {
        const status = normalizeStatus(p?.status);
        return [
          PATIENT_STATUS.AWAITING_HMO,
          PATIENT_STATUS.HMO_APPROVED,
          PATIENT_STATUS.HMO_REJECTED,
        ].includes(status);
      });
      const mapped = awaitingHmo.map((p) => ({
        id: p?.id || p?._id,
        name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
        patientId: p?.hospitalId || p?.id || "—",
        status: normalizeStatus(p?.status),
        insurance: p?.hmos?.provider || "—",
        updatedAt: p?.updatedAt ? formatNigeriaDateTime(p.updatedAt) : "—",
        snapshot: p,
      }));
      setPatients(mapped);
    } catch (err) {
      console.error("IncomingHmo: failed to load patients", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const viewPatient = (patient) => {
    if (!patient?.id) return;
    navigate(`/dashboard/hmo/incoming/${patient.id}`, {
      state: { patientSnapshot: patient.snapshot },
    });
  };

  const filteredPatients = useMemo(() => patients, [patients]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold">Incoming HMO Requests</h1>
              <p className="text-base-content/70">Review patients sent to HMO for approval.</p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-sm"
                onClick={loadPatients}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>


          <div className="overflow-hidden rounded-xl border border-base-200 bg-base-100">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Patient ID</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Updated At</div>
              <div className="col-span-3 text-right">Action</div>
            </div>
            <div className="divide-y divide-base-200">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-5 py-4 items-center">
                    <div className="col-span-3">
                      <div className="skeleton h-4 w-32 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-4 w-24 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-4 w-24 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-4 w-20 rounded" />
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <div className="skeleton h-8 w-20 rounded" />
                    </div>
                  </div>
                ))
              ) : filteredPatients.length === 0 ? (
                <div className="py-16 text-center text-base-content/50">
                  No HMO requests found.
                </div>
              ) : (
                filteredPatients.map((item) => {
                  const badgeClass = getStatusBadgeClass(item.status);
                  const displayStatus = getStatusDisplayText(item.status);

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-base-200/40 transition-colors cursor-pointer"
                      onClick={() => viewPatient(item)}
                    >
                      <div className="col-span-3">
                        <p className="font-bold text-base-content truncate">{item.name}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-base-content/70">{item.patientId}</span>
                      </div>
                    
                      <div className="col-span-2">
                        <span className={`badge badge-sm ${badgeClass}`}>{displayStatus}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-base-content/70">{item.updatedAt}</span>
                      </div>
                      <div className="col-span-3 flex justify-end gap-2">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewPatient(item);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomingHmo;
