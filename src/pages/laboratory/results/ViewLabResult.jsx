import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResultById } from "@/services/api/labResultsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import SendLabResultsModal from "@/components/modals/SendLabResultsModal";

const ViewLabResult = () => {
  const { labResultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [labResult, setLabResult] = useState(null);
  const [patient, setPatient] = useState(null);
  const [investigationIdState, setInvestigationIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    if (location?.state?.investigationId) {
      setInvestigationIdState(location.state.investigationId);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

      
        const labRes = await getLabResultById(labResultId);
        const labData = labRes?.data || labRes;
        setLabResult(labData);

         if (!investigationIdState && labData?.investigationId) {
          setInvestigationIdState(labData.investigationId);
        }

      if (labData?.patientId) {
          const patientRes = await getPatientById(labData.patientId);
          const patientData = patientRes?.data || patientRes;
          setPatient(patientData);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching lab result:", err);
        setError("Failed to load lab result details");
      } finally {
        setLoading(false);
      }
    };

    if (labResultId) {
      fetchData();
    }
  }, [labResultId]);

  const displayField = (label, value) => {
    if (!value) return null;
    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
        <div className="font-semibold text-[#00943C]">{label}</div>
        <div className="col-span-2 text-gray-700 whitespace-normal break-words">{value}</div>
      </div>
    );
  };

  const displaySection = (title, data) => {
    if (!data || Object.values(data).every((v) => !v)) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
          {title}
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {Object.entries(data).map(([key, value]) => {
            if (!value) return null;
            if (typeof value === "object") return null;
            return (
              <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200 last:border-b-0">
                <div className="font-semibold text-gray-700">{key}</div>
                <div className="col-span-2 text-gray-600">
                  {typeof value === "string" || typeof value === "number"
                    ? value
                    : JSON.stringify(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading lab result...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-lg text-red-600 mb-4">{error}</p>
              <button
                onClick={() => navigate("/dashboard/laboratory")}
                className="px-6 py-2 bg-[#00943C] text-white font-semibold rounded-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const patientName =
    patient?.firstName && patient?.lastName
      ? `${patient.firstName} ${patient.lastName}`
      : patient?.name || "Unknown Patient";

  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-[32px] text-[#00943C] font-bold">Lab Result Details</h1>
                <p className="text-[12px] text-[#605D66]">
                  Complete laboratory test results for {patientName}
                </p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              {/* Patient Information Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b-2 border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Patient Name</p>
                  <p className="text-lg font-bold text-[#00943C]">{patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Hospital ID</p>
                  <p className="text-lg font-bold">{patient?.hospitalId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Lab Technician</p>
                  <p className="text-lg font-bold">{labResult?.form?.labNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Date</p>
                  <p className="text-lg font-bold">{labResult?.form?.date || "N/A"}</p>
                </div>
              </div>

              {/* Test Information */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
                {displayField("Age", labResult?.form?.age)}
                {displayField("Sex", labResult?.form?.sex)}
                {displayField("Clinical Diagnosis", labResult?.form?.clinicalDiagnosis)}
                {displayField("Nature of Specimen", labResult?.form?.natureOfSpecimen)}
              </div>
              {displayField("Referral/Doctor", labResult?.form?.referral)}

              {/* Test Results Sections */}
              {displaySection("Haematology", labResult?.form?.haematology)}
              {displaySection("WBC Differential", labResult?.form?.wbcDifferential)}
              {displaySection("Serology", labResult?.form?.serology)}
              {displaySection("Hormone Profile", labResult?.form?.hormoneProfile)}
              {displaySection("Oestrogen", labResult?.form?.oestrogen)}
              {displaySection("Urinalysis", labResult?.form?.urinalysis)}
              {displaySection("Kidney Function Test", labResult?.form?.kidneyFunctionTest)}
              {displaySection("Liver Function Test", labResult?.form?.liverFunctionTest)}
              {displaySection("Diabetes Screening", labResult?.form?.diabetesScreening)}
              {displaySection("Lipid Profile", labResult?.form?.lipidProfile)}
              {displaySection("Others", labResult?.form?.others)}

              {/* Widal Report Table */}
              {labResult?.form?.widalReport &&
                Object.values(labResult.form.widalReport).some(
                  (v) => v.O || v.H
                ) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                      Widal Report
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#00943C]/20 to-[#00943C]/10">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              Organism
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              O (Somatic)
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              H (Flagellar)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(labResult.form.widalReport).map(
                            ([key, values]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">
                                  {key === "SalmTyphi" && "Salmonella Typhi"}
                                  {key === "SalmParatyphiA" &&
                                    "Salmonella Paratyphi A"}
                                  {key === "SalmParatyphiB" &&
                                    "Salmonella Paratyphi B"}
                                  {key === "SalmParatyphiC" &&
                                    "Salmonella Paratyphi C"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {values.O || "—"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {values.H || "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {displaySection("Microbiology", labResult?.form?.microbiology)}
              {displaySection("Wet Preparation", labResult?.form?.wetPreparation)}
              {displaySection("Antibiotic Sensitivity", labResult?.form?.sensitiveProfile?.Drugs)}

              {/* Remarks */}
              {labResult?.form?.remarks && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                    Overall Remarks
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {labResult.form.remarks}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-8 border-t-2 border-gray-200">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex-1 px-6 py-3 bg-[#00943C] text-white font-semibold rounded-lg hover:bg-[#007a31] transition-all"
                >
                  Send to Doctor
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Print Results
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <SendLabResultsModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        labResultId={labResultId}
        investigationId={investigationIdState || labResult?.investigationId}
        patientId={labResult?.patientId}
        patientName={patientName}
        onSuccess={() => navigate("/dashboard/laboratory")}
      />
    </div>
  );
};

export default ViewLabResult;
