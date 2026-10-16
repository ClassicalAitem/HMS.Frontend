import React, { useEffect, useState } from 'react';
import { getLabResultById, getLabResultFile } from '@/services/api/labResultsAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { FaFileAlt, FaDownload, FaFlask, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const LabResultDetailsModal = ({ isOpen, onClose, labResultId, labResult: initialLabResult }) => {
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(initialLabResult || null);
  const [patient, setPatient] = useState(null);

  const displaySection = (title, data) => {
    if (!data || typeof data !== 'object') return null;
    const entries = Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    if (entries.length === 0) return null;

    return (
      <div className="mb-4 rounded-xl border border-base-200 overflow-hidden bg-base-100 shadow-xs">
        <div className="px-4 py-2.5 bg-base-200/50 border-b border-base-200 flex items-center gap-2">
          <FaFlask className="text-primary text-xs" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/80">
            {title}
          </h4>
        </div>
        <div className="p-3 divide-y divide-base-200/60">
          {entries.map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return (
                <div key={key} className="py-2 text-xs">
                  <span className="font-semibold text-base-content/70 block mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <div className="pl-3 border-l-2 border-primary/30 space-y-1">
                    {Object.entries(value).map(([subK, subV]) => (
                      <div key={subK} className="flex justify-between py-0.5">
                        <span className="text-base-content/60 capitalize">{subK.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-medium text-base-content">{String(subV)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={key} className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-medium text-base-content/70 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="font-semibold text-base-content text-right">{String(value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleDownloadFile = async (file, index) => {
    try {
      const fileId = file?._id || file?.id;
      if (fileId) {
        const response = await getLabResultFile(fileId);
        const blob = new Blob([response.data], { type: file.mimetype || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || file.name || `lab_file_${index + 1}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (file?.url) {
        window.open(file.url, '_blank');
      } else {
        toast.error("File download unavailable");
      }
    } catch (err) {
      console.error("File download failed:", err);
      toast.error("Failed to download file");
    }
  };

  const patientName =
    patient?.fullName ||
    (patient?.firstName && patient?.lastName ? `${patient.firstName} ${patient.lastName}`.trim() : null) ||
    patient?.name ||
    lab?.patient?.fullName ||
    (lab?.patient?.firstName ? `${lab.patient.firstName} ${lab.patient.lastName || ''}`.trim() : null) ||
    "Patient";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isOpen) return;

      if (initialLabResult && (!labResultId || labResultId === (initialLabResult._id || initialLabResult.id))) {
        setLab(initialLabResult);
        if (initialLabResult.patient) {
          setPatient(initialLabResult.patient);
        } else if (initialLabResult.patientId) {
          getPatientById(initialLabResult.patientId).then(p => {
            if (mounted) setPatient(p?.data || p);
          }).catch(() => {});
        }
        return;
      }

      if (!labResultId) return;

      try {
        setLoading(true);
        const res = await getLabResultById(labResultId);
        const data = res?.data ?? res;
        if (!data) throw new Error('No lab result');
        if (mounted) setLab(data);

        const targetPid = data?.patientId || data?.patient?._id || data?.patient?.id;
        if (targetPid) {
          try {
            const pRes = await getPatientById(targetPid);
            if (mounted) setPatient(pRes?.data || pRes);
          } catch (e) {
            console.warn('Failed to load patient for modal', e);
          }
        }
      } catch (e) {
        toast.error('Failed to load lab result details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [isOpen, labResultId, initialLabResult]);

  if (!isOpen) return null;

  const items = Array.isArray(lab?.result) ? lab.result : [];
  const files = Array.isArray(lab?.attachedFiles)
    ? lab.attachedFiles
    : Array.isArray(lab?.form?.attachments)
      ? lab.form.attachments
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative z-10 w-full max-w-2xl shadow-2xl rounded-2xl bg-base-100 max-h-[90vh] flex flex-col border border-base-200 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-base-200 bg-base-200/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FaFlask className="text-base" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-base-content leading-tight">
                Laboratory Investigation Result
              </h2>
              <p className="text-xs text-base-content/60">
                {lab?.createdAt ? formatNigeriaDate(lab.createdAt) : 'Result Record'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="loading loading-spinner loading-md text-primary" />
              <p className="text-xs text-base-content/60">Loading lab result details...</p>
            </div>
          ) : (
            <>
              {/* Patient and Lab Meta Header Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-base-200/50 rounded-xl border border-base-200">
                <div>
                  <div className="text-[11px] font-bold text-base-content/50 uppercase">Subject</div>
                  <div className="font-semibold text-xs sm:text-sm text-base-content truncate">{patientName}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-base-content/50 uppercase">Hospital ID</div>
                  <div className="font-semibold text-xs sm:text-sm text-base-content">{patient?.hospitalId || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-base-content/50 uppercase">Technician</div>
                  <div className="font-semibold text-xs sm:text-sm text-base-content truncate">
                    {lab?.labTechnicianName || lab?.technician?.fullName || lab?.form?.labNo || 'Lab Staff'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-base-content/50 uppercase">Date</div>
                  <div className="font-semibold text-xs sm:text-sm text-base-content">
                    {lab?.createdAt ? formatNigeriaDate(lab.createdAt) : (lab?.form?.date || '—')}
                  </div>
                </div>
              </div>

              {/* Standard Results Table (if present) */}
              {items.length > 0 && (
                <div className="rounded-xl border border-base-200 overflow-hidden bg-base-100 shadow-xs">
                  <div className="px-4 py-2.5 bg-base-200/40 border-b border-base-200 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/80">
                      Standard Test Findings ({items.length})
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra w-full text-xs">
                      <thead>
                        <tr className="bg-base-200/60 text-base-content/70">
                          <th>Test Parameter</th>
                          <th>Result Value</th>
                          <th>Unit</th>
                          <th>Reference Range</th>
                          <th>Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((r, idx) => {
                          const flag = String(r?.flag || '').toUpperCase();
                          const isAbnormal = flag === 'HIGH' || flag === 'LOW' || flag === 'ABNORMAL' || flag === 'POSITIVE';
                          return (
                            <tr key={idx}>
                              <td className="font-medium text-base-content">{r?.code || r?.name || '—'}</td>
                              <td className="font-bold text-base-content">{r?.value || '—'}</td>
                              <td className="text-base-content/70">{r?.unit || '—'}</td>
                              <td className="text-base-content/60">{r?.range || '—'}</td>
                              <td>
                                {r?.flag ? (
                                  <span className={`badge badge-xs ${
                                    isAbnormal ? 'badge-error' : 'badge-success'
                                  }`}>
                                    {r.flag}
                                  </span>
                                ) : (
                                  <span className="text-base-content/40">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Categorized Test Sections */}
              {displaySection('Haematology', lab?.form?.haematology)}
              {displaySection('WBC Differential', lab?.form?.wbcDifferential)}
              {displaySection('Serology', lab?.form?.serology)}
              {displaySection('Blood Crossmatching', lab?.form?.bloodCrossmaching)}
              {displaySection('Urinalysis', lab?.form?.urinalysis)}
              {displaySection('Kidney Function Test', lab?.form?.kidneyFunctionTest)}
              {displaySection('Liver Function Test', lab?.form?.liverFunctionTest)}
              {displaySection('Diabetes Screening', lab?.form?.diabetesScreening)}
              {displaySection('Lipid Profile', lab?.form?.lipidProfile)}
              {displaySection('Parasitology', lab?.form?.parasitology)}
              {displaySection('Microbiology', lab?.form?.microbiology)}
              {displaySection('Wet Preparation', lab?.form?.wetPreparation)}
              {displaySection('Others', lab?.form?.others)}

              {/* Remarks */}
              {(lab?.remarks || lab?.form?.remarks) && (
                <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 mb-1.5 flex items-center gap-1.5">
                    <span>Clinical / Technician Remarks</span>
                  </h4>
                  <p className="text-xs text-base-content/90 whitespace-pre-wrap leading-relaxed">
                    {lab.remarks || lab.form.remarks}
                  </p>
                </div>
              )}

              {/* Attached Files & Scan Reports */}
              {files.length > 0 && (
                <div className="p-3.5 bg-base-200/30 rounded-xl border border-base-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 mb-2.5 flex items-center gap-1.5">
                    <FaFileAlt className="text-primary" />
                    <span>Attached Reports & Files ({files.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((file, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center justify-between p-2.5 bg-base-100 rounded-lg border border-base-200 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FaFileAlt className="text-primary shrink-0 text-sm" />
                          <span className="text-xs font-medium text-base-content truncate">
                            {file.filename || file.name || `Attachment ${fIdx + 1}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-primary gap-1 shrink-0 ml-2"
                          onClick={() => handleDownloadFile(file, fIdx)}
                        >
                          <FaDownload className="text-[10px]" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-base-200 bg-base-200/30 flex justify-end">
          <button type="button" className="btn btn-sm btn-neutral" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabResultDetailsModal;
