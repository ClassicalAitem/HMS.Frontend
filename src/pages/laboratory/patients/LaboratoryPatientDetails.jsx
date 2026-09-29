import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaFlask, FaPlus, FaEdit, FaPlay } from 'react-icons/fa';
import { Header } from '@/components/common';
import LaboratorySidebar from '@/components/laboratory/dashboard/LaboratorySidebar';
import { getDependantById } from '@/services/api/dependantAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { getInvestigationByPatientId, updateInvestigation } from '@/services/api/investigationRequestAPI';
import { getAllBillings } from '@/services/api/billingAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { enrichInvestigationTestPayment } from '@/utils/investigationVisibility';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';

const unwrapRecord = (response) => response?.data?.data || response?.data || response;

const unwrapList = (response) => {
  const payload = unwrapRecord(response);
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
};

const getId = (value) => {
  if (typeof value === 'string') return value;
  return value?.id || value?._id || '';
};

const getStatusClass = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed': return 'badge-success';
    case 'cancelled': return 'badge-error';
    case 'processing':
    case 'in_progress': return 'badge-info';
    case 'pending':
    case 'awaiting_lab':
    case 'requested': return 'badge-warning';
    default: return 'badge-ghost';
  }
};

const normalizeRequestStatus = (status) => {
  const currentStatus = Array.isArray(status) ? status[status.length - 1] : status;
  return String(currentStatus || '').toLowerCase();
};

const isInvestigationClosed = (status) => ['completed', 'cancelled'].includes(normalizeRequestStatus(status));

const isTestPaymentReady = (test) => {
  const testInfo = test && typeof test === 'object' ? test : {};
  const paymentStatus = String(testInfo.paymentStatus || '').toLowerCase();
  const hmoStatus = String(testInfo.hmoStatus || '').toLowerCase();
  return testInfo.isPaid === true || testInfo.isCleared === true || paymentStatus === 'paid' || hmoStatus === 'approved';
};

const hasPaymentReadyTest = (request) => (
  Array.isArray(request.tests) && request.tests.some(isTestPaymentReady)
);

