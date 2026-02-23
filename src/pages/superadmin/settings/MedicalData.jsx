import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaBell, FaPlus, FaPen, FaTrash, FaNotesMedical, FaMedkit } from 'react-icons/fa';
import AddComplaintModal from '@/components/modals/superadmin/AddComplaintModal';
import UpdateComplaintModal from '@/components/modals/superadmin/UpdateComplaintModal';
import UploadCsvModal from '@/components/modals/superadmin/UploadCsvModal';
import {  deleteComplaint, getAllComplaint } from '@/services/api/medicalRecordAPI';



const MedicalData = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadCsvModalOpen, setIsUploadCsvModalOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


    React.useEffect(() => {
    console.log('complaints:', complaints);
  }, [complaints]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await getAllComplaint();
      setComplaints(Array.isArray(data) ? data : []);
    } catch {
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchComplaints();
  }, []);

  // Handler for when a new medical record is added
  const handleMedicalRecordAdded = async () => {
    setIsAddModalOpen(false);
    await fetchComplaints();
  };

  // Handler for update
  const handleComplaintUpdated = async () => {
    setIsUpdateModalOpen(false);
    await fetchComplaints();
  };

  // Handler for CSV upload
  const handleCsvUploadSuccess = async () => {
    setIsUploadCsvModalOpen(false);
    await fetchComplaints();
  };

  const tabs = [
    { id: 'complaints', label: 'Complaints', icon: FaNotesMedical },
    { id: 'allergy', label: 'Allergy', icon: FaBell },
    { id: 'surgical', label: 'Surgical', icon: FaMedkit }
  ];

  // const renderTabContent = () => {
  //   switch (activeTab) {
  //     case 'complaints':
  //       return <GeneralTab />;
  //     case 'notifications':
  //       return <NotificationsTab />;
  //     case 'appointments':
  //       return <AppointmentsTab />;
  //   }
  // };

  return (
    <div className="flex h-screen bg-base-300/20">
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
      <div className="flex overflow-hidden flex-col flex-1">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-6 h-full">
          {/* Page Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/superadmin/settings')}
              className="flex items-center text-base-content/70 hover:text-primary transition-colors mb-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </button>
              <h1 className="text-3xl font-bold text-primary">Medical Data</h1>
              <p className="text-base-content/70">Setup medical prescriptions, allergy, etc.</p>
          </div>
          

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-base-200 p-1 rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-content'
                        : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

    {/* Complaints  Table */}
                 <div className="bg-base-100 rounded-lg shadow-lg p-6">
                   <div className="mb-4">
                       <div  className="flex justify-between items-center">
                        <div>
                    <h1 className="text-3xl font-semibold text-base-content">Complaints</h1>
                     <p className="text-sm text-base-content/70">Manage possible patient complaint</p>
                        </div>
                        <div className="flex gap-2">
                        <button
                             onClick={() => setIsUploadCsvModalOpen(true)}
                            className="btn btn-outline btn-primary"
                        >
                        <FaPlus className="w-4 h-4 mr-2" />
                            
                           Upload CSV
                        </button>
                        <button
                             onClick={() => setIsAddModalOpen(true)}

                            className="btn btn-primary"
                        >
                        <FaPlus className="w-4 h-4 mr-2" />
                            
                           Add Medical Data
                        </button>
                        </div> 
                        
                        </div>
                   </div>
       
                   <div className="overflow-x-auto">
                     <table className="table table-zebra w-full">
                       <thead>
                         <tr>
                           <th className="text-base-content/70">Complaint</th>
                           <th className="text-base-content/70">Category</th>
                           
                           <th className="text-base-content/70">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {isLoading ? (
                           <tr><td colSpan={4}>Loading...</td></tr>
                         ) : complaints.length === 0 ? (
                           <tr><td colSpan={4}>No complaints found.</td></tr>
                         ) : (
                           complaints.map((log) => (
                             <tr key={log.id}>
                               <td>
                                 <div className="font-medium text-base-content">
                                   {log.name || log.dataName}
                                 </div>
                               </td>
                               <td>
                                 <div className="text-base-content/70">
                                   {log.category?.replace('_', ' ').replace('history', 'History').replace('medical', 'Medical').replace('surgical', 'Surgical').replace('family', 'Family').replace('social', 'Social').replace('allergical', 'Allergical')}
                                 </div>
                               </td>
                               <td>
                                 <button
                                   className="btn btn-ghost btn-xs mr-2"
                                   title="Edit"
                                   onClick={() => {
                                     setSelectedComplaint(log);
                                     setIsUpdateModalOpen(true);
                                   }}
                                 >
                                   <FaPen className="w-4 h-4 text-primary" />
                                 </button>
                                 <button
                                   className="btn btn-ghost btn-xs"
                                   title="Delete"
                                   onClick={async () => {
                                     if (window.confirm('Are you sure you want to delete this complaint?')) {
                                       try {
                                         await deleteComplaint(log.id);
                                         await fetchComplaints();
                                       } catch {
                                         alert('Delete failed!');
                                       }
                                     }
                                   }}
                                 >
                                   <FaTrash className="w-4 h-4 text-error" />
                                 </button>
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
       
              {/* Add Complaint Modal */}
            <AddComplaintModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onMedicalRecordAdded={handleMedicalRecordAdded}
            />
            {/* Update Complaint Modal */}
            <UpdateComplaintModal
              isOpen={isUpdateModalOpen}
              onClose={() => setIsUpdateModalOpen(false)}
              complaint={selectedComplaint}
              onUpdated={handleComplaintUpdated}
            />
            {/* Upload CSV Modal */}
            <UploadCsvModal
              isOpen={isUploadCsvModalOpen}
              onClose={() => setIsUploadCsvModalOpen(false)}
              onUploadSuccess={handleCsvUploadSuccess}
            />
                 </div>
      
   
        </div>
      </div>

       
    </div>
  );
};

export default MedicalData;
