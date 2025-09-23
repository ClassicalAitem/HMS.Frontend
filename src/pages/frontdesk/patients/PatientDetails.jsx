/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { EditPatientModal } from '@/components/modals';
import patientDetailsData from '@/data/patientDetails.json';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { LuPencilLine } from 'react-icons/lu';
import { IoIosCloseCircleOutline } from 'react-icons/io';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patient, setPatient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [paymentHistoryExpanded, setPaymentHistoryExpanded] = useState(false);

  useEffect(() => {
    // Find patient by ID
    const foundPatient = patientDetailsData.find(p => p.id === patientId);
    if (foundPatient) {
      // Add fallback data for missing fields
      const patientWithFallbacks = {
        ...foundPatient,
        // Fallback for missing appointments
        appointments: foundPatient.appointments || {
          upcoming: {
            date: "No upcoming appointment",
            time: "",
            doctor: "",
            department: ""
          },
          last: {
            date: "No previous appointment",
            doctor: "",
            department: "",
            reason: ""
          }
        },
        // Fallback for missing medical history
        medicalHistory: foundPatient.medicalHistory || {
          conditions: "No known conditions",
          allergies: "No known allergies",
          medications: "No current medications",
          surgery: "No previous surgeries",
          lastVisit: "No previous visits"
        },
        // Fallback for missing next of kin
        nextOfKin: foundPatient.nextOfKin || {
          name: "Not provided",
          relationship: "Not provided",
          stateOfOrigin: "Not provided",
          phoneNumber: "Not provided",
          address: "Not provided"
        },
        // Fallback for missing bills
        outstandingBills: foundPatient.outstandingBills || [],
        // Fallback for missing payment history
        paymentHistory: foundPatient.paymentHistory || []
      };
      setPatient(patientWithFallbacks);
    } else {
      // Redirect to patients list if patient not found
      navigate('/patients');
    }
  }, [patientId, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleEditPatient = (updatedData) => {
    console.log('Updated patient data:', updatedData);
    // Here you would typically update the patient data
    setIsEditModalOpen(false);
  };

  const calculateOutstandingBalance = () => {
    if (!patient) return 0;
    return patient.outstandingBills.reduce((total, bill) => total + bill.balance, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!patient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading patient details...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-regular text-base-content/70 2xl:text-2xl">Patient Details</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn btn-ghost btn-sm"
              >
                <LuPencilLine className="w-4 h-4 2xl:w-6 2xl:h-6" />
              </button>
              <button
                onClick={() => navigate('/patients')}
                className="btn btn-ghost btn-sm"
              >
                <IoIosCloseCircleOutline className="w-4 h-4 2xl:w-6 2xl:h-6" />
              </button>
            </div>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-1 gap-6">
            {/* Left Column - Patient Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Patient Identification */}
              <div className="shadow-xl card bg-base-100">
                <div className="flex flex-col p-6 card-body">

                  <div className="flex flex-row items-center space-x-4">
                    <div className="ml-4 avatar">
                      <div className="w-20 h-20 rounded-full border-3 border-primary">
                        <img src={patient.avatar} alt={patient.name} />
                      </div>
                    </div>

                    <div className="flex gap-12 justify-around px-8 w-auto 2xl:gap-0 2xl:w-full">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient Name </span>
                        <span className="text-xl font-semibold text-base-content">{patient.name}</span>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Gender</span>
                        <span className="text-xl font-semibold text-base-content">{patient.gender}</span>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Phone Number</span>
                        <span className="text-xl font-semibold text-base-content">{patient.phoneNumber}</span>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient ID</span>
                        <span className="text-xl font-semibold text-base-content">{patient.patientId}</span>
                      </div>

                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
                    <div>
                      <li className="text-sm font-semibold text-base-content">Insurance: {patient.insurance}</li>
                    </div>

                    <div>
                      <span className="text-sm font-semibold text-base-content">Status</span>
                      <span className="px-12 text-sm font-semibold text-base-100 btn btn-xs bg-primary">{patient.status}</span>
                    </div>
                  </div>


                </div>
              </div>

              {/* General Info */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">General Info</h3>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-regular text-base-content/70 text-md">Address</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.address}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Town</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.town}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">State of origin</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.stateOfOrigin}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">LGA</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.lga}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Date of birth</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.dateOfBirth}</span>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Email</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">Additional Info</h3>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="font-regular text-base-content/70 text-md">Next of kin</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.nextOfKin.name}</span>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">Relationship</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.nextOfKin.relationship}</span>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">State of origin</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.nextOfKin.stateOfOrigin}</span>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">Phone number</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.nextOfKin.phoneNumber}</span>
                    </div>

                    <div className="md:col-span-2">
                      <p className="font-regular text-base-content/70 text-md">Address</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.nextOfKin.address}</span>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">Medical History</h3>
                  <div className="flex justify-around 2xl:justify-start">
                     <div className="space-y-3 2xl:pl-12">
                       <div>
                         <li className="text-sm text-base-content/70"><span className="font-medium">Conditions:</span> {patient.medicalHistory?.conditions || "No known conditions"}</li>
                       </div>
                       <div>
                         <li className="text-sm text-base-content/70"><span className="font-medium">Allergies:</span> {patient.medicalHistory?.allergies || "No known allergies"}</li>
                       </div>
                       <div>
                         <li className="text-sm text-base-content/70"><span className="font-medium">Medications:</span> {patient.medicalHistory?.medications || "No current medications"}</li>
                       </div>
                       <div>
                         <li className="text-sm text-base-content/70"><span className="font-medium">Surgery:</span> {patient.medicalHistory?.surgery || "No previous surgeries"}</li>
                       </div>
                       <div>
                         <li className="text-sm text-base-content/70"><span className="font-medium">Last Visit:</span> {patient.medicalHistory?.lastVisit || "No previous visits"}</li>
                       </div>
                     </div>

                    {/* Right Column - Appointments */}
                    <div className="">
                      {/* Appointments */}
                      <div className="shadow-xl card">
                        <div className="py-0 card-body">
                          <div className="flex items-center mb-4 space-x-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <h3 className="text-lg font-semibold text-base-content">Appointments</h3>
                          </div>
                          
                           <div className="space-y-4">
                             <div>
                               <h4 className="font-medium text-base-content">Upcoming Appointment:</h4>
                               <p className="text-sm text-base-content/70">
                                 {patient.appointments?.upcoming?.date || "No upcoming appointment"}
                                 {patient.appointments?.upcoming?.time && ` - ${patient.appointments.upcoming.time}`}
                                 {patient.appointments?.upcoming?.doctor && ` | ${patient.appointments.upcoming.doctor}`}
                                 {patient.appointments?.upcoming?.department && ` (${patient.appointments.upcoming.department})`}
                               </p>
                             </div>
                             <div>
                               <h4 className="font-medium text-base-content">Last Appointment:</h4>
                               <p className="text-sm text-base-content/70">
                                 {patient.appointments?.last?.date || "No previous appointment"}
                                 {patient.appointments?.last?.doctor && ` - ${patient.appointments.last.doctor}`}
                                 {patient.appointments?.last?.department && ` (${patient.appointments.last.department})`}
                                 {patient.appointments?.last?.reason && ` | ${patient.appointments.last.reason}`}
                               </p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            
          </div>

            {/* Outstanding Bills */}
            {patient.outstandingBills && patient.outstandingBills.length > 0 && (
              <div className="mt-6 shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">Patient Outstanding Bills</h3>
                  <div className="overflow-x-auto">
                    <table className="table w-full table-zebra">
                      <thead className="border-b-2 border-base-content/70">
                        <tr>
                          <th>Invoice No</th>
                          <th>Date</th>
                          <th>Service</th>
                          <th>Amount</th>
                          <th>Deposited</th>
                          <th>Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patient.outstandingBills.map((bill, index) => (
                          <tr key={index}>
                            <td>{bill.invoiceNo}</td>
                            <td>{bill.date}</td>
                            <td>{bill.service}</td>
                            <td>{formatCurrency(bill.amount)}</td>
                            <td>{formatCurrency(bill.deposited)}</td>
                            <td>{formatCurrency(bill.balance)}</td>
                            <td>
                              <div className={`badge ${bill.status === 'Partially Paid' ? 'badge-warning' :
                                  bill.status === 'Covered by HMO' ? 'badge-info' : 'badge-error'
                                }`}>
                                {bill.status}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2 items-center p-3 mt-4 rounded-lg bg-error/10">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <p className="font-semibold text-base-content">
                      Outstanding Balance: {formatCurrency(calculateOutstandingBalance())}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Payment History */}
          {patient.paymentHistory && patient.paymentHistory.length > 0 && (
            <div className="mt-6 shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-base-content">Payment History</h3>
                  <button
                    onClick={() => setPaymentHistoryExpanded(!paymentHistoryExpanded)}
                    className="btn btn-ghost btn-sm"
                  >
                    {paymentHistoryExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
                
                {paymentHistoryExpanded && (
                  <div className="overflow-x-auto">
                    <table className="table w-full table-zebra">
                      <thead className="border-b-2 border-base-content/70">
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>Service</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patient.paymentHistory.map((payment, index) => (
                          <tr key={index}>
                            <td>{payment.receiptNo}</td>
                            <td>{payment.date}</td>
                            <td>{payment.service}</td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.method}</td>
                            <td>
                              <div className="badge badge-success">{payment.status}</div>
                            </td>
                            <td>{payment.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center mt-6 space-x-4">
            <button className="btn btn-outline">
              Send to Cashier
            </button>
            <button className="btn btn-primary">
              Send to Nurse
            </button>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={patient}
        onSave={handleEditPatient}
      />
    </div>
  );
};

export default PatientDetails;
