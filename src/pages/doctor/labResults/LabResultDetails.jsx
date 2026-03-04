import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getLabResultById } from '@/services/api/labResultsAPI';
import { getPatientById } from '@/services/api/patientsAPI';

const LabResultDetails = () => {
  const { labResultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(null);
  const [patient, setPatient] = useState(null);

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

  const patientName =
    patient?.firstName && patient?.lastName
      ? `${patient.firstName} ${patient.lastName}`
      : patient?.name || "Unknown Patient";

  useEffect(() => {
    const load = async () => {
      if (!labResultId) return;
      try {
        setLoading(true);
        const res = await getLabResultById(labResultId);
        const data = res?.data ?? res;
        setLab(data);

        if (data?.patientId) {
          try {
            const pRes = await getPatientById(data.patientId);
            setPatient(pRes?.data || pRes);
          } catch (e) {
            console.warn('Failed to load patient for lab result', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [labResultId]);

  const items = useMemo(() => Array.isArray(lab?.result) ? lab.result : [], [lab]);
  const files = useMemo(() => Array.isArray(lab?.attachedFiles) ? lab.attachedFiles : [], [lab]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Lab Result Details</h1>
              <p className="text-sm text-base-content/60">View result and attachments</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/doctor/labResults', { state: location.state })}>Back to Lab Results</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* patient header card */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                {loading ? (
                  <div className="skeleton h-40 w-full" />
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b-2 border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Patient Name</p>
                        <p className="text-lg font-bold text-[#00943C]">{patientName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Hospital ID</p>
                        <p className="text-lg font-bold">{patient?.hospitalId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Lab Technician</p>   
                        <p className="text-lg font-bold">   {lab?.form?.labNo || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Date</p>
                        <p className="text-lg font-bold">{lab?.form?.date || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Test Information */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
                      {displayField('Age', lab?.form?.age)}
                      {displayField('Sex', lab?.form?.sex)}
                      {displayField('Clinical Diagnosis', lab?.form?.clinicalDiagnosis)}
                    </div>
                    {displayField('Nature of Specimen', lab?.form?.natureOfSpecimen)}
                    {displayField('Referral/Doctor', lab?.form?.referral)}

                    {/* raw results table (from lab.result array) */}
                    {items.length > 0 && (
                      <div className="shadow-xl card bg-base-100 mb-6">
                        <div className="p-4">
                          <h3 className="text-base font-semibold mb-2">Results</h3>
                          <div className="overflow-x-auto">
                            <table className="table w-full">
                              <thead>
                                <tr>
                                  <th>Code</th>
                                  <th>Value</th>
                                  <th>Unit</th>
                                  <th>Range</th>
                                  <th>Flag</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((r, idx) => (
                                  <tr key={idx}>
                                    <td>{r?.code || '—'}</td>
                                    <td>{r?.value || '—'}</td>
                                    <td>{r?.unit || '—'}</td>
                                    <td>{r?.range || '—'}</td>
                                    <td>{r?.flag || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sections */}
                    {displaySection('Haematology', lab?.form?.haematology)}
                    {displaySection('WBC Differential', lab?.form?.wbcDifferential)}
                    {displaySection('Serology', lab?.form?.serology)}
                    {displaySection('Hormone Profile', lab?.form?.hormoneProfile)}
                    {displaySection('Oestrogen', lab?.form?.oestrogen)}
                    {displaySection('Urinalysis', lab?.form?.urinalysis)}
                    {displaySection('Kidney Function Test', lab?.form?.kidneyFunctionTest)}
                    {displaySection('Liver Function Test', lab?.form?.liverFunctionTest)}
                    {displaySection('Diabetes Screening', lab?.form?.diabetesScreening)}
                    {displaySection('Lipid Profile', lab?.form?.lipidProfile)}
                    {displaySection('Others', lab?.form?.others)}

                    {/* Widal */}
                    {lab?.form?.widalReport &&
                      Object.values(lab.form.widalReport).some((v) => v.O || v.H) && (
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
                                    O 
                                  </th>
                                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                                    H 
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(lab.form.widalReport).map(([key, values]) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                      {key === 'SalmTyphi' && 'Salmonella Typhi'}
                                      {key === 'SalmParatyphiA' &&
                                        'Salmonella Paratyphi A'}
                                      {key === 'SalmParatyphiB' &&
                                        'Salmonella Paratyphi B'}
                                      {key === 'SalmParatyphiC' &&
                                        'Salmonella Paratyphi C'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      {values.O || '—'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      {values.H || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {displaySection('Microbiology', lab?.form?.microbiology)}
                    {displaySection('Wet Preparation', lab?.form?.wetPreparation)}
                    {displaySection('Antibiotic Sensitivity', lab?.form?.sensitiveProfile?.Drugs)}

                    {/* remarks */}
                    {lab?.form?.remarks && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                          Overall Remarks
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                          {lab.form.remarks}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="text-base font-semibold mb-2">Attachments</h3>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.length === 0 ? (
                        <div className="text-sm text-base-content/70">No attachments</div>
                      ) : files.map((f) => (
                        <div key={f?._id || f?.id} className="flex justify-between items-center text-sm p-2 rounded bg-base-200">
                          <div>
                            <div className="font-medium">{f?.name || 'file'}</div>
                            <div className="text-base-content/70">{f?.mimetype || '—'}</div>
                          </div>
                          <div className="text-base-content/60">{f?.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : '—'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultDetails;
