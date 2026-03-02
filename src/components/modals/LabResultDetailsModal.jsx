import React, { useEffect, useState } from 'react';
import { getLabResultById } from '@/services/api/labResultsAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import toast from 'react-hot-toast';

const LabResultDetailsModal = ({ isOpen, onClose, labResultId }) => {
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(null);
  const [patient, setPatient] = useState(null);

  const displayField = (label, value) => {
    if (!value) return null;
    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
        <div className="font-semibold text-[#00943C]">{label}</div>
        <div className="col-span-2 text-gray-700">{value}</div>
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
      if (!isOpen || !labResultId) return;
      try {
        setLoading(true);
        const res = await getLabResultById(labResultId);
        const data = res?.data ?? res;
        if (!data) throw new Error('No lab result');
        setLab(data);

        if (data?.patientId) {
          try {
            const pRes = await getPatientById(data.patientId);
            setPatient(pRes?.data || pRes);
          } catch (e) {
            console.warn('Failed to load patient for modal', e);
          }
        }
      } catch (e) {
        toast.error('Failed to load lab result');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, labResultId]);

  if (!isOpen) return null;

  const items = Array.isArray(lab?.result) ? lab.result : [];
  const files = Array.isArray(lab?.attachedFiles) ? lab.attachedFiles : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100 max-h-[80vh] overflow-y-auto">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Lab Result Details</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : (
            <div className="space-y-4">
              {/* patient header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600 uppercase font-semibold">Patient</div>
                  <div className="font-medium">{patientName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase font-semibold">Hospital ID</div>
                  <div className="font-medium">{patient?.hospitalId || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase font-semibold">Technician</div>
                  <div className="font-medium">{lab?.form?.labNo || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase font-semibold">Date</div>
                  <div className="font-medium">{lab?.form?.date || '—'}</div>
                </div>
              </div>

              {/* raw result table */}
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

              {/* test sections */}
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
                              O (Somatic)
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              H (Flagellar)
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabResultDetailsModal;
