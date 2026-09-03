import React, { useEffect, useState, useMemo } from 'react';
import { FaPlus, FaBuilding, FaEdit, FaTrash, FaSearch, FaUserTie } from 'react-icons/fa';
import { AddDepartmentModal, EditDepartmentModal } from '@/components/modals';
import { getAllDepartments, deleteDepartment } from '@/services/api/departmentAPI';
import { showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const DepartmentsTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const res = await getAllDepartments();
      const list = res?.data?.data ?? res?.data ?? res ?? [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch (error) {
      showErrorToast(error, 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, []);

  const handleAddDepartment = () => {
    setIsAddModalOpen(true);
  };

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  const handleDeleteDepartment = async (department) => {
    if (!window.confirm(`Are you sure you want to delete the "${department.name}" department?`)) {
      return;
    }
    setDeletingId(department.id);
    try {
      await deleteDepartment(department.id);
      toast.success(`Department "${department.name}" deleted successfully`);
      await fetchDepartment();
    } catch (error) {
      showErrorToast(error, 'Failed to delete department');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDepartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((d) => {
      const name = (d.name || '').toLowerCase();
      const head = d.headOfDepartment
        ? `${d.headOfDepartment.firstName || ''} ${d.headOfDepartment.lastName || ''}`.toLowerCase()
        : '';
      return name.includes(term) || head.includes(term);
    });
  }, [departments, searchTerm]);

  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 sm:p-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-base-content">Clinical & Admin Departments</h2>
            <span className="badge badge-primary badge-sm font-semibold">{departments.length} Total</span>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">Manage hospital clinical divisions, administrative units, and heads of department</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm rounded-xl pl-9 w-48 sm:w-60"
            />
          </div>
          <button
            onClick={handleAddDepartment}
            className="btn btn-primary btn-sm rounded-xl px-4 shadow-sm shadow-primary/20"
          >
            <FaPlus className="w-3.5 h-3.5 mr-1.5" />
            Add Department
          </button>
        </div>
      </div>

      {/* Departments Table */}
      <div className="overflow-x-auto rounded-xl border border-base-200">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/70">
            <tr>
              <th className="py-3 px-4">Department Name</th>
              <th className="py-3 px-4">Head of Department</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-base-200">
            {loading ? (
              [...Array(4)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 bg-base-300 rounded w-36"></div></td>
                  <td className="py-4 px-4"><div className="h-4 bg-base-300 rounded w-44"></div></td>
                  <td className="py-4 px-4"><div className="h-6 bg-base-300 rounded-full w-20"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-base-300 rounded-xl w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-base-content/60">
                  <FaBuilding className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                  <p className="font-medium text-sm">No departments found</p>
                  <p className="text-xs text-base-content/40 mt-1">
                    {searchTerm ? 'Try adjusting your search query' : 'Click "Add Department" to create your first hospital department'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredDepartments.map((department) => (
                <tr key={department.id} className="hover:bg-base-200/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        <FaBuilding className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-base-content">
                          {department.name}
                        </div>
                        <div className="text-[11px] text-base-content/50 font-mono">
                          ID: {department.id?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {department.headOfDepartment ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs">
                          <FaUserTie className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-base-content text-xs">
                            {department.headOfDepartment.firstName} {department.headOfDepartment.lastName}
                          </div>
                          {department.headOfDepartment.email && (
                            <div className="text-[11px] text-base-content/50">
                              {department.headOfDepartment.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-base-content/40 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge badge-sm font-semibold ${
                      department.status === 'active' || !department.status
                        ? 'badge-success'
                        : 'badge-error'
                    }`}>
                      {department.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditDepartment(department)}
                        className="btn btn-ghost btn-xs rounded-lg text-primary hover:bg-primary/10"
                        title="Edit Department"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department)}
                        disabled={deletingId === department.id}
                        className="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10"
                        title="Delete Department"
                      >
                        {deletingId === department.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <FaTrash className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDepartmentAdded={() => {
          setIsAddModalOpen(false);
          fetchDepartment();
        }}
      />

      {/* Edit Department Modal */}
      {selectedDepartment && (
        <EditDepartmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
            fetchDepartment();
          }}
          onDepartmentUpdate={selectedDepartment}
        />
      )}
    </div>
  );
};

export default DepartmentsTab;
