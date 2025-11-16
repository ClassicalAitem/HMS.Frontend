import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit } from 'react-icons/fa';
import { AddServiceChargeModal } from '@/components/modals';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchServiceCharges } from '@/store/slices/serviceChargesSlice';
import toast from 'react-hot-toast';

const ServiceChargesTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { serviceCharges, isLoading, error } = useAppSelector(
    (state) => state.serviceCharges
  );

  // Fetch service charges on component mount
  useEffect(() => {
    dispatch(fetchServiceCharges());
  }, [dispatch]);

  // Debug: Log service charges data
  useEffect(() => {
    console.log('💰 ServiceChargesTab - Service charges:', serviceCharges);
    console.log('💰 ServiceChargesTab - isLoading:', isLoading);
    console.log('💰 ServiceChargesTab - error:', error);
  }, [serviceCharges, isLoading, error]);

  const handleAddServiceCharge = () => {
    setIsAddModalOpen(true);
  };

  const handleEditServiceCharge = (serviceCharge) => {
    console.log('Edit service charge:', serviceCharge);
    toast.success('Edit functionality coming soon!');
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

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-base-content">Service Charges</h2>
        <button
          onClick={handleAddServiceCharge}
          className="btn btn-primary"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Add Service Charge
        </button>
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
                <th className="text-base-content/70">Description</th>
                <th className="text-base-content/70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {serviceCharges && serviceCharges.length > 0 ? (
                serviceCharges.map((serviceCharge) => (
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
                      <div className="text-base-content/70 max-w-xs truncate">
                        {serviceCharge.description || 'No description'}
                      </div>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-base-content/50 py-8">
                    No service charges found
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
    </div>
  );
};

export default ServiceChargesTab;