import React, { useState } from 'react';
import toast from 'react-hot-toast';

const UNIT_LABELS = {
  tablet: 'Tablet',
  ml: 'ml',
  iu: 'IU',
  ampoule: 'Ampoule',
};

export function InventoryFormModal({ item, onClose, onSubmit }) {
  const isEdit = !!item?._id;
  const [form, setForm] = useState({
    name: item?.name || '',
    form: item?.form || '',
    strength: item?.strength || '',
    costPrice: item?.costPrice ?? '',
    sellingPrice: item?.sellingPrice ?? '',
    reorderLevel: item?.reorderLevel ?? '',
    supplier: item?.supplier || '',
    packs: '',
    packSize: item?.packSize ?? 1,
    unit: item?.unit || 'tablet',
    concentrationAmount: item?.concentrationAmount || '',
    concentrationPer: item?.concentrationPer || '',
    concentrationUnit: ['ml', 'tablet', 'ampoule', 'iu', 'tube', 'unit'].includes(item?.concentrationUnit) ? 'mg' : (item?.concentrationUnit || 'mg'),
    batchNumber: item?.batchNumber || '',
    expiryDate: item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
    description: item?.description || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const safeString = (value) => String(value || '').trim();
  const safeNumber = (value) => {
    const str = String(value ?? '').trim();
    return str === '' ? undefined : Number(str);
  };

  const handle = async () => {
    if (!form.name.trim()) return toast.error('Item name is required');
    if (!form.form) return toast.error('Please select a form (Tablet, Syrup, Injection, Cream, Gutt, or Infusion)');
    if (!form.batchNumber.trim()) return toast.error('Batch number is required');
    if (!isEdit && (!form.packs || Number(form.packs) <= 0)) {
      return toast.error(form.unit === 'tablet' ? 'Enter number of tablets' : 'Enter number of bottles/vials');
    }

    const payload = { name: safeString(form.name) };

    const formValue = safeString(form.form);
    const strengthValue = safeString(form.strength);
    const costPriceValue = safeNumber(form.costPrice);
    const sellingPriceValue = safeNumber(form.sellingPrice);
    const reorderLevelValue = safeNumber(form.reorderLevel);
    const supplierValue = safeString(form.supplier);
    const batchNumberValue = safeString(form.batchNumber);
    const expiryDateValue = safeString(form.expiryDate);
    const descriptionValue = safeString(form.description);
    const packSizeValue = safeNumber(form.packSize) || 1;

    payload.packSize = packSizeValue;
    payload.unit = form.unit;
    payload.concentrationUnit = form.concentrationUnit;
    if (safeNumber(form.concentrationAmount) !== undefined) payload.concentrationAmount = safeNumber(form.concentrationAmount);
    if (safeNumber(form.concentrationPer) !== undefined) payload.concentrationPer = safeNumber(form.concentrationPer);

    // Only creating a new item sets initial stock (via packs). Editing an
    // existing item never touches stock — that's what Restock is for.
    if (!isEdit) {
      payload.packs = safeNumber(form.packs);
    }

    if (formValue) payload.form = formValue;
    if (strengthValue) payload.strength = strengthValue;
    if (costPriceValue !== undefined) payload.costPrice = costPriceValue;
    if (sellingPriceValue !== undefined) payload.sellingPrice = sellingPriceValue;
    if (reorderLevelValue !== undefined) payload.reorderLevel = reorderLevelValue;
    if (supplierValue) payload.supplier = supplierValue;
    if (batchNumberValue) payload.batchNumber = batchNumberValue;
    if (expiryDateValue) payload.expiryDate = expiryDateValue;
    if (descriptionValue) payload.description = descriptionValue;

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="z-10 w-full max-w-lg card bg-base-100 p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{isEdit ? 'Edit Item' : 'Add Item'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
            <div className="flex gap-2">
              <input className="input input-bordered flex-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select
                className="select select-bordered flex-1"
                value={form.form}
                onChange={(e) => {
                  const nextForm = e.target.value;
                  const nextUnit = nextForm === 'Tablet' ? 'tablet' : nextForm === 'Cream' ? 'tube' : nextForm === 'Gutt' || nextForm === 'Infusion' ? 'ml' : nextForm === 'Syrup' ? 'ml' : nextForm === 'Injection' ? (form.unit === 'tablet' || form.unit === 'tube' ? 'ml' : form.unit) : form.unit;
                  setForm({ ...form, form: nextForm, unit: nextUnit });
                }}
              >
                <option value="">Select form</option>
                <option value="Tablet">Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="Gutt">Gutt</option>
                <option value="Cream">Cream</option>
                <option value="Infusion">Infusion</option>
                <option value="Injection">Injection</option>
                <option value="Suspension">Suspension</option>
              </select>
            </div> 

          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Strength" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
            <select className="select select-bordered flex-1" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="tablet">Tablet (counted individually)</option>
                <option value="tube">Tube (counted individually)</option>
                <option value="ml">Liquid — ml (syrup, injection)</option>
                <option value="iu">IU (injection)</option>
                <option value="ampoule">Ampoule (injection, counted individually)</option>
              </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">
                {form.unit === 'ampoule' ? 'Pack size — ampoules per pack' : form.unit === 'tablet' ? 'Pack size — tablets per pack (usually 1)' : form.unit === 'tube' ? 'Pack size — tubes per pack (usually 1)' : 'Pack size — volume of ONE bottle/vial'}
              </label>
              <input className="input input-bordered w-full" placeholder={form.unit === 'tablet' || form.unit === 'tube' ? 'e.g. 1' : 'e.g. 75 = 75ml bottle'} value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">Concentration (optional, for mg dosing)</label>
              <div className="flex items-center gap-1">
                <input className="input input-bordered input-sm flex-1" placeholder="Amount e.g. 500" value={form.concentrationAmount} onChange={(e) => setForm({ ...form, concentrationAmount: e.target.value })} />
                <select className="select select-bordered select-sm w-20 px-1" value={form.concentrationUnit || 'mg'} onChange={(e) => setForm({ ...form, concentrationUnit: e.target.value })}>
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="mcg">mcg</option>
                </select>
                <span className="text-xs whitespace-nowrap">per</span>
                <input className="input input-bordered input-sm w-16" placeholder="1" value={form.concentrationPer} onChange={(e) => setForm({ ...form, concentrationPer: e.target.value })} />
                <span className="text-xs">{form.unit}</span>
              </div>
            </div>
          </div>

          {isEdit ? (
            <div className="text-xs text-base-content/60 bg-base-200/50 rounded px-3 py-2">
              Current stock: <span className="font-medium">{item.stock ?? 0} {UNIT_LABELS[form.unit] || 'tablet'}</span>
              {' '}— to change stock, use <span className="font-medium">Restock</span> instead.
            </div>
          ) : (
            <div>
              <label className="text-xs text-base-content/60 block mb-1">
                {form.unit === 'tablet' ? 'Number of tablets' : form.unit === 'tube' ? 'Number of tubes' : form.unit === 'ampoule' ? 'Number of ampoules' : `Number of ${form.unit === 'ml' ? 'bottles/vials' : 'packs'}`}
              </label>
              <input className="input input-bordered w-full" placeholder="e.g. 10" value={form.packs} onChange={(e) => setForm({ ...form, packs: e.target.value })} />
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">Cost Price (per pack)</label>
              <input className="input input-bordered w-full" placeholder="Cost Price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">Selling Price (per pack)</label>
              <input className="input input-bordered w-full" placeholder="Selling Price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Reorder Level" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            <input className="input input-bordered flex-1" placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>

          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Batch Number" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
            <input className="input input-bordered flex-1" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </div>

          <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
