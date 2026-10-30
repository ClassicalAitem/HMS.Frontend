import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaTimes,
  FaBug,
  FaPrint,
  FaFileInvoiceDollar,
  FaTools,
  FaQuestionCircle,
  FaPaperclip,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStethoscope,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createTicket, uploadTicketAttachment } from '@/services/api/ticketAPI';
import { getDiagnosticsSnapshot } from '@/utils/diagnostics';

const CATEGORIES = [
  { id: 'software_bug', label: 'Software / HMS Bug', icon: FaBug, desc: 'Error messages, buttons not working, crashes' },
  { id: 'hardware', label: 'Hardware / Printer', icon: FaPrint, desc: 'Printer issues, network, PC problems' },
  { id: 'medical_equipment', label: 'Medical Equipment', icon: FaStethoscope, desc: 'Monitors, lab analyzers, probes' },
  { id: 'billing_hmo', label: 'Billing & HMO', icon: FaFileInvoiceDollar, desc: 'Tariffs, claims, receipt mismatches' },
  { id: 'facility', label: 'Facility / Ward', icon: FaTools, desc: 'AC, power, plumbing, maintenance' },
  { id: 'other', label: 'General Inquiry / Other', icon: FaQuestionCircle, desc: 'General help or user question' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', desc: 'Minor issue / cosmetic query', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { id: 'medium', label: 'Medium', desc: 'Normal workflow issue', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'high', label: 'High', desc: 'Impacting clinical or cashier work', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'critical', label: 'Critical / Urgent', desc: 'Emergency, system halted or patient care blocked', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
];

const QuickReportModal = ({ isOpen, onClose, onSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('software_bug');
  const [priority, setPriority] = useState('medium');
  const [includeRoute, setIncludeRoute] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('software_bug');
    setPriority('medium');
    setSelectedFile(null);
    setFilePreview(null);
    setCreatedTicket(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter a title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = [];

      // If file selected, upload first
      if (selectedFile) {
        try {
          const uploadRes = await uploadTicketAttachment(selectedFile);
          if (uploadRes?.data) {
            attachments.push(uploadRes.data);
          }
        } catch (uploadErr) {
          console.error('File upload error:', uploadErr);
          toast.error('File attachment failed to upload, continuing without attachment');
        }
      }

      // Auto-capture technical diagnostics (failed API calls, console errors, environment)
      const diagnostics = getDiagnosticsSnapshot();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        currentRoute: includeRoute ? location.pathname : null,
        attachments,
        diagnostics,
      };

      const res = await createTicket(payload);
      const ticket = res?.data || res;
      setCreatedTicket(ticket);
      toast.success('Ticket submitted successfully!');
      if (onSuccess) onSuccess(ticket);
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      const message = err.response?.data?.error || err.message || 'Failed to submit ticket';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-base-100 shadow-2xl border border-base-200 overflow-hidden text-base-content">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FaBug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Report an Issue / Support Ticket</h3>
              <p className="text-xs text-base-content/70">
                Facing a glitch, equipment breakdown, or workflow problem? Tell us.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            aria-label="Close modal"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {createdTicket ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center">
                <FaCheckCircle className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold">Ticket Submitted!</h4>
                <p className="text-sm text-base-content/70">
                  Your issue has been logged with reference:
                </p>
                <div className="inline-block px-4 py-1.5 rounded-lg bg-base-200 font-mono text-base font-bold text-primary tracking-wider mt-1">
                  {createdTicket.ticketNumber || 'TKT-PENDING'}
                </div>
              </div>
              <p className="text-xs text-base-content/60 max-w-md">
                Our team has been notified. You can track this ticket, add comments, or monitor resolution in the Support Center.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate(`/tickets/${createdTicket.id}`);
                  }}
                  className="btn btn-primary btn-sm px-5"
                >
                  View This Ticket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/tickets');
                  }}
                  className="btn btn-outline btn-sm px-5"
                >
                  All My Tickets
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-ghost btn-sm"
                >
                  Report Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-2">
                  Category <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium ring-2 ring-primary/20 shadow-xs'
                            : 'border-base-300 hover:border-base-content/30 bg-base-100 text-base-content'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-base-content/60'}`} />
                          <span className="text-xs font-semibold line-clamp-1">{cat.label}</span>
                        </div>
                        <span className="text-[11px] text-base-content/60 line-clamp-1">{cat.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-2">
                  Priority / Urgency <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20 font-bold'
                            : 'border-base-300 hover:border-base-content/30'
                        }`}
                      >
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${p.badge}`}>
                          {p.label}
                        </span>
                        <div className="text-[10px] text-base-content/60 mt-1 line-clamp-1">
                          {p.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1">
                  Summary / Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cannot save prescription for patient #1042"
                  className="input input-bordered w-full text-sm"
                  maxLength={255}
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1">
                  Detailed Description <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you were trying to do, what happened, and any error message displayed..."
                  className="textarea textarea-bordered w-full text-sm leading-relaxed"
                />
              </div>

              {/* Screenshot / File Attachment */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                  Attachment / Screenshot (Optional)
                </label>
                
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-3 min-w-0">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-base-300 shrink-0" />
                      ) : (
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                          <FaPaperclip className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-base-content/60">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="btn btn-ghost btn-circle btn-xs text-error"
                      title="Remove file"
                    >
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-base-300 hover:border-primary/50 rounded-xl cursor-pointer bg-base-200/30 hover:bg-base-200/50 transition-colors">
                    <FaPaperclip className="w-5 h-5 text-base-content/40 mb-1" />
                    <span className="text-xs font-medium text-base-content/80">Click to upload screenshot or photo</span>
                    <span className="text-[10px] text-base-content/50">PNG, JPG, PDF up to 10MB</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Auto Context Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base-content/80">Include current page URL:</span>
                  <code className="px-2 py-0.5 rounded bg-base-300 font-mono text-[11px] text-primary truncate max-w-[260px]">
                    {location.pathname}
                  </code>
                </div>
                <input
                  type="checkbox"
                  checked={includeRoute}
                  onChange={(e) => setIncludeRoute(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-xs"
                />
              </div>

              {/* Developer Diagnostics Hint */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-base-content/70">
                <span className="w-2 h-2 rounded-full bg-success shrink-0 animate-pulse"></span>
                <span>
                  <strong>Blackbox Auto-Diagnostics active:</strong> Client environment, failed API errors, and recent runtime errors will be securely attached to help developers troubleshoot.
                </span>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="btn btn-primary btn-sm min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Ticket'
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuickReportModal;

