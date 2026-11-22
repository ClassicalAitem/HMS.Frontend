import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaDownload, FaFilter, FaLayerGroup } from 'react-icons/fa';
import { AddServiceChargeModal, EditServiceChargeModal } from '@/components/modals';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteServiceCharge, fetchServiceCharges } from '@/store/slices/serviceChargesSlice';
import { exportRowsToCsv } from '@/pages/superadmin/reports/reportUtils';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

const ServiceChargesTab = ({ categoryFilter = null, onClearCategory = null }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedServiceCharge, setSelectedServiceCharge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const dispatch = useAppDispatch();
  const { serviceCharges, isLoading, error } = useAppSelector(
    (state) => state.serviceCharges
  );

  // Ensure safe array extraction
  const chargesList = useMemo(() => {
    if (Array.isArray(serviceCharges)) return serviceCharges;
    if (Array.isArray(serviceCharges?.data)) return serviceCharges.data;
    if (Array.isArray(serviceCharges?.data?.data)) return serviceCharges.data.data;
    return [];
  }, [serviceCharges]);

  // Fetch service charges on component mount
  useEffect(() => {
    dispatch(fetchServiceCharges());
  }, [dispatch]);

  const handleAddServiceCharge = () => {
    setIsAddModalOpen(true);
  };

  const handleEditServiceCharge = (serviceCharge) => {
    setSelectedServiceCharge(serviceCharge);
    setIsEditModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const handleDeleteServiceCharge = async (serviceChargeId) => {
    if (window.confirm('Are you sure you want to delete this service charge tariff?')) {
      const result = await dispatch(deleteServiceCharge(serviceChargeId));

      if (deleteServiceCharge.fulfilled.match(result)) {
        toast.success('Service charge deleted successfully');
        dispatch(fetchServiceCharges());
      } else {
        toast.error(getErrorMessage(result.payload, 'Failed to delete service charge'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'active':
        return 'badge-success text-white';
      case 'inactive':
        return 'badge-ghost text-base-content/60';
      case 'maintenance':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  // Robust synonym and semantic category matcher
  const matchesCategory = (itemCategory, filterVal) => {
    if (!filterVal || filterVal === 'all') return true;
    const cat = String(itemCategory || '').toLowerCase().trim();
    const filter = String(filterVal).toLowerCase().trim();

    if (cat === filter) return true;

    // Surgical match: handles "surgical", "surgery", "theatre", "operation", "surgeon"
    if (
      (cat.includes('surg') || cat.includes('theatr') || cat.includes('operat')) &&
      (filter.includes('surg') || filter.includes('theatr') || filter.includes('operat'))
    ) {
      return true;
    }

    // Laboratory match: handles "laboratory", "lab", "lab_test", "test", "investigation"
    if (
      (cat.includes('lab') || cat.includes('test') || cat.includes('investigat')) &&
      (filter.includes('lab') || filter.includes('test'))
    ) {
      return true;
    }

    // Pharmacy match: handles "pharmacy", "drug", "medicine", "pharm"
    if (
      (cat.includes('pharm') || cat.includes('drug') || cat.includes('med')) &&
      (filter.includes('pharm') || filter.includes('drug'))
    ) {
      return true;
    }

    // Radiology match
    if (
      (cat.includes('rad') || cat.includes('xray') || cat.includes('scan') || cat.includes('ultra') || cat.includes('imag')) &&
      (filter.includes('rad') || filter.includes('scan') || filter.includes('imag'))
    ) {
      return true;
    }

    // Consultation match
    if (cat.includes('consult') && filter.includes('consult')) return true;

    // Admission match
    if (
      (cat.includes('admiss') || cat.includes('ward') || cat.includes('bed')) &&
      (filter.includes('admiss') || filter.includes('ward') || filter.includes('bed'))
    ) {
      return true;
    }

    // Vaccination
    if (cat.includes('vacc') && filter.includes('vacc')) return true;

    // Nursing
    if (cat.includes('nurs') && filter.includes('nurs')) return true;

    // General / Form
    if (
      (cat.includes('form') || cat.includes('gen') || cat.includes('reg')) &&
      (filter.includes('form') || filter.includes('gen') || filter.includes('reg'))
    ) {
      return true;
    }

    return false;
  };

  // Check if a service item matches search query
  const matchesSearch = (sc, term) => {
    if (!term) return true;
    const service = String(sc?.service || sc?.name || sc?.title || sc?.description || '').toLowerCase();
    const category = String(sc?.category || '').toLowerCase();
    const code = String(sc?.code || sc?.id || '').toLowerCase();
    const amount = String(sc?.amount || '');

    // If searching for surgical / surgery, match anything surgical in name or category
    if (term.includes('surg') && (service.includes('surg') || category.includes('surg') || category.includes('theatr'))) {
      return true;
    }

    return (
      service.includes(term) ||
      category.includes(term) ||
      code.includes(term) ||
      amount.includes(term)
    );
  };

  // Filtered service charges based on active category and search
  const visibleServiceCharges = useMemo(() => {
    let list = categoryFilter
      ? chargesList.filter((sc) => matchesCategory(sc?.category, categoryFilter))
      : chargesList;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((sc) => matchesSearch(sc, term));
    }

    return list;
  }, [chargesList, categoryFilter, searchTerm]);

  // Count matches across ALL categories when search is active
  const globalMatchCount = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return 0;
    return chargesList.filter((sc) => matchesSearch(sc, term)).length;
  }, [chargesList, searchTerm]);

  // Export Tariffs to CSV
  const handleExport = () => {
    if (!visibleServiceCharges.length) {
      toast.error('No service charges available to export');
      return;
    }

    const columns = [
      { key: 'service', label: 'Service / Tariff Name' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount (₦)' },
      { key: 'status', label: 'Status' },
      { key: 'admissionCovered', label: 'Admission Covered' },
    ];

    const rows = visibleServiceCharges.map((sc) => ({
      service: sc?.service || sc?.name || 'Untitled Service',
      category: sc?.category || 'general',
      amount: Number(sc?.amount || 0),
      status: sc?.status || 'active',
      admissionCovered: Array.isArray(sc?.admissionCovered)
        ? sc.admissionCovered.join('; ')
        : sc?.admissionCovered ? 'Yes' : 'No',
    }));

    const filename = `service_tariffs_${categoryFilter || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportRowsToCsv(rows, columns, filename);
    toast.success(`Exported ${rows.length} tariffs to ${filename}`);
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(visibleServiceCharges.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleServiceCharges.slice(start, start + itemsPerPage);
  }, [visibleServiceCharges, currentPage, itemsPerPage]);

  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Table Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-base-content">Clinical & Service Tariffs</h2>
            <span className="badge badge-sm badge-neutral font-semibold">
              {visibleServiceCharges.length} {visibleServiceCharges.length === 1 ? 'tariff' : 'tariffs'}
            </span>
            {categoryFilter && categoryFilter !== 'all' && (
              <span className="badge badge-sm badge-secondary font-medium capitalize">
                {categoryFilter.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">
            Configure hospital fee schedules, diagnostic investigation pricing, and surgical procedures
          </p>
        </div>

        {/* Controls: Search, Export, Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tariff, surgical, lab, drug..."
              className="input input-bordered input-sm w-full pl-9 pr-8 rounded-xl bg-base-200/50 focus:bg-base-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                title="Clear search"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExport}
            className="btn btn-outline btn-sm rounded-xl gap-1.5"
            title="Export tariffs to CSV"
          >
            <FaDownload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Add Service Charge */}
          <button
            type="button"
            onClick={handleAddServiceCharge}
            className="btn btn-primary btn-sm rounded-xl gap-1.5 shadow-sm text-white"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span>Add Tariff</span>
          </button>
        </div>
      </div>

      {/* Helpful Banner when search in specific category yields 0, but matches exist in other categories */}
      {searchTerm && visibleServiceCharges.length === 0 && globalMatchCount > 0 && categoryFilter && categoryFilter !== 'all' && (
        <div className="alert alert-info py-3 px-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-info-content" />
            <span>
              No tariffs match <strong>"{searchTerm}"</strong> in the <strong>{categoryFilter}</strong> category, but <strong>{globalMatchCount}</strong> found in other categories.
            </span>
          </div>
          {onClearCategory && (
            <button
              type="button"
              onClick={onClearCategory}
              className="btn btn-xs btn-neutral text-xs"
            >
              Search All Categories
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error text-xs py-2.5 rounded-xl">
          <span>Failed to load service charges: {String(error)}</span>
        </div>
      )}

      {/* Tariffs Table */}
      {isLoading ? (
        <div className="space-y-3 py-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-base-200/70 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-200">
          <table className="table table-zebra w-full text-xs sm:text-sm">
            <thead className="bg-base-200/60 text-base-content/70">
              <tr>
                <th className="font-semibold py-3">Tariff / Procedure Name</th>
                <th className="font-semibold py-3">Category</th>
                <th className="font-semibold py-3">Standard Amount</th>
                <th className="font-semibold py-3">Status</th>
                <th className="font-semibold py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length > 0 ? (
                paginatedList.map((sc, idx) => (
                  <tr key={sc.id || sc._id || idx} className="hover:bg-base-200/40 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-base-content">
                        {sc.service || sc.name || 'Untitled Tariff'}
                      </div>
                      {sc.code && (
                        <span className="font-mono text-[11px] text-base-content/50">
                          Code: {sc.code}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="badge badge-sm badge-outline font-medium capitalize">
                        {(sc.category || 'general').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-primary text-sm">
                        {formatCurrency(sc.amount)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`badge badge-sm font-semibold ${getStatusBadgeClass(sc.status)}`}>
                        {sc.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditServiceCharge(sc)}
                          className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 rounded-lg"
                          title="Edit Tariff"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteServiceCharge(sc.id || sc._id)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg"
                          title="Delete Tariff"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-base-content/50 py-12">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FaLayerGroup className="w-8 h-8 text-base-content/20 mx-auto" />
                      <p className="font-semibold text-sm">No service tariffs found</p>
                      <p className="text-xs text-base-content/60">
                        {searchTerm
                          ? `No tariffs match "${searchTerm}". Try adjusting your keywords or switching categories.`
                          : 'No service tariffs registered under this category yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {visibleServiceCharges.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-base-content/70">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, visibleServiceCharges.length)} of{' '}
            {visibleServiceCharges.length} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-xs btn-outline rounded-lg"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-xs btn-outline rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Service Charge Modal */}
      <AddServiceChargeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onServiceChargeAdded={() => {
          setIsAddModalOpen(false);
          dispatch(fetchServiceCharges());
        }}
      />

      {/* Edit Service Charge Modal */}
      <EditServiceChargeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onServiceChargeUpdated={() => {
          setIsEditModalOpen(false);
          dispatch(fetchServiceCharges());
        }}
        serviceCharge={selectedServiceCharge}
      />
    </div>
  );
};

export default ServiceChargesTab;
