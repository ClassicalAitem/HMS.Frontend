import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { AddServiceChargeModal } from '@/components/modals';

const ServiceChargesTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sample data for service charges
  const serviceCharges = [
    {
      id: 1,
      name: 'Consultation Fee',
      category: 'General',
      amount: 5000,
      description: 'General consultation with doctor'
    },
    {
      id: 2,
      name: 'Blood Test',
      category: 'Laboratory',
      amount: 15000,
      description: 'Complete blood count and basic tests'
    },
    {
      id: 3,
      name: 'X-Ray',
      category: 'Radiology',
      amount: 25000,
      description: 'Chest X-ray examination'
    },
    {
      id: 4,
      name: 'Surgery',
      category: 'Surgical',
      amount: 150000,
      description: 'Minor surgical procedure'
    },
    {
      id: 5,
      name: 'Emergency Care',
      category: 'Emergency',
      amount: 30000,
      description: 'Emergency room consultation and treatment'
    }
  ];

  const handleAddServiceCharge = () => {
    setIsAddModalOpen(true);
  };

  const handleEditServiceCharge = (serviceCharge) => {
    console.log('Edit service charge:', serviceCharge);
    // TODO: Implement edit functionality
  };

  const handleDeleteServiceCharge = (serviceCharge) => {
    console.log('Delete service charge:', serviceCharge);
    // TODO: Implement delete functionality
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

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

      {/* Service Charges Table */}
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
            {serviceCharges.map((serviceCharge) => (
              <tr key={serviceCharge.id}>
                <td>
                  <div className="font-medium text-base-content">
                    {serviceCharge.name}
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
                    {serviceCharge.description}
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
                    <button
                      onClick={() => handleDeleteServiceCharge(serviceCharge)}
                      className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                      title="Delete Service Charge"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Service Charge Modal */}
      <AddServiceChargeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onServiceChargeAdded={() => {
          setIsAddModalOpen(false);
          // TODO: Refresh service charges list
        }}
      />
    </div>
  );
};

export default ServiceChargesTab;
