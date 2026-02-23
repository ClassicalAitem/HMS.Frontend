import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, DataTable } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaHeartbeat, FaUsers, FaExclamationTriangle, FaClipboardList, FaStethoscope, FaNotesMedical, FaPlus, FaPen, FaTrash } from 'react-icons/fa';
import AddComplaintModal from '@/components/modals/superadmin/AddComplaintModal';
import UpdateComplaintModal from '@/components/modals/superadmin/UpdateComplaintModal';
import UploadCsvModal from '@/components/modals/superadmin/UploadCsvModal';
import {  deleteComplaint, getAllComplaint } from '@/services/api/medicalRecordAPI';
import { FaScreenpal } from 'react-icons/fa6';



const MedicalData = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Medical Data');
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

  // Format complaints data for DataTable
  const processedComplaints = useMemo(() => 
    complaints.map((log) => ({
      id: log.id,
      name: log.name || log.dataName,
      category: log.category?.replace('_', ' ').replace('history', 'History').replace('medical', 'Medical').replace('surgical', 'Surgical').replace('family', 'Family').replace('social', 'Social').replace('allergical', 'Allergical'),
      rawCategory: log.category,
    })), 
    [complaints]
  );

  // Filter complaints based on active tab
  const filteredComplaints = useMemo(() => {
    if (activeTab === 'All Medical Data') {
      return processedComplaints;
    }

    // Map tab id to backend category
    const categoryMap = {
      'symptoms': 'symptoms',
      'surgical': 'surgical',
      'family': 'family',
      'social': 'social',
      'allergy': 'allergic',
      'medical': 'medical_history',
      'diagnosis': 'diagnosis'
    };

    const targetCategory = categoryMap[activeTab];
    return processedComplaints.filter(item => item.rawCategory === targetCategory);
  }, [processedComplaints, activeTab]);

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      key: 'name',
      title: 'Complaint',
      sortable: true,
      className: 'font-medium text-base-content'
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'actions',
      title: 'Actions',
      className: 'text-base-content/70',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-xs mr-2"
            title="Edit"
            onClick={() => {
              const complaint = complaints.find(c => c.id === row.id);
              setSelectedComplaint(complaint);
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
                  await deleteComplaint(row.id);
                  await fetchComplaints();
                } catch {
                  alert('Delete failed!');
                }
              }
            }}
          >
            <FaTrash className="w-4 h-4 text-error" />
          </button>
        </div>
      )
    }
  ], [complaints]);

  const tabs = [
    { id: 'All Medical Data', label: 'All Data', icon: FaNotesMedical },
    { id: 'symptoms', label: 'Symptoms', icon: FaHeartbeat },
    { id: 'surgical', label: 'Surgical', icon: FaScreenpal },
    { id: 'family', label: 'Family', icon: FaUsers },
    { id: 'social', label: 'Social', icon: FaUsers },
    { id: 'allergy', label: 'Allergy', icon: FaExclamationTriangle },
    { id: 'medical', label: 'Medical History', icon: FaClipboardList },
    { id: 'diagnosis', label: 'Diagnosis', icon: FaStethoscope }
  ];

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
       
                   {isLoading ? (
                     <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                       <div className="overflow-auto max-h-96 p-4 space-y-3">
                         <div className="skeleton h-6 w-52" />
                         {Array.from({ length: 8 }).map((_, i) => (
                           <div key={i} className="skeleton h-8 w-full" />
                         ))}
                       </div>
                     </div>
                   ) : (
                     <DataTable
                       data={filteredComplaints}
                       columns={columns}
                       searchable={true}
                       sortable={true}
                       paginated={true}
                       initialEntriesPerPage={20}
                       maxHeight="max-h-96 sm:max-h-80 md:max-h-96 lg:max-h-80 2xl:max-h-96"
                       showEntries={true}
                       searchPlaceholder="Search complaints..."
                     />
                   )}
       
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
