import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import RoleBasedLayout from '@/layouts/RoleBasedLayout';
import {
  getTicketById,
  updateTicket,
  addTicketComment,
  uploadTicketAttachment,
  getAttachmentUrl,
} from '@/services/api/ticketAPI';
import KolakLoader from '@/components/common/KolakLoader';
import toast from 'react-hot-toast';
import {
  FaArrowLeft,
  FaTicketAlt,
  FaClock,
  FaCheckCircle,
  FaPaperPlane,
  FaPaperclip,
  FaTimes,
  FaUser,
  FaBug,
  FaPrint,
  FaStethoscope,
  FaFileInvoiceDollar,
  FaTools,
  FaQuestionCircle,
  FaLock,
  FaExternalLinkAlt,
  FaSpinner,
} from 'react-icons/fa';

const STATUS_CONFIG = {
  open: { label: 'Open', badge: 'badge-warning text-warning-content' },
  in_progress: { label: 'In Progress', badge: 'badge-info text-info-content' },
  awaiting_feedback: { label: 'Awaiting Info', badge: 'badge-accent text-accent-content' },
  resolved: { label: 'Resolved', badge: 'badge-success text-success-content' },
  closed: { label: 'Closed', badge: 'badge-neutral' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  medium: { label: 'Medium', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  high: { label: 'High', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  critical: { label: 'Critical / Urgent', class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const CATEGORY_LABELS = {
  software_bug: { label: 'Software / HMS Bug', icon: FaBug },
  hardware: { label: 'Hardware / Printer', icon: FaPrint },
  medical_equipment: { label: 'Medical Equipment', icon: FaStethoscope },
  billing_hmo: { label: 'Billing & HMO', icon: FaFileInvoiceDollar },
  facility: { label: 'Facility / Ward', icon: FaTools },
  other: { label: 'General Inquiry', icon: FaQuestionCircle },
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const commentsEndRef = useRef(null);

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'super-admin' ||
    user?.accountType === 'admin' ||
    user?.accountType === 'super-admin';

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Comment State
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentFile, setCommentFile] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Admin Resolution State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await getTicketById(id);
      if (res?.data) {
        setTicket(res.data);
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
      toast.error(err.response?.data?.error || 'Failed to load ticket');
      navigate('/tickets');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'resolved') {
      setIsResolveModalOpen(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateTicket(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes explaining how the issue was solved');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateTicket(id, {
        status: 'resolved',
        resolutionNotes: resolutionNotes.trim(),
      });
      toast.success('Ticket marked as resolved!');
      setIsResolveModalOpen(false);
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve ticket');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentFile) return;

    setIsSubmittingComment(true);
    try {
      const attachments = [];
      if (commentFile) {
        const uploadRes = await uploadTicketAttachment(commentFile);
        if (uploadRes?.data) {
          attachments.push(uploadRes.data);
        }
      }

      await addTicketComment(id, {
        message: commentText.trim(),
        isInternal: isAdmin ? isInternal : false,
        attachments,
      });

      setCommentText('');
      setCommentFile(null);
      setIsInternal(false);
      toast.success('Comment posted');
      await fetchTicket();

      // Scroll to bottom of comments
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <RoleBasedLayout>
        <div className="py-24 flex justify-center">
          <KolakLoader />
        </div>
      </RoleBasedLayout>
    );
  }

  if (!ticket) return null;

  const CategoryIcon = CATEGORY_LABELS[ticket.category]?.icon || FaQuestionCircle;
  const statusInfo = STATUS_CONFIG[ticket.status] || { label: ticket.status, badge: 'badge-ghost' };
  const priorityInfo = PRIORITY_CONFIG[ticket.priority] || { label: ticket.priority, class: 'bg-gray-100' };
  const isReporter = ticket.reportedByUserId === user?.id;

  return (
    <RoleBasedLayout>
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        
        {/* Top Breadcrumb & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tickets')}
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
              title="Back to Tickets"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-primary tracking-wide">
                  {ticket.ticketNumber}
                </span>
                <span className={`badge badge-sm font-semibold capitalize ${statusInfo.badge}`}>
                  {statusInfo.label}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${priorityInfo.class}`}>
                  {priorityInfo.label}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-base-content mt-1">
                {ticket.title}
              </h1>
            </div>
          </div>

          {/* Quick Actions (Close or Status changer) */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/60 font-medium">Status:</span>
                <select
                  value={ticket.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="select select-bordered select-sm text-xs font-semibold rounded-xl"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_feedback">Awaiting Feedback</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            ) : (
              ticket.status !== 'closed' && isReporter && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={isUpdatingStatus}
                  className="btn btn-outline btn-sm text-xs rounded-xl"
                >
                  <FaCheckCircle className="w-3.5 h-3.5 mr-1 text-success" /> Mark Solved & Close
                </button>
              )
            )}
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Ticket Details & Metadata */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Ticket Info Card */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 border-b border-base-200 pb-2">
                Ticket Information
              </h3>

              <div className="space-y-3 text-xs">
                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Category:</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold capitalize text-base-content">
                    <CategoryIcon className="w-3.5 h-3.5 text-primary" />
                    {CATEGORY_LABELS[ticket.category]?.label || ticket.category?.replace('_', ' ')}
                  </span>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Priority:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${priorityInfo.class}`}>
                    {priorityInfo.label}
                  </span>
                </div>

                {/* Date Created */}
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Reported On:</span>
                  <span className="font-medium text-base-content">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Current Route */}
                {ticket.currentRoute && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-base-200">
                    <span className="text-base-content/60">Occurred on Page:</span>
                    <code className="p-1.5 rounded-lg bg-base-200 text-primary font-mono text-[11px] truncate">
                      {ticket.currentRoute}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Card */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 border-b border-base-200 pb-2">
                Reported By
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {ticket.reportedByUser?.firstName?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-base-content truncate">
                    {ticket.reportedByUser?.firstName} {ticket.reportedByUser?.lastName}
                  </div>
                  <div className="text-[11px] text-base-content/60 truncate capitalize">
                    {ticket.reportedByUser?.accountType || ticket.reportedByUser?.role || 'Staff Member'}
                  </div>
                  {ticket.reportedByUser?.email && (
                    <div className="text-[10px] text-base-content/50 truncate">
                      {ticket.reportedByUser?.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resolution Box (If Resolved) */}
            {ticket.resolutionNotes && (
              <div className="bg-success/5 border border-success/30 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
                  <FaCheckCircle className="w-4 h-4" />
                  <span>Resolution Notes</span>
                </div>
                <p className="text-xs text-base-content/80 leading-relaxed whitespace-pre-wrap">
                  {ticket.resolutionNotes}
                </p>
                {ticket.resolvedAt && (
                  <div className="text-[10px] text-base-content/50 pt-1">
                    Resolved at: {new Date(ticket.resolvedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Attachments Gallery */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 border-b border-base-200 pb-2">
                  Attachments ({ticket.attachments.length})
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {ticket.attachments.map((att) => {
                    const url = getAttachmentUrl(att.id);
                    const isImg = att.mimetype?.startsWith('image/');
                    return (
                      <a
                        key={att.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col p-2 rounded-xl border border-base-200 hover:border-primary/50 bg-base-200/40 hover:bg-base-200 transition-all text-xs"
                      >
                        {isImg ? (
                          <img
                            src={url}
                            alt={att.name}
                            className="w-full h-24 object-cover rounded-lg mb-1.5 border border-base-300"
                          />
                        ) : (
                          <div className="w-full h-24 rounded-lg bg-base-300 flex items-center justify-center text-primary mb-1.5">
                            <FaPaperclip className="w-6 h-6" />
                          </div>
                        )}
                        <span className="font-medium truncate text-[11px] group-hover:text-primary">
                          {att.name}
                        </span>
                        <span className="text-[10px] text-base-content/50 flex items-center gap-1 mt-0.5">
                          <span>View full</span>
                          <FaExternalLinkAlt className="w-2 h-2" />
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Problem Description & Discussion Activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Original Problem Description Card */}
            <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                  Issue Description
                </span>
                <span className="text-[11px] text-base-content/50">
                  Logged {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap font-sans">
                {ticket.description}
              </p>
            </div>

            {/* Discussion & Activity Thread */}
            <div className="bg-base-100 rounded-2xl border border-base-200 shadow-xs overflow-hidden flex flex-col">
              
              <div className="px-6 py-4 border-b border-base-200 bg-base-200/30 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                  Discussion & Updates ({ticket.comments?.length || 0})
                </h3>
                <span className="text-[11px] text-base-content/50">
                  Replies are visible to reporter & hospital staff
                </span>
              </div>

              {/* Comments Timeline */}
              <div className="p-6 space-y-5 min-h-[220px] max-h-[480px] overflow-y-auto">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c) => {
                    const isOwnComment = c.userId === user?.id;
                    const isCommentAdmin =
                      c.user?.role === 'admin' ||
                      c.user?.role === 'super-admin' ||
                      c.user?.accountType === 'admin' ||
                      c.user?.accountType === 'super-admin';

                    return (
                      <div
                        key={c.id}
                        className={`flex gap-3 text-xs ${isOwnComment ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center font-bold text-xs uppercase shrink-0 text-base-content/70">
                          {c.user?.firstName?.[0] || 'U'}
                        </div>

                        <div className={`max-w-[80%] space-y-1 ${isOwnComment ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-2 text-[11px] ${isOwnComment ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-bold text-base-content">
                              {c.user?.firstName} {c.user?.lastName}
                            </span>
                            {isCommentAdmin && (
                              <span className="badge badge-primary badge-xs py-0.5 px-1.5 font-semibold text-[9px]">
                                Support Team
                              </span>
                            )}
                            {c.isInternal && (
                              <span className="badge badge-warning badge-xs py-0.5 px-1.5 font-bold text-[9px] flex items-center gap-1">
                                <FaLock className="w-2 h-2" /> Internal Note
                              </span>
                            )}
                            <span className="text-[10px] text-base-content/50">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                              c.isInternal
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                                : isOwnComment
                                ? 'bg-primary text-primary-content rounded-tr-xs'
                                : 'bg-base-200 text-base-content rounded-tl-xs'
                            }`}
                          >
                            {c.message}

                            {/* Comment Attachments */}
                            {c.attachments && c.attachments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap gap-2">
                                {c.attachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={getAttachmentUrl(att.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-black/10 hover:bg-black/20 text-[10px] font-medium"
                                  >
                                    <FaPaperclip className="w-2.5 h-2.5" />
                                    <span>{att.name}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-base-content/50 text-xs">
                    No comments yet. Post an update or ask a question below.
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input Box */}
              {ticket.status !== 'closed' ? (
                <form
                  onSubmit={handleAddComment}
                  className="p-4 border-t border-base-200 bg-base-200/20 space-y-3"
                >
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type a reply, question, or diagnostic note..."
                      className="textarea textarea-bordered w-full text-xs leading-relaxed"
                    />
                  </div>

                  {commentFile && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-base-200 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FaPaperclip className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{commentFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCommentFile(null)}
                        className="btn btn-ghost btn-circle btn-xs text-error"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs">
                      {/* Attachment trigger */}
                      <label className="btn btn-ghost btn-xs gap-1.5 cursor-pointer text-base-content/70">
                        <FaPaperclip className="w-3.5 h-3.5" />
                        <span>Attach File</span>
                        <input
                          type="file"
                          onChange={(e) => setCommentFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      {/* Internal note toggle for admin */}
                      {isAdmin && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-base-content/70">
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="checkbox checkbox-xs checkbox-warning"
                          />
                          <span className="text-[11px] font-medium flex items-center gap-1">
                            <FaLock className="w-2.5 h-2.5 text-warning" />
                            Internal Note (Staff Only)
                          </span>
                        </label>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingComment || (!commentText.trim() && !commentFile)}
                      className="btn btn-primary btn-sm gap-1.5 px-4 rounded-xl"
                    >
                      {isSubmittingComment ? (
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FaPaperPlane className="w-3.5 h-3.5" />
                      )}
                      <span>Post Reply</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-base-200 bg-base-200/40 text-center text-xs text-base-content/60 font-medium">
                  This ticket has been marked closed. To request further assistance, you may submit a new ticket.
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Resolution Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl border border-base-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2 text-success font-bold text-base">
                <FaCheckCircle className="w-5 h-5" />
                <span>Mark Ticket as Resolved</span>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-base-content/70">
              Please document the solution or corrective action taken so the reporter and team understand how this was resolved.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Cleared stuck spooler service on receipt printer and printed test voucher successfully..."
                className="textarea textarea-bordered w-full text-xs leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus || !resolutionNotes.trim()}
                  className="btn btn-success text-white btn-sm px-4"
                >
                  Confirm & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </RoleBasedLayout>
  );
};

export default TicketDetailPage;

