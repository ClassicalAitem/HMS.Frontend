import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getLabResultById } from '@/services/api/labResultsAPI';

const LabResultDetails = () => {
  const { labResultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!labResultId) return;
      try {
        setLoading(true);
        const res = await getLabResultById(labResultId);
        const data = res?.data ?? res;
        setLab(data);
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
              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="skeleton h-5 w-40" />
                      <div className="skeleton h-5 w-40" />
                      <div className="skeleton h-5 w-40" />
                      <div className="skeleton h-5 w-40" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-base-content/70">Lab ID</div>
                        <div className="font-medium">{lab?._id || lab?.id || '—'}</div>
                      </div>
                      <div>
                        <div className="text-base-content/70">Patient ID</div>
                        <div className="font-medium">{lab?.patientId || '—'}</div>
                      </div>
                      <div>
                        <div className="text-base-content/70">Investigation Request</div>
                        <div className="font-medium">{lab?.investigationRequestId || '—'}</div>
                      </div>
                      <div>
                        <div className="text-base-content/70">Remarks</div>
                        <div className="font-medium">{lab?.remarks || '—'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="shadow-xl card bg-base-100">
                <div className="p-4 card-body">
                  <h3 className="text-base font-semibold mb-2">Result</h3>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-5 gap-3">
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
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
                          {items.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-base-content/70">No result data</td></tr>
                          ) : items.map((r, idx) => (
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
                  )}
                </div>
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