const TestPaymentBadge = ({ test }) => {
  const testInfo = test && typeof test === 'object' ? test : {};
  const hmoStatus = String(testInfo.hmoStatus || '').toLowerCase();
  if (hmoStatus) {
    const hmoBadgeClass = hmoStatus === 'approved'
      ? 'badge-success'
      : hmoStatus === 'rejected'
        ? 'badge-error'
        : 'badge-warning';
    const hmoLabel = hmoStatus.charAt(0).toUpperCase() + hmoStatus.slice(1);
    return <span className={`badge ${hmoBadgeClass} badge-sm whitespace-nowrap`}>{hmoLabel}</span>;
  }

  const paymentStatus = String(testInfo.paymentStatus || '').toLowerCase();
  const isPaid = testInfo.isPaid === true || testInfo.isCleared === true || paymentStatus === 'paid';
  return (
    <span className={`badge badge-sm whitespace-nowrap ${isPaid ? 'badge-success' : 'badge-warning'}`}>
      {isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );
};

const LaboratoryPatientDetails = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dependantId = location.state?.dependantId;
  const [patient, setPatient] = useState(null);
  const [dependant, setDependant] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [labResultsByInvestigationId, setLabResultsByInvestigationId] = useState({});
  const [labResultLookupFailed, setLabResultLookupFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatingInvestigationId, setUpdatingInvestigationId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const [patientResponse, investigationResponse, billingResponse, labResultsResponse] = await Promise.all([
          getPatientById(patientId),
          getInvestigationByPatientId(patientId).catch((error) => {
            if (error?.response?.status !== 404) throw error;
            return [];
          }),
          getAllBillings({ patientId }).catch(() => []),
          getLabResults().catch((error) => {
            console.warn('Could not check existing lab results:', error);
            return null;
          }),
        ]);
        const patientRecord = unwrapRecord(patientResponse);
        const patientData = Array.isArray(patientRecord) ? patientRecord[0] : patientRecord;
        const billingRecord = billingResponse?.data?.data ?? billingResponse?.data ?? billingResponse;
        const billings = Array.isArray(billingRecord) ? billingRecord : [];
        const labResults = labResultsResponse === null ? [] : unwrapList(labResultsResponse);
        const resultsByInvestigationId = {};
        labResults
          .slice()
          .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
          .forEach((result) => {
            const linkedInvestigationId = getId(result.investigationRequestId || result.investigationId || result.investigation);
            if (linkedInvestigationId && !resultsByInvestigationId[linkedInvestigationId]) {
              resultsByInvestigationId[linkedInvestigationId] = result;
            }
          });
        let dependantData = null;

        if (dependantId) {
          const dependantResponse = await getDependantById(dependantId);
          const dependantRecord = unwrapRecord(dependantResponse);
          dependantData = dependantRecord?.dependant || dependantRecord;
        }

        const labRequests = unwrapList(investigationResponse)
          .filter((request) => {
            const type = String(request.type || '').toLowerCase();
            const requestDependantId = getId(request.dependantId || request.dependant);
            const requestPatientId = getId(request.patientId || request.patient);
            const matchesSubject = dependantId
              ? requestDependantId === dependantId
              : requestPatientId === patientId && !requestDependantId;
            return matchesSubject && (type === 'lab' || type === 'laboratory');
          })
          .map((request) => ({
            ...request,
            tests: (Array.isArray(request.tests) ? request.tests : []).map((test) => (
              enrichInvestigationTestPayment(request, test, billings)
            )),
          }))
          .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));

        if (active) {
          setPatient(patientData || null);
          setDependant(dependantData);
          setInvestigations(labRequests);
          setLabResultsByInvestigationId(resultsByInvestigationId);
          setLabResultLookupFailed(labResultsResponse === null);
        }
      } catch (error) {
        console.error('Failed to load laboratory patient details:', error);
        if (active) toast.error('Failed to load patient details and lab requests.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetails();
    return () => { active = false; };
  }, [dependantId, patientId]);

  const subject = dependant || patient;
  const fullName = subject?.fullName || `${subject?.firstName || ''} ${subject?.lastName || ''}`.trim() || 'Patient';
  const handleLabResultAction = (request) => {
    if (labResultLookupFailed) {
      toast.error('Could not check whether a lab result already exists.');
      return;
    }
    const investigationId = request._id || request.id;
    if (!investigationId) {
      toast.error('Investigation request ID is missing.');
      return;
    }
    const existingResult = labResultsByInvestigationId[investigationId];
    if (existingResult) {
      const labResultId = existingResult._id || existingResult.id;
      if (!labResultId) {
        toast.error('The existing lab result could not be opened.');
        return;
      }
      navigate(`/dashboard/laboratory/results/edit/${labResultId}`);
      return;
    }
    navigate(`/dashboard/laboratory/results/add/${investigationId}`);
  };

  const handleStartProcessing = async (request) => {
    const investigationId = request._id || request.id;
    if (!investigationId || updatingInvestigationId) return;

    try {
      setUpdatingInvestigationId(investigationId);
      await updateInvestigation(investigationId, { status: 'in_progress' });
      setInvestigations((current) => current.map((item) => (
        (item._id || item.id) === investigationId ? { ...item, status: 'in_progress' } : item
      )));
      toast.success('Lab request moved to in progress.');
    } catch (error) {
      console.error('Failed to start lab request:', error);
      toast.error(error?.response?.data?.message || 'Failed to start lab request.');
    } finally {
      setUpdatingInvestigationId(null);
    }
  };

  return (
    <div className="flex h-screen bg-base-200">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <LaboratorySidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Patient Details</h1>
              <p className="text-sm text-base-content/60">{fullName}{dependantId ? ' · Dependant' : ''}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/laboratory/patients')}>
              <FaArrowLeft aria-hidden="true" /> Back to Patients
            </button>
          </div>

          <section className="grid gap-4 rounded-lg border border-base-300 bg-base-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-base-content/60">Hospital ID</p><p className="font-medium">{patient?.hospitalId || '—'}</p></div>
            <div><p className="text-xs text-base-content/60">Gender</p><p className="font-medium capitalize">{subject?.gender || '—'}</p></div>
            <div><p className="text-xs text-base-content/60">Phone</p><p className="font-medium">{subject?.phone || subject?.phoneNumber || patient?.phone || '—'}</p></div>
            <div><p className="text-xs text-base-content/60">Status</p><p className="font-medium capitalize">{subject?.status || patient?.status || 'Unknown'}</p></div>
          </section>

          <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
            <div className="flex items-center gap-2 border-b border-base-200 px-4 py-3">
              <FaFlask className="text-primary" aria-hidden="true" />
              <h2 className="font-semibold">Laboratory Investigation Requests</h2>
              <span className="badge badge-ghost badge-sm">{investigations.length}</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>
            ) : investigations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-base-content/60">No laboratory investigation requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead><tr><th>Investigation</th><th>Ordered Tests</th><th>Status</th><th>Priority</th><th>Requested</th></tr></thead>
                  <tbody>
                    {investigations.map((request) => (
                      <tr key={request._id || request.id}>
                        <td className="font-medium">{request.investigationType || request.type || 'Laboratory'}</td>
                        <td>
                          {Array.isArray(request.tests) && request.tests.length > 0 ? (
                            <div className="flex min-w-max items-start gap-2">
                              {hasPaymentReadyTest(request) && <button
                                type="button"
                                className={`btn btn-outline btn-xs whitespace-nowrap ${labResultLookupFailed || isInvestigationClosed(request.status) ? 'btn-disabled' : labResultsByInvestigationId[request._id || request.id] ? 'btn-warning' : 'btn-primary'}`}
                                disabled={labResultLookupFailed || isInvestigationClosed(request.status)}
                                onClick={() => handleLabResultAction(request)}
                              >
                                {isInvestigationClosed(request.status)
                                  ? null
                                  : labResultsByInvestigationId[request._id || request.id]
                                    ? <FaEdit aria-hidden="true" />
                                    : <FaPlus aria-hidden="true" />}
                                {isInvestigationClosed(request.status)
                                  ? normalizeRequestStatus(request.status) === 'completed' ? 'Completed' : 'Cancelled'
                                  : labResultLookupFailed
                                  ? 'Unable to Check Result'
                                  : labResultsByInvestigationId[request._id || request.id]
                                    ? 'Edit Lab Result'
                                    : 'Add Lab Result'}
                                  </button>}
                              <details className="group min-w-48">
                                <summary className="cursor-pointer select-none font-medium hover:text-primary">
                                  {request.tests.length} ordered {request.tests.length === 1 ? 'test' : 'tests'}
                                </summary>
                                <ul className="mt-2 space-y-2">
                                  {request.tests.map((test, index) => (
                                    <li key={test?.id || test?._id || test?.code || index} className="flex min-w-64 items-center justify-between gap-3 rounded-md border border-base-200 bg-base-100 px-2 py-1.5">
                                      <span className="min-w-0 text-sm">{typeof test === 'string' ? test : test.name || test.code || 'Test'}</span>
                                      <TestPaymentBadge test={test} />
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            </div>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="flex min-w-max items-center gap-2">
                            <span className={`badge badge-sm ${getStatusClass(request.status)}`}>{String(request.status || 'Unknown').replace(/_/g, ' ')}</span>
                            {normalizeRequestStatus(request.status) === 'requested' && (
                              <button
                                type="button"
                                className="btn btn-primary btn-xs whitespace-nowrap"
                                disabled={updatingInvestigationId !== null}
                                onClick={() => handleStartProcessing(request)}
                              >
                                {updatingInvestigationId === (request._id || request.id)
                                  ? <span className="loading loading-spinner loading-xs" />
                                  : <FaPlay aria-hidden="true" />}
                                Start Processing
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="capitalize">{request.priority || 'Normal'}</td>
                        <td>{request.createdAt ? formatNigeriaDateTime(request.createdAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default LaboratoryPatientDetails;