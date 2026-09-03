import React, { useEffect, useState, useMemo } from 'react';
import { FaPlus, FaMapMarkerAlt, FaEdit, FaTrash, FaBed, FaSearch } from 'react-icons/fa';
import { AddWardModal, EditWardModal } from '@/components/modals';
import { getAllWards, deleteWard } from '@/services/api/wardAPI';
import { showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const WardsTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const res = await getAllWards();
      const list = res?.data?.data ?? res?.data ?? res ?? [];
      setWards(Array.isArray(list) ? list : []);
    } catch (error) {
      showErrorToast(error, 'Failed to load wards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleAddWard = () => {
    setIsAddModalOpen(true);
  };

  const handleEditWard = (ward) => {
    setSelectedWard(ward);
    setIsEditModalOpen(true);
  };

  const handleDeleteWard = async (ward) => {
    if (!window.confirm(`Are you sure you want to delete "${ward.name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(ward.id);
    try {
      await deleteWard(ward.id);
      toast.success(`Ward "${ward.name}" deleted successfully`);
      await fetchWards();
    } catch (error) {
      showErrorToast(error, 'Failed to delete ward');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredWards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return wards;
    return wards.filter((w) => {
      const name = (w.name || '').toLowerCase();
      const dept = (w.department?.name || '').toLowerCase();
      const floor = (w.floorLocation || '').toLowerCase();
      return name.includes(term) || dept.includes(term) || floor.includes(term);
    });
  }, [wards, searchTerm]);

  const getStatusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'active':
        return 'badge-success';
      case 'full':
        return 'badge-warning';
      case 'maintenance':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 sm:p-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-base-content">Inpatient Wards & Units</h2>
            <span className="badge badge-primary badge-sm font-semibold">{wards.length} Total</span>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">Configure clinical admission wards, floor locations, and bed allocations</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search wards or floors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm rounded-xl pl-9 w-48 sm:w-60"
            />
          </div>
          <button
            onClick={handleAddWard}
            className="btn btn-primary btn-sm rounded-xl px-4 shadow-sm shadow-primary/20"
          >
            <FaPlus className="w-3.5 h-3.5 mr-1.5" />
            Add Ward
          </button>
        </div>
      </div>

      {/* Wards Table */}
      <div className="overflow-x-auto rounded-xl border border-base-200">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/70">
            <tr>
              <th className="py-3 px-4">Ward Name</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Capacity / Beds</th>
              <th className="py-3 px-4">Floor Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-base-200">
            {loading ? (
              [...Array(4)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 bg-base-300 rounded w-36"></div></td>
                  <td className="py-4 px-4"><div className="h-4 bg-base-300 rounded w-28"></div></td>
                  <td className="py-4 px-4"><div className="h-4 bg-base-300 rounded w-20"></div></td>
                  <td className="py-4 px-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                  <td className="py-4 px-4"><div className="h-6 bg-base-300 rounded-full w-16"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-base-300 rounded-xl w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredWards.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-base-content/60">
                  <FaBed className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                  <p className="font-medium text-sm">No inpatient wards found</p>
                  <p className="text-xs text-base-content/40 mt-1">
                    {searchTerm ? 'Try adjusting your search filter' : 'Click "Add Ward" to create your first admission facility'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredWards.map((ward) => (
                <tr key={ward.id} className="hover:bg-base-200/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                        <FaBed className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-base-content">
                          {ward.name}
                        </div>
                        <div className="text-[11px] text-base-content/50 font-mono">
                          ID: {ward.id?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-base-content text-xs">
                      {ward.department?.name || 'General Medicine'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-bold text-base-content">{ward.occupancy ?? ward.capacity ?? 0}</span>
                      <span className="text-base-content/50">beds</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-xs text-base-content/70">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      {ward.floorLocation || 'Main Wing'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge badge-sm font-semibold capitalize ${getStatusBadgeClass(ward.status)}`}>
                      {ward.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditWard(ward)}
                        className="btn btn-ghost btn-xs rounded-lg text-primary hover:bg-primary/10"
                        title="Edit Ward"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWard(ward)}
                        disabled={deletingId === ward.id}
                        className="btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10"
                        title="Delete Ward"
                      >
                        {deletingId === ward.id ? (
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

      {/* Add Ward Modal */}
      <AddWardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWardAdded={() => {
          setIsAddModalOpen(false);
          fetchWards();
        }}
      />

      {/* Edit Ward Modal */}
      {selectedWard && (
        <EditWardModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedWard(null);
            fetchWards();
          }}
          onWardUpdate={selectedWard}
        />
      )}
    </div>
  );
};

export default WardsTab;
