import React, { useState, useEffect, useMemo } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import toast from 'react-hot-toast';

const AddLabTestModal = ({ isOpen, onClose, onAdd }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const loadServices = async () => {
      try {
        setLoading(true);
        const res = await getServiceCharges();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        // Filter for laboratory category
        const labServices = list.filter(s => 
          String(s?.category || '').toLowerCase().includes('laboratory') ||
          String(s?.category || '').toLowerCase().includes('lab')
        );
        if (mounted) setServices(labServices);
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to load lab services';
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadServices();
    return () => { mounted = false; };
  }, [isOpen]);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(s => (
      [s?.service, s?.name, s?.category, s?.amount]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    ));
  }, [services, query]);

  const handleSelect = (service) => {
    setSelectedService(service);
    setQuery(service?.service || service?.name || '');
  };

  const handleSubmit = () => {
    if (selectedService) {
      onAdd({ 
        name: selectedService.service || selectedService.name,
        serviceId: selectedService.id || selectedService._id,
        amount: selectedService.amount
      });
      setQuery('');
      setSelectedService(null);
      onClose();
      // Refresh page after adding lab test
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      toast.error('Please select a lab test');
    }
  };

  const handleClose = () => {
    setQuery('');
    setSelectedService(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-success mb-6">Add Lab Test</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">Search Lab Tests</label>
              <input 
                type="text" 
                className="input input-bordered w-full"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedService(null);
                }}
                placeholder="Type to search lab tests..."
              />
              {loading ? (
                <div className="mt-2 p-2 text-center text-sm text-base-content/50">Loading...</div>
              ) : services.length > 0 ? (
                <div className="mt-2 max-h-40 overflow-y-auto border border-base-300 rounded-lg">
                  {(query ? filteredServices : services).map((service) => {
                    const isSelected = selectedService?.id === service?.id || selectedService?._id === service?._id;
                    const serviceLabel = service?.service || service?.name || 'Unnamed';
                    return (
                      <button
                        key={service?.id || service?._id}
                        className={`w-full text-left p-3 border-b last:border-b-0 transition-colors ${
                          isSelected ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                        }`}
                        onClick={() => handleSelect(service)}
                        type="button"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{serviceLabel}</div>
                            {service?.category && (
                              <div className="text-xs opacity-75 mt-0.5">{service.category}</div>
                            )}
                          </div>
                          <div className={`text-sm font-semibold whitespace-nowrap ml-2 ${
                            isSelected ? '' : 'text-base-content/70'
                          }`}>
                            ₦{Number(service?.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query && !loading ? (
                <div className="mt-2 p-2 text-center text-sm text-base-content/50">No matching lab tests found</div>
              ) : !loading && services.length === 0 ? (
                <div className="mt-2 p-2 text-center text-sm text-base-content/50">No laboratory services available</div>
              ) : null}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              className="btn btn-outline flex-1"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              className="btn btn-success flex-1 text-white"
              onClick={handleSubmit}
              disabled={!selectedService}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLabTestModal;