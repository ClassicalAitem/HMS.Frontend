import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { updateAnteNatalDelivery } from '@/services/api/anteNatalAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import {
  isPostnatalWindowActive,
  POSTNATAL_VALIDITY_MS,
} from '@/utils/postnatalWindow';

const toLocalDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const getDeliveryForm = (delivery) => ({
  deliveryAt: toLocalDateTimeInput(delivery?.deliveryAt),
  outcome: delivery?.outcome || '',
  maternalOutcome: delivery?.maternalOutcome || '',
  babyCount: delivery?.babyCount ? String(delivery.babyCount) : '1',
  notes: delivery?.notes || '',
});

const PostnatalWorkflowPanel = ({ patientId, record: initialRecord }) => {
  const recordId = initialRecord?._id || initialRecord?.id;
  const [record, setRecord] = useState(initialRecord);
  const [form, setForm] = useState(() => getDeliveryForm(initialRecord?.delivery));
  const [isEditing, setIsEditing] = useState(!initialRecord?.delivery);
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setRecord(initialRecord);
    setForm(getDeliveryForm(initialRecord?.delivery));
    setIsEditing(!initialRecord?.delivery);
  }, [recordId, initialRecord]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const delivery = record?.delivery;
  const deliveryAt = delivery?.deliveryAt ? new Date(delivery.deliveryAt) : null;
  const postnatalExpiry = deliveryAt && !Number.isNaN(deliveryAt.getTime())
    ? new Date(deliveryAt.getTime() + POSTNATAL_VALIDITY_MS)
    : null;
  const isPostnatalActive = isPostnatalWindowActive(deliveryAt, now);

  const handleSaveDelivery = async (event) => {
    event.preventDefault();
    if (!patientId || !recordId) {
      toast.error('This antenatal record is missing its stable record ID');
      return;
    }

    const babyCount = Number(form.babyCount);
    if (!form.deliveryAt || !form.outcome.trim() || !form.maternalOutcome.trim() ||
      !Number.isInteger(babyCount) || babyCount < 1) {
      toast.error('Enter the delivery time, outcome, maternal outcome, and a valid baby count');
      return;
    }

    const deliveryTime = new Date(form.deliveryAt);
    if (Number.isNaN(deliveryTime.getTime()) || deliveryTime.getTime() > Date.now()) {
      toast.error('Delivery date and time must be valid and cannot be in the future');
      return;
    }

    setIsSaving(true);
    try {
      const savedRecord = await updateAnteNatalDelivery(patientId, recordId, {
        deliveryAt: deliveryTime.toISOString(),
        outcome: form.outcome.trim(),
        maternalOutcome: form.maternalOutcome.trim(),
        babyCount,
        notes: form.notes.trim(),
      });
      if (!savedRecord?.delivery) {
        throw new Error('The server did not return the saved delivery details');
      }
      setRecord(savedRecord);
      setForm(getDeliveryForm(savedRecord.delivery));
      setIsEditing(false);
      toast.success('Delivery details saved');
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || error.message || 'Failed to save delivery details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card border border-primary/20 bg-primary/5 shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-base-content">Delivery & Postnatal Care</h4>
            <p className="text-sm text-base-content/70">
              Record the actual delivery time and outcomes for this pregnancy.
            </p>
          </div>
          {delivery && !isEditing && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
              Edit delivery details
            </button>
          )}
        </div>

        {delivery && (
          <div className="grid gap-3 rounded-lg bg-base-100 p-3 text-sm sm:grid-cols-2">
            <div><span className="text-base-content/60">Delivered:</span> <strong>{formatNigeriaDateTime(delivery.deliveryAt)}</strong></div>
            <div><span className="text-base-content/60">Babies:</span> <strong>{delivery.babyCount}</strong></div>
            <div><span className="text-base-content/60">Delivery outcome:</span> <strong>{delivery.outcome}</strong></div>
            <div><span className="text-base-content/60">Maternal outcome:</span> <strong>{delivery.maternalOutcome}</strong></div>
            {delivery.notes && <div className="sm:col-span-2"><span className="text-base-content/60">Notes:</span> {delivery.notes}</div>}
            {(delivery.recordedByName || delivery.recordedByRole) && (
              <div className="sm:col-span-2">
                <span className="text-base-content/60">Originally recorded by:</span>{' '}
                <strong>{delivery.recordedByName || 'Medical Staff'}</strong>
                {delivery.recordedByRole && ` (${String(delivery.recordedByRole).replace(/-/g, ' ')})`}
              </div>
            )}
            {delivery.updatedByName && delivery.updatedByName !== delivery.recordedByName && (
              <div className="sm:col-span-2">
                <span className="text-base-content/60">Last updated by:</span>{' '}
                <strong>{delivery.updatedByName}</strong>
                {delivery.updatedByRole && ` (${String(delivery.updatedByRole).replace(/-/g, ' ')})`}
              </div>
            )}
            {postnatalExpiry && (
              <div className="sm:col-span-2">
                <span className="text-base-content/60">Postnatal period ends:</span>{' '}
                <strong>{formatNigeriaDateTime(postnatalExpiry)}</strong>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleSaveDelivery} className="grid gap-3 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-1">Delivery date and time</span>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={form.deliveryAt}
                onChange={(event) => setForm((current) => ({ ...current, deliveryAt: event.target.value }))}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Number of babies</span>
              <input
                type="number"
                min="1"
                step="1"
                className="input input-bordered"
                value={form.babyCount}
                onChange={(event) => setForm((current) => ({ ...current, babyCount: event.target.value }))}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Delivery outcome</span>
              <textarea
                className="textarea textarea-bordered"
                value={form.outcome}
                onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))}
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Maternal outcome</span>
              <textarea
                className="textarea textarea-bordered"
                value={form.maternalOutcome}
                onChange={(event) => setForm((current) => ({ ...current, maternalOutcome: event.target.value }))}
                required
              />
            </label>
            <label className="form-control sm:col-span-2">
              <span className="label-text mb-1">Additional notes</span>
              <textarea
                className="textarea textarea-bordered"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              {delivery && (
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : delivery ? 'Update Delivery' : 'Record Delivery'}
              </button>
            </div>
          </form>
        )}

        {delivery && !isEditing && (
          <p className={`text-sm ${isPostnatalActive ? 'text-success' : 'text-base-content/70'}`}>
            {isPostnatalActive
              ? 'Postnatal consultations are available until the recorded expiry time.'
              : 'The 41-day postnatal period has ended.'}
          </p>
        )}
      </div>
    </section>
  );
};

export default PostnatalWorkflowPanel;
