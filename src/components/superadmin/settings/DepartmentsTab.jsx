import React, { useEffect, useState } from 'react';
import { FaPlus, FaUsers, FaBed, FaEdit, FaTrash } from 'react-icons/fa';
import { AddDepartmentModal, EditDepartmentModal } from '@/components/modals';
import { getAllDepartments } from '@/services/api/departmentAPI';

const DepartmentsTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    const fetchDepartment = async() => {
      try {
        const res = await getAllDepartments()
        setDepartments(res.data)

        console.log(res.data);
      } catch(error) {
        console.error(error);
      }

    }

    fetchDepartment()
  }, []);

  const handleAddDepartment = () => {
    setIsAddModalOpen(true);
  };

  const handleEditDepartment = (department) => {
    console.log('Edit department:', department);
    // TODO: Implement edit functionality
    setSelectedDepartment(department);
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
              <th className="text-base-content/70">Head Of Department</th>
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
                  {department.headOfDepartment
                    ? `${department.headOfDepartment.firstName} ${  department.headOfDepartment.lastName }`
                    : 'N/A'}
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    department.status === 'active'
                      ? 'badge-success'
                      : 'badge-error'
                  }`}>
                    {department.status}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {handleEditDepartment(department); setIsEditModalOpen(true);}}
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

      {/* Edit Department Modal - To be implemented */}
      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onDepartmentUpdate={selectedDepartment}
      />
    </div>
  );
};

export default DepartmentsTab;
