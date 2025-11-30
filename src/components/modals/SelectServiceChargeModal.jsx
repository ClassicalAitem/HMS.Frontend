import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';

const SelectServiceChargeModal = ({ isOpen, onClose, onAddItem }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getServiceCharges();
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (mounted) setServices(list);
      } catch (e) {
        setError(e);
        toast.error(e?.response?.data?.message || 'Failed to load service charges');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!selected) return;
    const derivedCode = String(selected?.category || '').trim();
    const derivedDescription = String(selected?.service || '').trim();
    const derivedPrice = Number(selected?.amount) || 0;
    setCode(derivedCode);
    setDescription(derivedDescription);
    setPrice(derivedPrice);
    setQuantity(1);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => (
      String(s?.service || '').toLowerCase().includes(q) ||
      String(s?.category || '').toLowerCase().includes(q)
    ));
  }, [services, query]);

  if (!isOpen) return null;

  const handleAdd = () => {
    const qty = Number(quantity) || 0;
    const unitPrice = Number(price);
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (qty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    if (unitPrice < 0) {
      toast.error('Price cannot be negative');
      return;
    }
    onAddItem({
      code: code?.trim() || String(selected?.category || '').trim(),
      description: description.trim(),
      quantity: qty,
      price: unitPrice,
    });
    onClose();
    setSelected(null);
    setCode('');
    setDescription('');
    setQuantity(1);
    setPrice(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Add Billable Item</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="input input-bordered w-full"
                placeholder="Search services by name or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="rounded-lg border border-base-300">
              <div className="max-h-48 overflow-y-auto divide-y divide-base-300">
                {loading ? (
                  <div className="p-3 text-sm text-base-content/70">Loading services…</div>
                ) : error ? (
                  <div className="p-3 text-sm text-error">Failed to load services. You can enter item manually below.</div>
                ) : filtered.length === 0 ? (
                  <div className="p-3 text-sm text-base-content/70">No services match your search.</div>
                ) : (
                  filtered.map((s) => (
                    <button
                      key={s?.id || `${s?.service}-${s?.category}-${s?.amount}`}
                      className={`flex w-full justify-between items-center p-3 text-left hover:bg-base-200 ${selected === s ? 'bg-base-200' : ''}`}
                      onClick={() => setSelected(s)}
                    >
                      <div>
                        <div className="font-medium text-base-content">{s?.service || '—'}</div>
                        <div className="text-xs text-base-content/70">Category: {s?.category || '—'}</div>
                      </div>
                      <div className="text-sm font-medium">₦{Number(s?.amount || 0).toLocaleString()}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input input-bordered w-full"
                placeholder="Code (from category)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                className="input input-bordered w-full"
                type="number"
                min={1}
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <input
                className="input input-bordered w-full"
                type="number"
                min={0}
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn btn-success" onClick={handleAdd}>Add Item</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectServiceChargeModal;
