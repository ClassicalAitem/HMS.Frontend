import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
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
          ? "Scan upload only - test results to be added by lab technician" 
          : "OPD Patient scan upload - test results to be added by lab technician",
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
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header />
        <div className="overflow-y-auto flex-1 p-6">
          <div className="bg-white p-6 rounded-lg shadow-sm max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-[#00943C] mb-3">Scan Upload</h1>
            <p className="text-sm text-[#605D66] mb-6">
              Upload scan files for this investigation. This will create a new lab result with the scan files attached. Lab technicians can add test values later.
            </p>

            {/* Patient Info Card */}
            {patientName && (
              <div className="bg-[#00943C]/5 border border-[#00943C]/20 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#605D66] uppercase">Patient Name</p>
                    <p className="text-base font-semibold text-[#00943C]">{patientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#605D66] uppercase">Patient ID</p>
                    <p className="text-base font-semibold text-[#00943C]">{patientId}</p>
                  </div>
                </div>
                {dependantId && (
                  <div className="mt-3">
                    <p className="text-xs text-[#605D66] uppercase">Type</p>
                    <p className="text-base font-semibold text-[#00943C]">Dependant</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Scan files *</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="file-input file-input-bordered w-full"
                />
              </div>

              <div>
                <button
                  className={`btn btn-primary ${submitting ? "loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={submitting || files.length === 0}
                >
                  {submitting ? "Creating Lab Result..." : "Upload Scans & Create Result"}
                </button>
                <button
                  className="btn btn-ghost ml-2"
                  onClick={() => navigate("/dashboard/laboratory/incoming")}
                >
                  Back to Incoming
                </button>
              </div>

              {files.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">
                    ✓ {files.length} file(s) selected
                  </p>
                  <div className="mt-2 space-y-1">
                    {files.map((file, idx) => (
                      <p key={idx} className="text-xs text-blue-600">
                        • {file.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingScan;
