import React, { useState, useEffect } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { Md6FtApart } from 'react-icons/md';
import cashierData from '@/data/cashierData.json';
import { useNavigate } from 'react-router-dom';

const Incoming = () => {
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    setIncomingPatients(cashierData.incomingPatients);
  }, []);

  const totalPages = Math.ceil(incomingPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = incomingPatients.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (patient) => {
    const id = patient?.patientId || patient?.id;
    if (!id) return;
    navigate(`/cashier/patient-details/${id}`);
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentPatients.map((patient) => (
              <div key={patient.id} className="p-6 rounded-xl border shadow-lg border-text-content bg-base-100">
                {/* Sent By */}
                <div className="mb-4">
                  <p className="text-sm text-base-content/70">Sent By {patient.sentBy}</p>
                </div>

                {/* Patient Info */}
                <div className="flex items-center mb-4 space-x-4">
                  <img
                    src={patient.photo}
                    alt={patient.name}
                    className="object-cover w-16 h-16 rounded-full border-2 border-primary"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-sm text-base-content/70">Name: {patient.name}</p>
                    <p className="text-sm text-base-content/70">Insurance: {patient.insurance}</p>
                    <p className="text-sm text-base-content/70">Patient ID: {patient.patientId}</p>
                    <p className="text-sm text-base-content/70">Registered: {patient.registeredTime}</p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex justify-center items-center mt-6 border-t border-primary/20">
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
