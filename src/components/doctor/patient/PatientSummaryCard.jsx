import React from "react";

const getInitials = (firstName, lastName) => {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (!f && !l) return "U";
  const fi = f ? f.charAt(0).toUpperCase() : "";
  const li = l ? l.charAt(0).toUpperCase() : "";
  return `${fi}${li}` || "U";
};

const PatientSummaryCard = ({ patient, loading }) => {
  const patientUUID = patient?.id || "";
  const patientHospitalId = patient?.hospitalId || "";
  return (
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
                  <div className="w-full h-full grid place-items-center bg-primary text-primary-content text-2xl font-bold rounded-full">
                    {getInitials(patient?.firstName, patient?.lastName)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-base-content/70">Patient Name</span>
                  <span className="text-base font-medium text-base-content">{patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Unknown"}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-base-content/70">Gender</span>
                  <span className="text-base font-medium text-base-content capitalize">{patient?.gender || "—"}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-base-content/70">Phone Number</span>
                  <span className="text-base font-medium text-base-content">{patient?.phone || patient?.phoneNumber || "—"}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-base-content/70">Patient ID</span>
                  <span className="text-base font-medium text-base-content">{patientUUID || "—"}</span>
                  <span className="text-xs text-base-content/70">Hospital ID: {patientHospitalId || "—"}</span>
                </div>
              </div>

              <div className="flex justify-between items-center px-1 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
                <div className="space-y-1">
                  <span className="block text-sm font-semibold text-base-content">Insurance / HMO:</span>
                  {Array.isArray(patient?.hmos) && patient.hmos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.hmos.map((h, i) => (
                        <span key={i} className="badge badge-outline font-normal text-sm">
                          {`${h?.provider || "—"} - ${h?.plan || "—"} (${h?.expiresAt ? new Date(h.expiresAt).toLocaleDateString("en-US") : "—"})`}
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
  );
};

export default PatientSummaryCard;