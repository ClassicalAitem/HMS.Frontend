import React, { useState } from 'react';
import { FaPlus, FaUsers, FaBed, FaEdit, FaTrash } from 'react-icons/fa';
import { AddDepartmentModal } from '@/components/modals';

const DepartmentsTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sample data for departments
  const departments = [
    {
      id: 1,
      name: 'Cardiology',
      head: 'Dr. Sarah Johnson',
      staffCount: 12,
      bedsCount: 25,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Emergency',
      head: 'Dr. Michael Brown',
      staffCount: 18,
      bedsCount: 15,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Pediatrics',
      head: 'Dr. Emily Davis',
      staffCount: 15,
      bedsCount: 30,
      status: 'Active'
    },
    {
      id: 4,
      name: 'Surgery',
      head: 'Dr. Robert Wilson',
      staffCount: 20,
      bedsCount: 12,
      status: 'Active'
    },
    {
      id: 5,
      name: 'Radiology',
      head: 'Dr. Lisa Anderson',
      staffCount: 8,
      bedsCount: 5,
      status: 'Active'
    }
  ];

  const handleAddDepartment = () => {
    setIsAddModalOpen(true);
  };

  const handleEditDepartment = (department) => {
    console.log('Edit department:', department);
    // TODO: Implement edit functionality
  };

  const handleDeleteDepartment = (department) => {
    console.log('Delete department:', department);
    // TODO: Implement delete functionality
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-base-content">Departments</h2>
        <button
          onClick={handleAddDepartment}
          className="btn btn-primary"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Departments Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="text-base-content/70">Department</th>
              <th className="text-base-content/70">Head</th>
              <th className="text-base-content/70">Staff</th>
              <th className="text-base-content/70">Beds</th>
              <th className="text-base-content/70">Status</th>
              <th className="text-base-content/70">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>
                  <div className="font-medium text-base-content">
                    {department.name}
                  </div>
                </td>
                <td>
                  <div className="text-base-content/70">
                    {department.head}
                  </div>
                </td>
                <td>
                  <div className="flex items-center text-base-content/70">
                    <FaUsers className="w-4 h-4 mr-2" />
                    {department.staffCount}
                  </div>
                </td>
                <td>
                  <div className="flex items-center text-base-content/70">
                    <FaBed className="w-4 h-4 mr-2" />
                    {department.bedsCount}
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    department.status === 'Active' 
                      ? 'badge-success' 
                      : 'badge-error'
                  }`}>
                    {department.status}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditDepartment(department)}
                      className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                      title="Edit Department"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department)}
                      className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                      title="Delete Department"
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

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDepartmentAdded={() => {
          setIsAddModalOpen(false);
          // TODO: Refresh departments list
        }}
      />
    </div>
  );
};

export default DepartmentsTab;
