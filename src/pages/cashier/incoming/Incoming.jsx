import React, { useState, useEffect } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { Md6FtApart } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { getPatients } from '@/services/api/patientsAPI';

const Incoming = () => {
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const statuses = new Set([
          'awaiting_cashier',
          'awaiting_payment'
        ]);
        const filtered = patients.filter((p) => statuses.has(String(p?.status || '').toLowerCase()));
        const sorted = filtered.sort((a, b) => {
          const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bTime - aTime;
        });
        const mapped = sorted.map((p) => ({
          id: p?.id,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          patientId: p?.hospitalId || p?.id || '—',
          photo: p?.profilePicture || p?.photo || 'https://randomuser.me/api/portraits/lego/1.jpg',
          gender: p?.gender || '—',
          phone: p?.phone || p?.phoneNumber || '—',
          insurance: p?.hmos?.provider || 'Self-pay',
          registeredTime: p?.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          sentBy: p?.doctor ? 'Doctor' : 'Front Desk'
        }));
        if (mounted) setIncomingPatients(mapped);
      } catch (err) {
        if (mounted) setIncomingPatients([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncoming();
    return () => { mounted = false; };
  }, []);

  const totalPages = Math.ceil(incomingPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = incomingPatients.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (patient) => {
    console.log('View Details Clicked:', patient);
    const id = patient?.id || patient?.patientId;
    if (!id) return;
    navigate(`/cashier/patient-details/${id}` , { state: { from: 'incoming', patientSnapshot: patient?.snapshot } });
  };

  return (
    <CashierLayout>
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4 space-x-3">
              <Md6FtApart className="w-5 h-5 text-primary" />
              <h1 className="text-3xl font-normal text-primary 2xl:text-4xl">Incoming</h1>
            </div>
            <p className="text-sm text-base-content/70 2xl:text-base">Check out the patient sent to you.</p>
          </div>

          {/* Patient Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} className="p-2 2xl:p-6 rounded-xl border shadow-lg border-text-content bg-base-100">
                  <div className="mb-4">
                    <div className="animate-pulse h-4 w-24 rounded bg-base-300" />
                  </div>
                  <div className="flex items-center mb-4 space-x-4">
                    <div className="w-16 h-16 rounded-full border-2 border-primary bg-base-300 animate-pulse" />
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="animate-pulse h-3 w-32 rounded bg-base-300" />
                      <div className="animate-pulse h-3 w-28 rounded bg-base-300" />
                      <div className="animate-pulse h-3 w-24 rounded bg-base-300" />
                      <div className="animate-pulse h-3 w-20 rounded bg-base-300" />
                    </div>
                  </div>
                  <div className="flex justify-center items-center mt-6 border-t border-primary/20">
                    <div className="animate-pulse h-4 w-44 rounded bg-base-300" />
                  </div>
                </div>
              ))
            ) : currentPatients.map((patient) => (
              <div key={patient.id} className="p-4 2xl:p-6 rounded-xl border shadow-lg border-text-content bg-base-100">
                {/* Sent By */}
                <div className="mb-4">
                  <p className="text-sm text-base-content/70">Sent By {patient.sentBy}</p>
                </div>

                {/* Patient Info */}
                <div className="flex items-center mb-2 2xl:mb-4 space-x-4">
                  <img
                    src={patient.photo}
                    alt={patient.name}
                    className="object-cover w-16 h-16 rounded-full border-2 border-primary"
                  />
                  <div className="grid grid-cols-2 gap-2 2xl:gap-4 w-full">
                    <p className="text-sm text-base-content/70">Name: {patient.name}</p>
                    <p className="text-sm text-base-content/70">Insurance: {patient.insurance}</p>
                    <p className="text-sm text-base-content/70">Patient ID: {patient.patientId}</p>
                    <p className="text-sm text-base-content/70">Registered: {patient.registeredTime}</p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex justify-center items-center border-t border-primary/20">
                  <button className="text-sm font-medium text-primary/80 hover:underline hover:text-primary" onClick={() => handleViewDetails(patient)}>
                    View Patient Payment Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      page === currentPage
                        ? 'bg-primary'
                        : 'bg-base-300 hover:bg-base-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
    </CashierLayout>
  );
};

export default Incoming;
