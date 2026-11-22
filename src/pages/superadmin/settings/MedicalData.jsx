import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { DataTable } from '@/components/common';
import {
  FaArrowLeft,
  FaHeartbeat,
  FaUsers,
  FaExclamationTriangle,
  FaClipboardList,
  FaStethoscope,
  FaNotesMedical,
  FaPlus,
  FaPen,
  FaTrash,
  FaDownload,
  FaShieldAlt,
  FaFileUpload,
} from 'react-icons/fa';
import { FaScreenpal } from 'react-icons/fa6';
import AddComplaintModal from '@/components/modals/superadmin/AddComplaintModal';
import UpdateComplaintModal from '@/components/modals/superadmin/UpdateComplaintModal';
import UploadCsvModal from '@/components/modals/superadmin/UploadCsvModal';
import { deleteComplaint, getAllComplaint } from '@/services/api/medicalRecordAPI';
import { exportRowsToCsv } from '@/pages/superadmin/reports/reportUtils';
import { showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const MedicalData = () => {
  const [activeTab, setActiveTab] = useState('All Medical Data');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadCsvModalOpen, setIsUploadCsvModalOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await getAllComplaint();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      showErrorToast(error, 'Failed to load medical data');
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleMedicalRecordAdded = async () => {
    setIsAddModalOpen(false);
    await fetchComplaints();
  };

  const handleComplaintUpdated = async () => {
    setIsUpdateModalOpen(false);
    await fetchComplaints();
  };

  const handleCsvUploadSuccess = async () => {
    setIsUploadCsvModalOpen(false);
    await fetchComplaints();
  };

  const handleToggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredComplaints.length && filteredComplaints.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredComplaints.map((item) => item.id));
      setSelectedIds(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} item(s)? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        const deletePromises = Array.from(selectedIds).map((id) => deleteComplaint(id));
        await Promise.all(deletePromises);
        setSelectedIds(new Set());
        await fetchComplaints();
        toast.success(`Deleted ${selectedIds.size} records`);
      } catch (error) {
        showErrorToast(error, 'Failed to delete some medical records');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const processedComplaints = useMemo(
    () =>
      complaints.map((log) => ({
        id: log.id,
        name: log.name || log.dataName,
        category: log.category
          ? log.category
              .replace('_', ' ')
              .replace('history', 'History')
              .replace('medical', 'Medical')
              .replace('surgical', 'Surgical')
              .replace('family', 'Family')
              .replace('social', 'Social')
              .replace('allergical', 'Allergical')
          : 'General',
        rawCategory: log.category,
      })),
    [complaints]
  );

  const filteredComplaints = useMemo(() => {
    if (activeTab === 'All Medical Data') {
      return processedComplaints;
    }

    const categoryMap = {
      symptoms: 'symptoms',
      surgical: 'surgical',
      family: 'family',
      social: 'social',
      allergy: 'allergic',
      medical: 'medical_history',
      gynaecological: 'gynaecological',
      obstetrics: 'obstetrics',
      diagnosis: 'diagnosis',
    };

    const targetCategory = categoryMap[activeTab];
    return processedComplaints.filter(
      (item) =>
        item.rawCategory === targetCategory ||
        (targetCategory === 'obstetrics' && item.rawCategory === 'obstetric')
    );
  }, [processedComplaints, activeTab]);

  const handleExport = () => {
    if (!filteredComplaints.length) {
      toast.error('No medical data to export');
      return;
    }

    const cols = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Complaint / Term Name' },
      { key: 'category', label: 'Category' },
    ];

    const filename = `medical_data_${activeTab.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportRowsToCsv(filteredComplaints, cols, filename);
    toast.success(`Exported ${filteredComplaints.length} medical data records`);
  };

  const columns = useMemo(
    () => [
      {
        key: 'checkbox',
        title: (
          <input
            type="checkbox"
            checked={selectedIds.size === filteredComplaints.length && filteredComplaints.length > 0}
            onChange={handleSelectAll}
            className="checkbox checkbox-sm"
          />
        ),
        className: 'text-center w-12',
        render: (value, row) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => handleToggleSelection(row.id)}
            className="checkbox checkbox-sm"
          />
        ),
      },
      {
        key: 'name',
        title: 'Clinical Term / Complaint',
        sortable: true,
        render: (value, row) => (
          <div className="font-semibold text-base-content">{row.name || '—'}</div>
        ),
      },
      {
        key: 'category',
        title: 'Classification Category',
        sortable: true,
        render: (value, row) => (
          <span className="badge badge-sm badge-outline font-medium capitalize">
            {row.category || 'General'}
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'Actions',
        className: 'text-right',
        render: (value, row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 rounded-lg"
              title="Edit"
              onClick={() => {
                const original = complaints.find((c) => c.id === row.id);
                setSelectedComplaint(original);
                setIsUpdateModalOpen(true);
              }}
            >
              <FaPen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg"
              title="Delete"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this complaint?')) {
                  try {
                    await deleteComplaint(row.id);
                    await fetchComplaints();
                    toast.success('Complaint deleted successfully');
                  } catch (error) {
                    showErrorToast(error, 'Delete failed');
                  }
                }
              }}
            >
              <FaTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [complaints, selectedIds, filteredComplaints]
  );

  const tabs = [
    { id: 'All Medical Data', label: 'All Data', icon: FaNotesMedical },
    { id: 'symptoms', label: 'Symptoms', icon: FaHeartbeat },
    { id: 'surgical', label: 'Surgical', icon: FaScreenpal },
    { id: 'family', label: 'Family History', icon: FaUsers },
    { id: 'social', label: 'Social History', icon: FaUsers },
    { id: 'allergy', label: 'Allergy', icon: FaExclamationTriangle },
    { id: 'medical', label: 'Medical History', icon: FaClipboardList },
    { id: 'gynaecological', label: 'Gynaecological', icon: FaClipboardList },
    { id: 'obstetrics', label: 'Obstetrics', icon: FaClipboardList },
    { id: 'diagnosis', label: 'Diagnosis', icon: FaStethoscope },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Sleek Modern Header Bar */}
        <div className="bg-base-100 border border-base-200/80 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/superadmin/settings')}
              className="btn btn-ghost btn-sm btn-square rounded-xl text-base-content/70 hover:text-primary hover:bg-base-200"
              title="Back to Settings"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
              <FaNotesMedical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-base-content">
                  Medical Data & Clinical Complaints
                </h1>
                <span className="badge badge-xs badge-success gap-1 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ICD Registry
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Standardized symptoms, surgical terms, family history, and diagnostic presets
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300/40 text-xs text-base-content/80 font-medium">
            <FaShieldAlt className="w-3.5 h-3.5 text-primary" />
            <span>{complaints.length} Terms Registered</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-base-200/70 p-1.5 rounded-2xl border border-base-300/60 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Complaints Table Container */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-base-content">
                  {activeTab === 'All Medical Data' ? 'All Clinical Presets' : `${activeTab} Terms`}
                </h2>
                <span className="badge badge-sm badge-neutral font-semibold">
                  {filteredComplaints.length} items
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Manage, import, or export clinical complaints and symptom suggestions
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Export to CSV */}
              <button
                type="button"
                onClick={handleExport}
                className="btn btn-outline btn-sm rounded-xl gap-1.5"
                title="Export medical data to CSV"
              >
                <FaDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Upload CSV */}
              <button
                type="button"
                onClick={() => setIsUploadCsvModalOpen(true)}
                className="btn btn-outline btn-primary btn-sm rounded-xl gap-1.5"
              >
                <FaFileUpload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>

              {/* Add Medical Data */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary btn-sm rounded-xl gap-1.5 shadow-sm text-white"
              >
                <FaPlus className="w-3.5 h-3.5" />
                <span>Add Data</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-base-content">
                {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="btn btn-ghost btn-xs text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="btn btn-error btn-xs text-xs gap-1"
                >
                  {isDeleting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash className="w-3 h-3" />
                      <span>Delete ({selectedIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {isLoading ? (
            <div className="space-y-3 py-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-base-200/70 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredComplaints}
              columns={columns}
              searchable={true}
              sortable={true}
              paginated={true}
              initialEntriesPerPage={20}
              maxHeight="max-h-[500px]"
              showEntries={true}
              searchPlaceholder="Search complaints, symptoms, terms..."
            />
          )}

          {/* Modals */}
          <AddComplaintModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onMedicalRecordAdded={handleMedicalRecordAdded}
          />
          <UpdateComplaintModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            complaint={selectedComplaint}
            onUpdated={handleComplaintUpdated}
          />
          <UploadCsvModal
            isOpen={isUploadCsvModalOpen}
            onClose={() => setIsUploadCsvModalOpen(false)}
            onUploadSuccess={handleCsvUploadSuccess}
          />
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default MedicalData;
