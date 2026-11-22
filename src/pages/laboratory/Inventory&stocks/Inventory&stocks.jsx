import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createLaboratoryInventory,
  getLaboratoryInventories,
  restockLaboratoryInventory,
  updateLaboratoryInventory,
} from '@/services/api/labInventoryApi';
import LaboratoryLayout from '@/layouts/laboratory';
import KolakLoader from '@/components/common/KolakLoader';
import {
  FaFlask,
  FaBoxes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCalendarTimes,
  FaPlus,
  FaDownload,
  FaSearch,
  FaTimes,
  FaEdit,
  FaUndo,
} from 'react-icons/fa';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const LaboratoryInventoryStocks = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [restockingFor, setRestockingFor] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getLaboratoryInventories();
      const list = Array.isArray(res?.data) ? res.data : (res?.data ?? []);
      setItems(list);
    } catch (err) {
      console.error('LaboratoryInventoryStocks: fetch error', err);
      toast.error('Failed to load laboratory inventory');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Compute stats
  const totalItems = items.length;
  const inStockCount = items.filter((i) => Number(i.stock || 0) > 0).length;
  const outOfStockCount = items.filter((i) => Number(i.stock || 0) === 0).length;
  const lowStockCount = items.filter(
    (i) => Number(i.stock || 0) > 0 && Number(i.stock || 0) <= Number(i.reorderLevel || 0)
  ).length;

  const expiringSoonCount = items.filter((i) => {
    if (!i.expiryDate) return false;
    const d = new Date(i.expiryDate);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 90 && diff >= 0;
  }).length;

  const expiredCount = items.filter((i) => {
    if (!i.expiryDate) return false;
    const d = new Date(i.expiryDate);
    return d.getTime() < Date.now();
  }).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter(
      (i) =>
        !q ||
        (i.name || '').toLowerCase().includes(q) ||
        (i.strength || '').toLowerCase().includes(q) ||
        (i.form || '').toLowerCase().includes(q) ||
        (i.supplier || '').toLowerCase().includes(q)
    );

    if (activeTab === 'in-stock') list = list.filter((i) => Number(i.stock || 0) > 0);
    if (activeTab === 'low')
      list = list.filter(
        (i) => Number(i.stock || 0) > 0 && Number(i.stock || 0) <= Number(i.reorderLevel || 0)
      );
    if (activeTab === 'out') list = list.filter((i) => Number(i.stock || 0) === 0);
    if (activeTab === 'expiring') {
      list = list.filter((i) => {
        if (!i.expiryDate) return false;
        const d = new Date(i.expiryDate);
        const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff <= 90 && diff >= 0;
      });
    }
    if (activeTab === 'expired') {
      list = list.filter((i) => {
        if (!i.expiryDate) return false;
        const d = new Date(i.expiryDate);
        return d.getTime() < Date.now();
      });
    }
    if (activeTab === 'recent') {
      list = list
        .slice()
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    }

    return list;
  }, [items, search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const exportCsv = (list) => {
    try {
      const headers = ['ID', 'Item Name', 'Form', 'Strength', 'Stock', 'Reorder Level', 'Selling Price (NGN)', 'Supplier', 'Expiry Date'];
      const rows = list.map((i) => [
        i._id || i.id,
        i.name,
        i.form || 'N/A',
        i.strength || 'N/A',
        i.stock ?? 0,
        i.reorderLevel ?? 0,
        i.sellingPrice ?? 0,
        i.supplier || 'N/A',
        i.expiryDate ? formatNigeriaDate(i.expiryDate) : 'N/A',
      ]);

      const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\r\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kolak_Lab_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Inventory exported successfully!');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const lowStock = (i) =>
    Number(i.stock || 0) === 0
      ? 'out'
      : Number(i.stock || 0) <= Number(i.reorderLevel || 0)
      ? 'low'
      : 'ok';

  const handleAdd = async (payload) => {
    const p = createLaboratoryInventory(payload);
    toast.promise(p, { loading: 'Creating item...', success: 'Supply item created', error: 'Failed creating item' });
    try {
      await p;
      fetchItems(true);
      setShowAdd(false);
    } catch (e) {
      console.error('Error creating inventory:', e);
    }
  };

  const handleEdit = async (id, payload) => {
    const p = updateLaboratoryInventory(id, payload);
    toast.promise(p, { loading: 'Updating item...', success: 'Supply item updated', error: 'Failed updating item' });
    try {
      await p;
      fetchItems(true);
      setEditing(null);
    } catch (e) {
      console.error('Error updating inventory:', e);
    }
  };

  const handleRestock = async (id, payload) => {
    const p = restockLaboratoryInventory(id, payload);
    toast.promise(p, { loading: 'Restocking supply...', success: 'Restocked successfully', error: 'Failed to restock' });
    try {
      await p;
      fetchItems(true);
      setRestockingFor(null);
    } catch (e) {
      console.error('Error restocking inventory:', e);
    }
  };

  return (
    <LaboratoryLayout>
      {loading && items.length === 0 && (
        <KolakLoader fullscreen text="Loading laboratory supplies..." />
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight flex items-center gap-2.5">
              <FaBoxes className="w-7 h-7 text-primary" />
              Laboratory Inventory & Supplies
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              Manage clinical reagents, test kits, blood containers, and laboratory equipment supplies.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportCsv(filtered)}
              className="btn btn-outline btn-primary btn-sm gap-2 shadow-sm"
              title="Export supplies to CSV"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchItems(true)}
              className="btn btn-ghost btn-square btn-sm"
              title="Refresh Data"
            >
              <FaUndo className="w-3.5 h-3.5 text-base-content/70" />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="btn btn-primary btn-sm gap-2 shadow-sm font-semibold"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>Add Supply Item</span>
            </button>
          </div>
        </div>

        {/* 5 Interactive KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'all'
                ? 'bg-primary/10 border-primary shadow-sm'
                : 'bg-base-100 border-base-200 hover:border-base-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Total Items</span>
              <FaBoxes className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-base-content mt-2">{totalItems}</h3>
            <p className="text-xs text-base-content/50 mt-0.5">Catalogued</p>
          </div>

          <div
            onClick={() => { setActiveTab('in-stock'); setCurrentPage(1); }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'in-stock'
                ? 'bg-success/15 border-success shadow-sm'
                : 'bg-base-100 border-base-200 hover:border-base-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">In Stock</span>
              <FaCheckCircle className="w-4 h-4 text-success" />
            </div>
            <h3 className="text-2xl font-black text-success mt-2">{inStockCount}</h3>
            <p className="text-xs text-success/80 mt-0.5">
              {totalItems ? Math.round((inStockCount / totalItems) * 100) : 0}% available
            </p>
          </div>

          <div
            onClick={() => { setActiveTab('low'); setCurrentPage(1); }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'low'
                ? 'bg-warning/15 border-warning shadow-sm'
                : 'bg-base-100 border-base-200 hover:border-base-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Low Stock</span>
              <FaExclamationTriangle className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-2xl font-black text-warning mt-2">{lowStockCount}</h3>
            <p className="text-xs text-warning/80 mt-0.5">Needs reordering</p>
          </div>

          <div
            onClick={() => { setActiveTab('expiring'); setCurrentPage(1); }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'expiring'
                ? 'bg-error/15 border-error shadow-sm'
                : 'bg-base-100 border-base-200 hover:border-base-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Expiring Soon</span>
              <FaCalendarTimes className="w-4 h-4 text-error" />
            </div>
            <h3 className="text-2xl font-black text-error mt-2">{expiringSoonCount}</h3>
            <p className="text-xs text-error/80 mt-0.5">Within 90 days</p>
          </div>

          <div
            onClick={() => { setActiveTab('expired'); setCurrentPage(1); }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all ${
              activeTab === 'expired'
                ? 'bg-error/20 border-error shadow-sm'
                : 'bg-base-100 border-base-200 hover:border-base-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Expired</span>
              <FaTimesCircle className="w-4 h-4 text-error" />
            </div>
            <h3 className="text-2xl font-black text-error mt-2">{expiredCount}</h3>
            <p className="text-xs text-error/80 mt-0.5">Action required</p>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-base-100 rounded-2xl p-4 border border-base-200 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Tab Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `All Supplies (${totalItems})` },
                { id: 'in-stock', label: `In Stock (${inStockCount})` },
                { id: 'low', label: `Low Stock (${lowStockCount})` },
                { id: 'out', label: `Out of Stock (${outOfStockCount})` },
                { id: 'expiring', label: `Expiring Soon (${expiringSoonCount})` },
                { id: 'expired', label: `Expired (${expiredCount})` },
                { id: 'recent', label: 'Recent Activity' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`btn btn-xs rounded-full px-3 transition-all ${
                    activeTab === tab.id
                      ? 'btn-primary font-bold shadow-xs'
                      : 'btn-ghost text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Clear Filters */}
            {(search || activeTab !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
                className="btn btn-ghost btn-xs text-error gap-1 self-start lg:self-auto"
              >
                <FaUndo className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            )}
          </div>

          {/* Search Row */}
          <div className="pt-3 border-t border-base-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search reagents, supplies, form, or supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="text-xs text-base-content/60">
              Showing <strong className="text-primary font-bold">{filtered.length}</strong> of{' '}
              {totalItems} supply items
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
            <table className="table table-zebra w-full text-xs">
              <thead className="bg-base-200/90 backdrop-blur-xs sticky top-0 z-10 uppercase text-base-content/70">
                <tr>
                  <th>Supply Item</th>
                  <th>Form / Strength</th>
                  <th>Stock Level</th>
                  <th>Reorder Level</th>
                  <th>Price</th>
                  <th>Supplier</th>
                  <th>Expiry Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  const status = lowStock(item);
                  const isExpiring = (() => {
                    if (!item.expiryDate) return false;
                    const d = new Date(item.expiryDate);
                    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                    return diff <= 90 && diff >= 0;
                  })();
                  const isExpired = item.expiryDate && new Date(item.expiryDate).getTime() < Date.now();

                  return (
                    <tr key={item._id} className="hover:bg-base-200/40">
                      <td>
                        <span className="font-bold text-sm text-base-content block">{item.name}</span>
                      </td>
                      <td className="text-base-content/70">
                        {item.form || '—'} {item.strength ? `· ${item.strength}` : ''}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-base-content">{item.stock ?? 0}</span>
                          <span
                            className={`badge badge-xs font-semibold ${
                              status === 'out'
                                ? 'badge-error'
                                : status === 'low'
                                ? 'badge-warning'
                                : 'badge-success'
                            }`}
                          >
                            {status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="text-base-content/70 font-mono">{item.reorderLevel ?? 0}</td>
                      <td>
                        <span className="font-bold text-primary">
                          {item.sellingPrice ? `₦${Number(item.sellingPrice).toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="text-base-content/70">{item.supplier || '—'}</td>
                      <td>
                        {item.expiryDate ? (
                          <span
                            className={`badge badge-xs font-semibold ${
                              isExpired
                                ? 'badge-error'
                                : isExpiring
                                ? 'badge-warning'
                                : 'badge-ghost'
                            }`}
                          >
                            {formatNigeriaDate(item.expiryDate)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setRestockingFor(item)}
                            className="btn btn-xs btn-primary gap-1 font-bold shadow-2xs"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => setEditing(item)}
                            className="btn btn-xs btn-ghost text-info"
                            title="Edit Supply"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageItems.length === 0 && (
            <div className="text-center py-16 bg-base-100">
              <FaBoxes className="w-12 h-12 mx-auto text-base-content/20 mb-3" />
              <h3 className="font-bold text-base text-base-content">No supplies found</h3>
              <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
                No items match your active tab or search query.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-base-200 gap-3 text-xs">
              <span className="text-base-content/60">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
                {filtered.length} supplies
              </span>
              <div className="join">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="join-item btn btn-xs btn-outline"
                >
                  «
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`join-item btn btn-xs ${
                      currentPage === i + 1 ? 'btn-primary font-bold' : 'btn-ghost'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="join-item btn btn-xs btn-outline"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAdd && (
          <InventoryFormModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
        )}

        {editing && (
          <InventoryFormModal
            item={editing}
            onClose={() => setEditing(null)}
            onSubmit={(payload) => handleEdit(editing._id, payload)}
          />
        )}

        {restockingFor && (
          <RestockModal
            item={restockingFor}
            onClose={() => setRestockingFor(null)}
            onSubmit={(payload) => handleRestock(restockingFor._id, payload)}
          />
        )}
      </div>
    </LaboratoryLayout>
  );
};

export default LaboratoryInventoryStocks;

function InventoryFormModal({ item, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    form: item?.form || '',
    strength: item?.strength || '',
    costPrice: item?.costPrice || '',
    sellingPrice: item?.sellingPrice || '',
    reorderLevel: item?.reorderLevel || 0,
    supplier: item?.supplier || '',
    expiryDate: item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handle = async () => {
    if (!form.name) return toast.error('Supply name is required');
    if (!form.sellingPrice) return toast.error('Selling price is required');
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg card bg-base-100 p-5 rounded-2xl shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-base-200">
          <h3 className="font-bold text-lg text-base-content">
            {item?._id ? 'Edit Supply Item' : 'Add New Supply Item'}
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-base-content/70">Item Name</label>
            <input
              className="input input-sm input-bordered w-full mt-1"
              placeholder="e.g. EDTA Blood Tubes (5ml)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-base-content/70">Form / Type</label>
              <input
                className="input input-sm input-bordered w-full mt-1"
                placeholder="e.g. Reagent / Tube"
                value={form.form}
                onChange={(e) => setForm({ ...form, form: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-content/70">Strength / Pack Size</label>
              <input
                className="input input-sm input-bordered w-full mt-1"
                placeholder="e.g. 100 pcs / 500ml"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-base-content/70">Cost Price (₦)</label>
              <input
                type="number"
                className="input input-sm input-bordered w-full mt-1"
                placeholder="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-content/70">Selling Price (₦)</label>
              <input
                type="number"
                className="input input-sm input-bordered w-full mt-1"
                placeholder="0"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-base-content/70">Reorder Level</label>
              <input
                type="number"
                className="input input-sm input-bordered w-full mt-1"
                placeholder="10"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-content/70">Expiry Date</label>
              <input
                type="date"
                className="input input-sm input-bordered w-full mt-1"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-base-content/70">Supplier Name</label>
            <input
              className="input input-sm input-bordered w-full mt-1"
              placeholder="e.g. Roche Diagnostics"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handle} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Supply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestockModal({ item, onClose, onSubmit }) {
  const [qty, setQty] = useState('');
  const [batch, setBatch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handle = async () => {
    if (!qty || Number(qty) <= 0) return toast.error('Enter a valid restock quantity');
    setSubmitting(true);
    try {
      await onSubmit({ quantity: Number(qty), batchNumber: batch });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md card bg-base-100 p-5 rounded-2xl shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-base-200">
          <div>
            <h3 className="font-bold text-lg text-base-content">Restock Supply</h3>
            <p className="text-xs text-base-content/60">{item.name}</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-base-content/70">Quantity to Add</label>
            <input
              type="number"
              className="input input-sm input-bordered w-full mt-1"
              placeholder="e.g. 50"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-base-content/70">Batch Number (Optional)</label>
            <input
              className="input input-sm input-bordered w-full mt-1"
              placeholder="e.g. BATCH-2026-X"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handle} disabled={submitting}>
              {submitting ? 'Restocking...' : 'Confirm Restock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
