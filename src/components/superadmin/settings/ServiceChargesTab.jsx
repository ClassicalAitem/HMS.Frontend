import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from 'react-icons/fa';
import { AddServiceChargeModal, EditServiceChargeModal } from '@/components/modals';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteServiceCharge, fetchServiceCharges } from '@/store/slices/serviceChargesSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

const ServiceChargesTab = ({ categoryFilter = null }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedServiceCharge, setSelectedServiceCharge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useAppDispatch();
  const { serviceCharges, isLoading, error } = useAppSelector(
    (state) => state.serviceCharges
  );

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
      currency: 'NGN'
    }).format(amount);
  };

  // Skeleton loader for service charges table
  const ServiceChargesSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex space-x-4 p-3 bg-base-200 rounded-lg animate-pulse">
          <div className="h-4 w-32 bg-base-300 rounded"></div>
          <div className="h-4 w-20 bg-base-300 rounded"></div>
          <div className="h-4 w-16 bg-base-300 rounded"></div>
          <div className="h-4 w-48 bg-base-300 rounded"></div>
        </div>
      ))}
    </div>
  );
    const handleDeleteServiceCharge = async (serviceChargeId) => {
    if (window.confirm('Are you sure you want to delete this service charge?')) {
      const result = await dispatch(deleteServiceCharge(serviceChargeId));

      if (deleteServiceCharge.fulfilled.match(result)) {
        toast.success('Service charge deleted successfully');
        // Refresh the list to reflect changes
        dispatch(fetchServiceCharges());
      } else {
        toast.error(getErrorMessage(result.payload, 'Failed to delete service charge'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'Full':
        return 'badge-warning';
      case 'Maintenance':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  // Apply category filter (from parent tabs) then search filter (by service name or category)
  const visibleServiceCharges = useMemo(() => {
    if (!serviceCharges) return [];

    let list = categoryFilter
      ? serviceCharges.filter(
          (sc) => (sc?.category || '').toLowerCase() === String(categoryFilter || '').toLowerCase()
        )
      : serviceCharges;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((sc) => {
        const service = (sc?.service || '').toLowerCase();
        const category = (sc?.category || '').toLowerCase();
        return service.includes(term) || category.includes(term);
      });
    }

    return list;
  }, [serviceCharges, categoryFilter, searchTerm]);

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-base-content">Service Charges</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search service charges..."
              className="input input-bordered input-sm w-56 sm:w-64 pl-9 pr-8"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                title="Clear search"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleAddServiceCharge}
            className="btn btn-primary"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            Add Service Charge
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-4">
          <span>Error loading service charges: {error}</span>
        </div>
      )}

      {/* Service Charges Table */}
      {isLoading ? (
        <ServiceChargesSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="text-base-content/70">Service Name</th>
                <th className="text-base-content/70">Category</th>
                <th className="text-base-content/70">Amount</th>
                <th className="text-base-content/70">Status</th>
                <th className="text-base-content/70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleServiceCharges.length > 0 ? (
                visibleServiceCharges.map((serviceCharge) => (
                  <tr key={serviceCharge.id}>
                    <td>
                      <div className="font-medium text-base-content">
                        {serviceCharge.service}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline">
                        {serviceCharge.category}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-primary">
                        {formatCurrency(serviceCharge.amount)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(serviceCharge.status)}`}>
                    {serviceCharge.status}
                  </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditServiceCharge(serviceCharge)}
                          className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                          title="Edit Service Charge"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                           <button
                                    onClick={() => handleDeleteServiceCharge(serviceCharge.id)}
                                    className="btn btn-ghost btn-xs text-error"
                                    title="Delete Service Charge"
                                  >
                                    <FaTrash className="w-3 h-3" />
                                  </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-base-content/50 py-8">
                    {searchTerm ? `No service charges match "${searchTerm}"` : 'No service charges found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Service Charge Modal */}
      <AddServiceChargeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onServiceChargeAdded={() => {
          setIsAddModalOpen(false);
          // Refresh service charges list
          dispatch(fetchServiceCharges());
        }}
      />

      {/* Edit Service Charge Modal */}
      <EditServiceChargeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onServiceChargeUpdated={selectedServiceCharge}
      />
    </div>
  );
};

export default ServiceChargesTab;