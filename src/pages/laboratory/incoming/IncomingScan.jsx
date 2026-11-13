import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LaboratoryLayout from "@/layouts/laboratory";
import KolakLoader from "@/components/common/KolakLoader";
import toast from "react-hot-toast";
import { createLabResult } from "@/services/api/labResultsAPI";

const IncomingScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const patientId = searchParams.get("patientId");
  const patientName = searchParams.get("patientName");
  const investigationId = searchParams.get("investigationId");
  const dependantId = searchParams.get("dependantId");
  
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);


  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async () => {
    if (!investigationId && !patientId) {
      toast.error("Patient information is missing. Please go back and try again.");
      return;
    }
    if (files.length === 0) {
      toast.error("Please select scan file(s) to upload.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: patientId,
        dependantId,
        form: {
          attachments: files,
        },
        remarks: investigationId 
          ? "Scan upload only - test results to be added by medical laboratory" 
          : "OPD Patient scan upload - test results to be added by medical laboratory",
      };

      if (investigationId) {
        // Regular patient with investigation request
        await createLabResult(investigationId, payload);
        toast.success("Scan file(s) uploaded successfully. Lab result created.");
      } else {
        // OPD patient - create lab result without investigation request
        // We'll need to create a lab result directly without investigation ID
        // For now, show a message that manual creation is needed
        toast.error("For OPD patients, please create the lab result first through the regular Add Lab Result page, then upload scans.");
        return;
      }

      navigate("/dashboard/laboratory/incoming");
    } catch (error) {
      console.error("Failed to upload scan files", error);
      toast.error(error?.response?.data?.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LaboratoryLayout>
      {submitting && <KolakLoader fullscreen text="Creating lab result & uploading scans..." />}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-primary mb-3">Scan Upload</h1>
          <p className="text-sm text-base-content/70 mb-6">
            Upload scan files for this investigation. This will create a new lab result with the scan files attached. Medical laboratory can add test values later.
          </p>

          {/* Patient Info Card */}
          {patientName && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-base-content/60 uppercase">Patient Name</p>
                  <p className="text-base font-semibold text-primary">{patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 uppercase">Patient ID</p>
                  <p className="text-base font-semibold text-primary">{patientId}</p>
                </div>
              </div>
              {dependantId && (
                <div className="mt-3">
                  <p className="text-xs text-base-content/60 uppercase">Type</p>
                  <p className="text-base font-semibold text-primary">Dependant</p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Scan files *</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="file-input file-input-bordered w-full"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting || files.length === 0}
              >
                {submitting ? "Uploading..." : "Upload Scans & Create Result"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate("/dashboard/laboratory/incoming")}
              >
                Back to Incoming
              </button>
            </div>

            {files.length > 0 && (
              <div className="mt-2 p-3 bg-info/10 border border-info/30 rounded-xl">
                <p className="text-sm font-medium text-info">
                  ✓ {files.length} file(s) selected
                </p>
                <div className="mt-2 space-y-1">
                  {files.map((file, idx) => (
                    <p key={idx} className="text-xs text-base-content/70">
                      • {file.name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LaboratoryLayout>
  );
};

export default IncomingScan;
