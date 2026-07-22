import React, { useEffect, useState } from 'react';
import { FaHospital, FaTimes } from 'react-icons/fa';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import toast from 'react-hot-toast';

const AdmissionModal = ({
  isOpen,
  onClose,
  onAdmissionCreated,
  patientId,
  consultationId,
  dependantId,
}) => {
  const [serviceCharges, setServiceCharges] = useState([]);
  const [selectedAdmissions, setSelectedAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Get a unique identifier for a service charge.
   *
   * Prefer _id, then id.
   *
   * The index is intentionally not used here because the index
   * can change when the list changes.
   */
  const getAdmissionId = (item) => {
    return item?._id || item?.id;
  };

  /**
   * Load admission service charges
   */
  useEffect(() => {
    if (!isOpen) return;

    const loadAdmissionCharges = async () => {
      setLoading(true);

      try {
        const response = await getServiceCharges();

        const rawData = response?.data ?? response;

        const admissions = Array.isArray(rawData)
          ? rawData.filter(
              (item) => item?.category?.toLowerCase() === 'admission',
            )
          : [];

        console.log('Admission Charges:', admissions);

        setServiceCharges(admissions);
      } catch (error) {
        console.error('Failed to load admission service charges', error);

        toast.error('Failed to load admission charges');
      } finally {
        setLoading(false);
      }
    };

    loadAdmissionCharges();
  }, [isOpen]);

  /**
   * Toggle one admission service only
   */
  const toggleAdmission = (admission) => {
    const admissionId = getAdmissionId(admission);

    if (!admissionId) {
      console.error('Admission service has no _id or id:', admission);

      toast.error('This admission service does not have a valid ID');

      return;
    }

    setSelectedAdmissions((prev) => {
      const alreadySelected = prev.some(
        (item) => getAdmissionId(item) === admissionId,
      );

      if (alreadySelected) {
        return prev.filter((item) => getAdmissionId(item) !== admissionId);
      }

      return [...prev, admission];
    });
  };

  /**
   * Check whether one admission is selected
   */
  const isAdmissionSelected = (service) => {
    const serviceId = getAdmissionId(service);

    return selectedAdmissions.some(
      (item) => getAdmissionId(item) === serviceId,
    );
  };

  /**
   * Submit selected admissions
   */
  const handleSubmit = async () => {
    if (selectedAdmissions.length === 0) {
      toast.error('Please select at least one admission service');

      return;
    }

    setSaving(true);

    try {
      const payload = {
        patientId,
        consultationId,
        dependantId: dependantId || null,

        admissions: selectedAdmissions.map((item) => ({
          serviceChargeId: item._id || item.id,

          name: item.service,

          amount: item.amount,

          category: item.category,

          admissionCovered: item.admissionCovered || [],
        })),

        status: 'active',
      };

      console.log('Admission Payload:', payload);

      /**
       * Replace this with your actual API call:
       *
       * await createAdmission(payload);
       */

      onAdmissionCreated?.(payload);

      toast.success('Admission created successfully');

      setSelectedAdmissions([]);

      onClose();
    } catch (error) {
      console.error('Failed to create admission', error);

      toast.error(
        error?.response?.data?.message || 'Failed to create admission',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Reset selection when closing the modal
   */
  const handleClose = () => {
    if (saving) return;

    setSelectedAdmissions([]);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-base-100 shadow-xl">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-base-200 p-5">
          <div className="flex items-center gap-3">
            <FaHospital className="text-xl text-primary" />

            <div>
              <h2 className="text-lg font-bold">Admit Patient</h2>

              <p className="text-sm text-base-content/60">
                Select admission services
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={handleClose}
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : serviceCharges.length === 0 ? (
            <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
              <p className="text-sm text-base-content/60">
                No admission service charges found.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {serviceCharges.map((service) => {
                const isSelected = isAdmissionSelected(service);

                const serviceId = getAdmissionId(service);

                return (
                  <div
                    key={serviceId}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-base-200 hover:border-primary/50'
                    }`}
                  >
                    {/* SERVICE DETAILS */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{service.service}</h3>

                      {Array.isArray(service.admissionCovered) &&
                        service.admissionCovered.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {service.admissionCovered.map((item, index) => (
                              <span
                                key={`${serviceId}-covered-${index}`}
                                className="badge badge-outline badge-sm"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* PRICE + CHECKBOX */}
                    <div className="ml-4 flex flex-col items-end text-right">
                      <p className="font-bold text-primary">
                        ₦{Number(service.amount || 0).toLocaleString()}
                      </p>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAdmission(service)}
                        className="checkbox checkbox-primary mt-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex items-center justify-between border-t border-base-200 p-5">
          <span className="text-sm text-base-content/60">
            {selectedAdmissions.length} service(s) selected
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving || loading || selectedAdmissions.length === 0}
            >
              {saving && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Confirm Admission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionModal;
