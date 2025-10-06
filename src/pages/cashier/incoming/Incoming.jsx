/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import cashierData from '@/data/cashierData.json';

const Incoming = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 6;

  useEffect(() => {
    setIncomingPatients(cashierData.incomingPatients);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const totalPages = Math.ceil(incomingPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = incomingPatients.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <FaArrowLeft className="w-5 h-5 text-primary" />
              <FaArrowRight className="w-5 h-5 text-primary" />
              <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">Incoming</h1>
            </div>
            <p className="text-sm text-base-content/70 2xl:text-base">Check out the patient sent to you.</p>
          </div>

          {/* Patient Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentPatients.map((patient) => (
              <div key={patient.id} className="p-6 rounded-lg shadow-lg bg-primary/5 border border-primary/10">
                {/* Sent By */}
                <div className="mb-4">
                  <p className="text-sm text-base-content/70">Sent By {patient.sentBy}</p>
                </div>

                {/* Patient Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={patient.photo}
                    alt={patient.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-base-content">Name: <span className="font-bold">{patient.name}</span></h3>
                    <p className="text-sm text-base-content/70">Patient ID: {patient.patientId}</p>
                    <p className="text-sm text-base-content/70">Insurance: {patient.insurance}</p>
                    <p className="text-sm text-base-content/70">Registered: {patient.registeredTime}</p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="pt-4 border-t border-primary/20">
                  <button className="text-primary hover:text-primary/80 hover:underline text-sm font-medium">
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
        </div>
      </div>
    </div>
  );
};

export default Incoming;
