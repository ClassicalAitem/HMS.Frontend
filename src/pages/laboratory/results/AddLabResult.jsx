import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { createLabResult } from "@/services/api/labResultsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAllInvestigationRequests } from "@/services/api/investigationRequestAPI";
import { usersAPI } from "@/services/api/usersAPI"; 
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks"; 


const SectionHeader = ({ title, id, count, expandedSection, toggleSection }) => (
  <button
    onClick={() => toggleSection(id)}
    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#00943C]/10 to-[#00943C]/5 hover:from-[#00943C]/20 hover:to-[#00943C]/10 border border-[#00943C]/20 rounded-lg transition-all"
  >
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-semibold text-[#00943C]">{title}</h3>
      {count && <span className="text-xs bg-[#00943C] text-white px-2 py-1 rounded">{count} fields</span>}
    </div>
    <svg
      className={`w-5 h-5 transform transition-transform ${
        expandedSection === id ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  </button>
);

const InputField = ({ label, value, onChange, placeholder = "", type = "text" }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-[#605D66]">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 border border-[#AEAAAE] rounded-lg focus:outline-none focus:border-[#00943C] focus:ring-1 focus:ring-[#00943C]"
    />
  </div>
);

const SectionContent = ({ children }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-[#FFFFFF] border border-[#AEAAAE] border-t-0 rounded-b-lg">
    {children}
  </div>
);

const AddLabResult = () => {
  const { investigationId } = useParams();
  const navigate = useNavigate();


  const [patient, setPatient] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState("patientInfo");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [cid, setCid] = useState(null);

  const currentUser = useAppSelector((state) => state.auth.user);

  
  const [formData, setFormData] = useState({
    patientNames: "",
    age: "",
    sex: "",
    labNo: "", 
    clinicalDiagnosis: "",
    date: new Date().toISOString().split("T")[0],
    referral: "",
    natureOfSpecimen: "",
    remarks: "",

    haematology: {
      HB: "",
      PVC: "",
      Platelets: "",
      WBCTotal: "",
    },

    wbcDifferential: {
      Neut: "",
      Lymp: "",
      Mono: "",
      Eosin: "",
      Baso: "",
      ESR: "",
      RBC: "",
      Retics: "",
      MCV: "",
      ClottingTime: "",
      ProthrombinTime: "",
      APTT: "",
      "PT/INR": "",
      LeCells: "",
      Microfilaria: "",
      Genotype: "",
      BloodGroup: "",
      RhD: "",
      SicklingTest: "",
      OccultBlood: "",
    },

    serology: {
      "HIV Screening": "",
      "Hepatitis A": "",
      "Hepatitis B": "",
      "Hepatitis C": "",
      VDRL: "",
      "MANTOUX/HEAF": "",
      AFB: "",
      "TB(Serum)": "",
      "H. PYLORI": "",
    },

    hormoneProfile: {
      FSH: "",
      Testosterone: "",
      LH: "",
      Prolactin: "",
      Progesterone: "",
      T3: "",
      T4: "",
      TSH: "",
    },

    oestrogen: {
      E1: "",
      E2: "",
      E3: "",
    },

    urinalysis: {
      Appearance: "",
      "Sp. Gravity": "",
      "Urine PH": "",
      Glucose: "",
      Protein: "",
      Ketones: "",
      "Ascorbic Acid": "",
      Nitrite: "",
      Bilirubin: "",
      Urobilinogen: "",
      Blood: "",
      Leukocyte: "",
      Comments: "",
    },

    kidneyFunctionTest: {
      Sodium: "",
      Potassium: "",
      Bicarbonate: "",
      Chloride: "",
      Urea: "",
      Creatinine: "",
    },

    liverFunctionTest: {
      AST: "",
      ALT: "",
      "ALK Phos": "",
      "T. Bilirubin": "",
      "D. Bilirubin": "",
      "Total Protein": "",
      Albumin: "",
    },

    diabetesScreening: {
      "Fasting Blood Sugar": "",
      "Random Blood Sugar": "",
      "2hrs Post-prandial": "",
      OGTT: "",
    },

    lipidProfile: {
      Cholesterol: "",
      Triglyceride: "",
      HDL: "",
      LDL: "",
      VLDL: "",
    },

    others: {
      Calcium: "",
      Phosphorus: "",
      "Uric Acid": "",
      "Serum Iron": "",
      PSA: "",
      HBA1C: "",
      CA125: "",
    },

    widalReport: {
      SalmTyphi: { O: "", H: "" },
      SalmParatyphiA: { O: "", H: "" },
      SalmParatyphiB: { O: "", H: "" },
      SalmParatyphiC: { O: "", H: "" },
    },

    microbiology: {
      Specimen: "",
      Appearance: "",
      Microscopy: "",
      Culture: "",
    },

    wetPreparation: {
      PusCells: "",
      EpithelialCells: "",
      YeastCells: "",
      BactCells: "",
      RedBloodCells: "",
      "T Vaginalis": "",
      "Clue cells": "",
    },

    semiFluidAnalysis: {
      MethodOfProduction: "",
      Abstinence: "",
      TimeOfProduction: "",
      TimeReceived: "",
      TimeExamined: "",
      Appearance: "",
      Viscosity: "",
      Volume: "",
      Microscopy: {
        Active: "",
        Dead: "",
        Sluggish: "",
        SpermCount: "",
        NormalCells: "",
        AbnormalCells: "",
        PusCells: "",
        RedCells: "",
        EpithelialCells: "",
        Comments: "",
      },
    },

    sensitiveProfile: {
      Drugs: {
        Erythromycin: "",
        Gentamicin: "",
        Ampiclox: "",
        NalidixicAcid: "",
        Levofloxacin: "",
        Ciprofloxacin: "",
        Azithromycin: "",
        Amoxicillin: "",
        Clavulanate: "",
        Cefotaxime: "",
        Ceftriaxone: "",
        Sulbactam: "",
        Imipenem: "",
        Ofloxacine: "",
        Cefexime: "",
        Others: "",
      },
    },
  });

  useEffect(() => {
    if (currentUser) {
      const name = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
      if (name) {
        setFormData((prev) => ({ ...prev, labNo: name }));
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        if (investigationId) {
          const investigationsResponse = await getAllInvestigationRequests();
          const investigationsArray = Array.isArray(investigationsResponse)
            ? investigationsResponse
            : investigationsResponse?.data || [];

          const foundInvestigation = investigationsArray.find(
            (inv) => inv._id === investigationId || inv.id === investigationId
          );

          if (foundInvestigation) {
            setInvestigation(foundInvestigation);

            if (foundInvestigation.patientId) {
              const patientResponse = await getPatientById(
                foundInvestigation.patientId
              );
              const patientData = patientResponse?.data || patientResponse;
              setPatient(patientData);

            
              const patientName =
                patientData?.firstName && patientData?.lastName
                  ? `${patientData.firstName} ${patientData.lastName}`
                  : patientData?.name || "Unknown Patient";

              const age = patientData?.dateOfBirth
                ? new Date().getFullYear() -
                  new Date(patientData.dateOfBirth).getFullYear()
                : "";

              let referralName = "";
              if (foundInvestigation.doctorId) {
                try {
                  const docRes = await usersAPI.getUserById(foundInvestigation.doctorId);
                  const docData = docRes?.data || docRes;
                  referralName =
                    docData?.firstName && docData?.lastName
                      ? `${docData.firstName} ${docData.lastName}`
                      : docData?.name || "";
                } catch (err) {
                  console.warn("Failed to load doctor name", err);
                }
              }

              setFormData((prev) => ({
                ...prev,
                patientNames: patientName,
                age: age,
                sex: patientData?.gender || "",
                clinicalDiagnosis: foundInvestigation?.clinicalDiagnosis || "",
                referral: referralName,
              }));
            }
          } else {
            setError("Investigation not found");
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load investigation details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [investigationId]);

  const handleInputChange = (section, field, value) => {
    if (typeof section === "string" && !field) {

      setFormData((prev) => ({
        ...prev,
        [section]: value,
      }));
    } else if (typeof formData[section] === "object") {
      
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value,
        },
      },
    }));
  };

  const onSave = async () => {
    setIsConfirmOpen(true);
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setIsConfirmOpen(false);

      const payload = {
        patientId: patient?._id || patient?.id,
        form: formData,
        remarks: formData.remarks,
      };

      const response = await createLabResult(investigationId, payload);
      const labResultData = response?.data || response;
      const labResultId = labResultData?._id || labResultData?.id;

      navigate(`/dashboard/laboratory/results/${labResultId}`, {
        state: { from: "add", patientSnapshot: patient, investigationId },
      });
    } catch (err) {
      console.error("Error saving lab result:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save lab result. Please try again."
      );
      setSaving(false);
      setIsConfirmOpen(true); 
    }
  };
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading investigation details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
                {error}
              </div>
            )}

            <div className="mb-6">
              <h1 className="text-[32px] text-[#00943C] font-bold">
                Laboratory Result Form
              </h1>
              <p className="text-[12px] text-[#605D66]">
                Complete the patient's laboratory test results. All fields are optional.
              </p>
            </div>

            <div className="space-y-4">
              {/* PATIENT INFORMATION SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Patient Information" id="patientInfo" expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "patientInfo" && (
                  <SectionContent>
                    <InputField
                      label="Patient Name"
                      value={formData.patientNames}
                      onChange={(val) => handleInputChange("patientNames", null, val)}
                      placeholder="Patient full name"
                    />
                    <InputField
                      label="Age"
                      value={formData.age}
                      onChange={(val) => handleInputChange("age", null, val)}
                      type="number"
                      placeholder="Age in years"
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-[#605D66]">Sex</label>
                      <select
                        value={formData.sex}
                        onChange={(e) => handleInputChange("sex", null, e.target.value)}
                        className="px-3 py-2 border border-[#AEAAAE] rounded-lg focus:outline-none focus:border-[#00943C]"
                      >
                        <option value="">Select</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                    <InputField
                      label="Lab Technician"
                      value={formData.labNo}
                      onChange={(val) => handleInputChange("labNo", null, val)}
                      placeholder="Lab technician name"
                      type="text"
                    />
                    <InputField
                      label="Date"
                      value={formData.date}
                      onChange={(val) => handleInputChange("date", null, val)}
                      type="date"
                    />
                    <InputField
                      label="Referral/Doctor"
                      value={formData.referral}
                      onChange={(val) => handleInputChange("referral", null, val)}
                      placeholder="Dr. Name"
                    />
                    <InputField
                      label="Clinical Diagnosis"
                      value={formData.clinicalDiagnosis}
                      onChange={(val) => handleInputChange("clinicalDiagnosis", null, val)}
                      placeholder="e.g. Routine check"
                    />
                    <InputField
                      label="Nature of Specimen"
                      value={formData.natureOfSpecimen}
                      onChange={(val) => handleInputChange("natureOfSpecimen", null, val)}
                      placeholder="e.g. Blood, Urine"
                    />
                  </SectionContent>
                )}
              </div>

              {/* HAEMATOLOGY SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Haematology" id="haematology" count={4} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "haematology" && (
                  <SectionContent>
                    {Object.entries(formData.haematology).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("haematology", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* WBC DIFFERENTIAL SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="WBC Differential" id="wbcDifferential" count={20} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "wbcDifferential" && (
                  <SectionContent>
                    {Object.entries(formData.wbcDifferential).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("wbcDifferential", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* SEROLOGY SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Serology" id="serology" count={9} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "serology" && (
                  <SectionContent>
                    {Object.entries(formData.serology).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("serology", key, val)}
                        placeholder="Negative/Positive"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* HORMONE PROFILE SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Hormone Profile" id="hormoneProfile" count={8} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "hormoneProfile" && (
                  <SectionContent>
                    {Object.entries(formData.hormoneProfile).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("hormoneProfile", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* OESTROGEN SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Oestrogen" id="oestrogen" count={3} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "oestrogen" && (
                  <SectionContent>
                    {Object.entries(formData.oestrogen).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("oestrogen", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* URINALYSIS SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Urinalysis" id="urinalysis" count={12} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "urinalysis" && (
                  <SectionContent>
                    {Object.entries(formData.urinalysis).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("urinalysis", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* KIDNEY FUNCTION TEST SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Kidney Function Test" id="kidneyFunctionTest" count={6} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "kidneyFunctionTest" && (
                  <SectionContent>
                    {Object.entries(formData.kidneyFunctionTest).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("kidneyFunctionTest", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* LIVER FUNCTION TEST SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Liver Function Test" id="liverFunctionTest" count={7} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "liverFunctionTest" && (
                  <SectionContent>
                    {Object.entries(formData.liverFunctionTest).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("liverFunctionTest", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* DIABETES SCREENING SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Diabetes Screening" id="diabetesScreening" count={4} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "diabetesScreening" && (
                  <SectionContent>
                    {Object.entries(formData.diabetesScreening).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("diabetesScreening", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* LIPID PROFILE SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Lipid Profile" id="lipidProfile" count={5} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "lipidProfile" && (
                  <SectionContent>
                    {Object.entries(formData.lipidProfile).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("lipidProfile", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* OTHERS SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Others" id="others" count={7} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "others" && (
                  <SectionContent>
                    {Object.entries(formData.others).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("others", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* WIDAL REPORT SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Widal Report" id="widalReport" count={8} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "widalReport" && (
                  <div className="p-4 bg-[#FFFFFF] border border-[#AEAAAE] border-t-0 rounded-b-lg overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#00943C]/20 to-[#00943C]/10">
                          <th className="border border-[#AEAAAE] px-4 py-3 text-left font-semibold text-[#00943C]">Organism</th>
                          <th className="border border-[#AEAAAE] px-4 py-3 text-left font-semibold text-[#00943C]">O (Somatic)</th>
                          <th className="border border-[#AEAAAE] px-4 py-3 text-left font-semibold text-[#00943C]">H (Flagellar)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(formData.widalReport).map(([key, subValues]) => (
                          <tr key={key} className="hover:bg-[#00943C]/5">
                            <td className="border border-[#AEAAAE] px-4 py-3 font-medium text-[#605D66]">
                              {key === "SalmTyphi" && "Salmonella Typhi"}
                              {key === "SalmParatyphiA" && "Salmonella Paratyphi A"}
                              {key === "SalmParatyphiB" && "Salmonella Paratyphi B"}
                              {key === "SalmParatyphiC" && "Salmonella Paratyphi C"}
                            </td>
                            <td className="border border-[#AEAAAE] px-4 py-3">
                              <input
                                type="text"
                                value={subValues.O}
                                onChange={(e) =>
                                  handleNestedInputChange("widalReport", key, "O", e.target.value)
                                }
                                placeholder="e.g. 1:80"
                                className="w-full px-3 py-2 border border-[#AEAAAE] rounded-lg focus:outline-none focus:border-[#00943C] focus:ring-1 focus:ring-[#00943C]"
                              />
                            </td>
                            <td className="border border-[#AEAAAE] px-4 py-3">
                              <input
                                type="text"
                                value={subValues.H}
                                onChange={(e) =>
                                  handleNestedInputChange("widalReport", key, "H", e.target.value)
                                }
                                placeholder="e.g. 1:160"
                                className="w-full px-3 py-2 border border-[#AEAAAE] rounded-lg focus:outline-none focus:border-[#00943C] focus:ring-1 focus:ring-[#00943C]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* MICROBIOLOGY SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Microbiology" id="microbiology" count={4} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "microbiology" && (
                  <SectionContent>
                    {Object.entries(formData.microbiology).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("microbiology", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* WET PREPARATION SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Wet Preparation" id="wetPreparation" count={7} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "wetPreparation" && (
                  <SectionContent>
                    {Object.entries(formData.wetPreparation).map(([key, value]) => (
                      <InputField
                        key={key}
                        label={key}
                        value={value}
                        onChange={(val) => handleInputChange("wetPreparation", key, val)}
                        placeholder="Enter value"
                      />
                    ))}
                  </SectionContent>
                )}
              </div>

              {/* SEMI FLUID ANALYSIS SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Semi Fluid Analysis" id="semiFluidAnalysis" count={10} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "semiFluidAnalysis" && (
                  <div className="p-4 bg-[#FFFFFF] border border-[#AEAAAE] border-t-0 rounded-b-lg space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(formData.semiFluidAnalysis)
                        .filter(([key]) => key !== "Microscopy")
                        .map(([key, value]) => (
                          <InputField
                            key={key}
                            label={key}
                            value={value}
                            onChange={(val) =>
                              handleInputChange("semiFluidAnalysis", key, val)
                            }
                            placeholder="Enter value"
                          />
                        ))}
                    </div>

                    {/* Microscopy subsection */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-[#00943C] mb-4">Microscopy Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(formData.semiFluidAnalysis.Microscopy).map(
                          ([key, value]) => (
                            <InputField
                              key={`microscopy-${key}`}
                              label={key}
                              value={value}
                              onChange={(val) =>
                                handleNestedInputChange(
                                  "semiFluidAnalysis",
                                  "Microscopy",
                                  key,
                                  val
                                )
                              }
                              placeholder="Enter value"
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SENSITIVE PROFILE SECTION */}
              <div className="bg-white rounded-lg shadow">
                <SectionHeader title="Sensitive Profile" id="sensitiveProfile" count={16} expandedSection={expandedSection} toggleSection={toggleSection} />
                {expandedSection === "sensitiveProfile" && (
                  <div className="p-4 bg-[#FFFFFF] border border-[#AEAAAE] border-t-0 rounded-b-lg">
                    <h4 className="font-semibold text-[#00943C] mb-4">Antibiotic Sensitivity</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(formData.sensitiveProfile.Drugs).map(([key, value]) => (
                        <InputField
                          key={key}
                          label={key}
                          value={value}
                          onChange={(val) =>
                            handleNestedInputChange("sensitiveProfile", "Drugs", key, val)
                          }
                          placeholder="S/R/I"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* REMARKS SECTION */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 flex flex-col gap-3">
                  <label className="text-lg font-semibold text-[#00943C]">
                    Overall Remarks <span className="text-sm font-normal text-[#605D66]">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", null, e.target.value)}
                    placeholder="Add any additional remarks or findings..."
                    rows="4"
                    className="px-3 py-2 border border-[#AEAAAE] rounded-lg focus:outline-none focus:border-[#00943C] focus:ring-1 focus:ring-[#00943C]"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 mb-10">
                  <button
              className={`btn btn-primary text-white px-12 h-12 text-lg font-normal normal-case rounded-md ${saving ? "loading" : ""}`}
              onClick={onSave}
              disabled={saving}
            >
              Save Now
            </button>
                <button
                  onClick={() => navigate(-1)}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-[#AEAAAE] text-[#605D66] font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

           {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
        title="Save Lab Result"
        message="Are you sure you want to save this lab result? This action cannot be undone."
        confirmText="Save Lab Result"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AddLabResult;
