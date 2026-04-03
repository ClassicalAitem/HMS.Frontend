import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';

const SelectServiceChargeModal = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getServiceCharges();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (mounted) setServices(list);
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to load service charges';
        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!selected) return;
    const basePrice = Number(selected?.amount || 0) || 0;
    setPrice(basePrice);
    const derivedCode = String(selected?.category || '').trim().toLowerCase().replace(/\s+/g, '_') || String(selected?.id || selected?._id || '').toLowerCase();
    setCode(derivedCode);
    setDescription(String(selected?.service || selected?.name || ''));
    setQty(1);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = Array.isArray(services) ? services : [];
    if (!q) return base;
    return base.filter(s => (
      [s?.service, s?.name, s?.category, s?.amount, s?.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    ));
  }, [services, query]);

  const total = useMemo(() => {
    const p = Number(price) || 0;
    const q = Math.max(1, Number(qty) || 1);
    return p * q;
  }, [price, qty]);

  const reset = () => {
    setSelected(null);
    setQty(1);
    setPrice(0);
    setCode('');
    setDescription('');
    setQuery('');
  };

  const handleAdd = () => {
    try {
      const q = Math.max(1, Number(qty) || 1);
      const p = Number(price) || 0;
      if (!description) return toast.error('Description is required');
      if (!code) return toast.error('Code is required');
      if (q < 1) return toast.error('Quantity must be at least 1');
      if (p < 0) return toast.error('Price cannot be negative');
      const item = { code, description, quantity: q, price: p, total: q * p };
      if (typeof onAddItem === 'function') onAddItem(item);
      reset();
      onClose && onClose();
    } catch (e) {
      // noop
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => { reset(); onClose && onClose(); }} />
      <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Select Service Charge</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => { reset(); onClose && onClose(); }}>Close</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm text-base-content/70">Search services</label>
              <input
                className="input input-bordered w-full"
                placeholder="Search by name, category, amount"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="mt-3 overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                <div className="overflow-auto max-h-64 p-2">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton h-8 w-full mb-2" />
                    ))
                  ) : error ? (
                    <div className="p-3 text-error text-sm">{error}</div>
                  ) : filtered.length === 0 ? (
                    <div className="p-3 text-base-content/70 text-sm">No services found</div>
                  ) : (
                    filtered.map((s) => (
                      <button
                        key={s?.id || s?._id}
                        className={`w-full text-left p-2 rounded ${selected === s ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`}
                        onClick={() => setSelected(s)}
                        type="button"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`font-medium text-base-content ${selected === s ? 'text-primary-content' : ''}`}>{s?.service || s?.name || 'Untitled'}</div>
                            <div className={`text-xs ${selected === s ? 'text-primary-content/80' : 'text-base-content/70'}`}>{s?.category || '—'}</div>
                          </div>
                          <div className={`text-sm font-medium ${selected === s ? 'text-primary-content' : ''}`}>₦{Number(s?.amount || 0).toLocaleString()}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm text-base-content/70">Item details</label>
              <div className="space-y-3">
                <input className="input input-bordered w-full" placeholder="Code" value={code} readOnly />
                <input className="input input-bordered w-full" placeholder="Description" value={description} readOnly />
                <div className="grid grid-cols-3 gap-3">
                  <input className="input input-bordered w-full" type="number" placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
                  <input className="input input-bordered w-full" type="number" placeholder="Price" value={price} readOnly />
                  <input className="input input-bordered w-full" type="number" placeholder="Total" value={total} readOnly />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button className="btn" onClick={() => { reset(); onClose && onClose(); }}>Cancel</button>
                <button className="btn btn-success" onClick={handleAdd}>Add Item</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectServiceChargeModal;