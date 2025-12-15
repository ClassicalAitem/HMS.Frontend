import React, { useEffect, useState } from 'react';
import { FaPlus, FaMapMarkerAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { AddWardModal, EditWardModal } from '@/components/modals';
import { getAllWards } from '@/services/api/wardAPI';

const WardsTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    const fetchWards = async() => {
      try {
        const res = await getAllWards();
        setWards(res.data)
        console.log(res.data);
      } catch(error) {
        console.error(error);
      }
    }
    fetchWards()
  }, []);

  const handleAddWard = () => {
    setIsAddModalOpen(true);
  };

  const handleEditWard = (ward) => {
    console.log('Edit ward:', ward);
    // TODO: Implement edit functionality
    setSelectedWard(ward);
  };

  const handleDeleteWard = (ward) => {
    console.log('Delete ward:', ward);
    // TODO: Implement delete functionality
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

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-base-content">Wards</h2>
        <button
          onClick={handleAddWard}
          className="btn btn-primary"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Add Ward
        </button>
      </div>

      {/* Wards Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="text-base-content/70">Ward Name</th>
              <th className="text-base-content/70">Department</th>
              <th className="text-base-content/70">Occupancy</th>
              <th className="text-base-content/70">Floor</th>
              <th className="text-base-content/70">Status</th>
              <th className="text-base-content/70">Actions</th>
            </tr>
          </thead>
          <tbody>
            {wards.map((ward) => (
              <tr key={ward.id}>
                <td>
                  <div className="font-medium text-base-content">
                    {ward.name}
                  </div>
                </td>
                <td>
                  <div className="text-base-content/70">
                    {ward.department.name}
                  </div>
                </td>
                <td>
                  <div className="text-base-content/70">
                    {ward.occupancy}
                  </div>
                </td>
                <td>
                  <div className="flex items-center text-base-content/70">
                    <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                    {ward.floorLocation}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(ward.status)}`}>
                    {ward.status}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {handleEditWard(ward); setIsEditModalOpen(true)}}
                      className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                      title="Edit Ward"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWard(ward)}
                      className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                      title="Delete Ward"
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

      {/* Add Ward Modal */}
      <AddWardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWardAdded={() => {
          setIsAddModalOpen(false);
          // TODO: Refresh wards list
        }}
      />

      {/* Edit Ward Modal */}
      <EditWardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onWardUpdate={selectedWard}
      />
    </div>
  );
};

export default WardsTab;
