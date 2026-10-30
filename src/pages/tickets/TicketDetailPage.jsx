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
import supportAPI from '@/services/api/supportAPI';
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
  FaTerminal,
  FaCode,
  FaLaptopCode,
  FaServer,
  FaSync,
  FaExclamationTriangle,
  FaCopy,
  FaCheck,
  FaDesktop,
  FaGlobe,
  FaInfoCircle,
  FaUserCheck,
  FaCalendarAlt,
  FaFire,
  FaShieldAlt,
  FaShareAlt,
} from 'react-icons/fa';

const STATUS_CONFIG = {
  open: {
    label: 'Open',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500',
  },
  awaiting_feedback: {
    label: 'Awaiting Feedback',
    badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    dot: 'bg-purple-500',
  },
  resolved: {
    label: 'Resolved',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  closed: {
    label: 'Closed',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

const PRIORITY_CONFIG = {
  low: {
    label: 'Low Priority',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    icon: null,
  },
  medium: {
    label: 'Medium Priority',
    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300',
    icon: null,
  },
  high: {
    label: 'High Priority',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300',
    icon: FaExclamationTriangle,
  },
  critical: {
    label: 'Critical / Urgent',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 animate-pulse',
    icon: FaFire,
  },
};

const CATEGORY_LABELS = {
  software_bug: { label: 'Software / HMS Bug', icon: FaBug, color: 'text-rose-500' },
  hardware: { label: 'Hardware / Printer', icon: FaPrint, color: 'text-amber-500' },
  medical_equipment: { label: 'Medical Equipment', icon: FaStethoscope, color: 'text-emerald-500' },
  billing_hmo: { label: 'Billing & HMO', icon: FaFileInvoiceDollar, color: 'text-blue-500' },
  facility: { label: 'Facility / Ward', icon: FaTools, color: 'text-purple-500' },
  other: { label: 'General Inquiry', icon: FaQuestionCircle, color: 'text-slate-500' },
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const commentsEndRef = useRef(null);

  const isTechnicianOrSuperAdmin =
    user?.role === 'super-admin' ||
    user?.role === 'developer' ||
    user?.role === 'it-support' ||
    user?.accountType === 'super-admin' ||
    user?.accountType === 'developer' ||
    user?.accountType === 'it-support';

  const isAdmin = isTechnicianOrSuperAdmin;

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' | 'diagnostics'

  // Clipboard feedbacks
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRoute, setCopiedRoute] = useState(false);

  // New Comment State
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentFile, setCommentFile] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Admin Resolution State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Server Logs State
  const [serverLogs, setServerLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [hasFetchedLogs, setHasFetchedLogs] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [isCopiedLogs, setIsCopiedLogs] = useState(false);

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

  const handleAssignToMe = async () => {
    if (!user?.id) return;
    setIsUpdatingStatus(true);
    try {
      await updateTicket(id, { assignedToUserId: user.id });
      toast.success('Ticket assigned to you successfully');
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign ticket');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyTicketCode = () => {
    if (!ticket?.ticketNumber) return;
    navigator.clipboard.writeText(ticket.ticketNumber);
    setCopiedCode(true);
    toast.success(`Ticket #${ticket.ticketNumber} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyRoute = () => {
    if (!ticket?.currentRoute) return;
    navigator.clipboard.writeText(ticket.currentRoute);
    setCopiedRoute(true);
    toast.success('Page route copied!');
    setTimeout(() => setCopiedRoute(false), 2000);
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

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Fetch Winston server logs around ticket creation time
  const handleFetchServerLogs = async () => {
    if (!ticket?.createdAt) return;
    setIsLoadingLogs(true);
    try {
      const res = await supportAPI.getLogs({
        aroundTime: ticket.createdAt,
        windowMinutes: 5,
        limit: 150,
      });
      if (res?.data?.entries) {
        setServerLogs(res.data.entries);
        setHasFetchedLogs(true);
        toast.success(`Found ${res.data.entries.length} log events around ticket creation time`);
      }
    } catch (err) {
      console.error('Failed to fetch server logs:', err);
      toast.error(err.response?.data?.error || 'Failed to fetch server logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleCopyLogs = () => {
    if (!serverLogs.length) return;
    const text = serverLogs.map((l) => `${l.timestamp} | ${l.level} | ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopiedLogs(true);
    toast.success('Logs copied to clipboard');
    setTimeout(() => setIsCopiedLogs(false), 2000);
  };

  if (isLoading) {
    return (
      <RoleBasedLayout>
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <KolakLoader />
          <p className="text-sm font-medium text-base-content/60">Loading ticket workspace...</p>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!ticket) return null;

  const CategoryIcon = CATEGORY_LABELS[ticket.category]?.icon || FaQuestionCircle;
  const categoryColor = CATEGORY_LABELS[ticket.category]?.color || 'text-primary';
  const statusInfo = STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    badge: 'bg-base-200 text-base-content',
    dot: 'bg-slate-400',
  };
  const priorityInfo = PRIORITY_CONFIG[ticket.priority] || {
    label: ticket.priority,
    badge: 'bg-base-200 text-base-content',
    icon: null,
  };
  const PriorityIcon = priorityInfo.icon;
  const isReporter = ticket.reportedByUserId === user?.id;

  const diagnostics = ticket.diagnostics;
  const failedRequests = diagnostics?.failedRequests || [];
  const consoleErrors = diagnostics?.consoleErrors || [];
  const clientEnv = diagnostics?.client;
  const totalErrorsCount = failedRequests.length + consoleErrors.length;

  // Filter server logs
  const filteredServerLogs = serverLogs.filter((log) => {
    if (logLevelFilter !== 'ALL' && log.level !== logLevelFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.timestamp.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <RoleBasedLayout>
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-16">
        
        {/* Back Button & Top Action Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-base-content/70 hover:text-base-content hover:bg-base-200/80 transition-all border border-transparent hover:border-base-300"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to All Tickets</span>
          </button>

          {/* Action on Header */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-2xl border border-base-200 shadow-xs">
                <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider pl-1">
                  Status:
                </span>
                <select
                  value={ticket.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="select select-ghost select-xs sm:select-sm font-bold text-xs sm:text-sm text-base-content focus:bg-base-200 rounded-xl"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_feedback">Awaiting Feedback</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}

            {!isAdmin && isReporter && ticket.status !== 'closed' && (
              <button
                onClick={() => handleStatusChange('closed')}
                disabled={isUpdatingStatus}
                className="btn btn-outline btn-success btn-sm rounded-xl gap-2 font-semibold shadow-xs"
              >
                <FaCheckCircle className="w-4 h-4" />
                <span>Mark Solved & Close</span>
              </button>
            )}
          </div>
        </div>

        {/* HERO HEADER CARD */}
        <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 sm:p-8 space-y-5 transition-all">
          
          {/* Top Pill Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Ticket Code with Copy Button */}
            <button
              type="button"
              onClick={handleCopyTicketCode}
              title="Click to copy ticket ID"
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all font-mono text-xs sm:text-sm font-bold"
            >
              <FaTicketAlt className="w-3.5 h-3.5 opacity-80" />
              <span>{ticket.ticketNumber}</span>
              {copiedCode ? (
                <FaCheck className="w-3 h-3 text-success ml-0.5" />
              ) : (
                <FaCopy className="w-3 h-3 opacity-60 group-hover:opacity-100 ml-0.5" />
              )}
            </button>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold uppercase tracking-wider ${statusInfo.badge}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
              <span>{statusInfo.label}</span>
            </span>

            {/* Priority Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold ${priorityInfo.badge}`}
            >
              {PriorityIcon && <PriorityIcon className="w-3.5 h-3.5" />}
              <span>{priorityInfo.label}</span>
            </span>

            {/* Category Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200/80 text-base-content/80 text-xs sm:text-sm font-semibold border border-base-300/40">
              <CategoryIcon className={`w-3.5 h-3.5 ${categoryColor}`} />
              <span>{CATEGORY_LABELS[ticket.category]?.label || ticket.category?.replace('_', ' ')}</span>
            </span>

            {/* Diagnostics Pill (Clickable to switch tab) */}
            {diagnostics && (
              <button
                type="button"
                onClick={() => setActiveTab('diagnostics')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs sm:text-sm font-bold transition-all shadow-2xs"
              >
                <FaLaptopCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Diagnostics Snapshot</span>
                {totalErrorsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px]">
                    {totalErrorsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-base-content tracking-tight leading-snug">
            {ticket.title}
          </h1>

          {/* Metadata Sub-Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-base-content/70 pt-2 border-t border-base-200/70">
            {/* Reporter Attribution */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center uppercase">
                {ticket.reportedByUser?.firstName?.[0] || 'U'}
              </div>
              <span>
                Reported by{' '}
                <strong className="text-base-content font-bold">
                  {ticket.reportedByUser?.firstName} {ticket.reportedByUser?.lastName}
                </strong>
                {ticket.reportedByUser?.accountType && (
                  <span className="ml-1 opacity-75 capitalize">
                    ({ticket.reportedByUser?.accountType})
                  </span>
                )}
              </span>
            </div>

            {/* Date Logged */}
            <div className="flex items-center gap-1.5">
              <FaCalendarAlt className="w-3.5 h-3.5 text-base-content/50" />
              <span>
                {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {new Date(ticket.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Affected Route with Copy */}
            {ticket.currentRoute && (
              <div className="flex items-center gap-2">
                <span className="text-base-content/50 font-medium">Page:</span>
                <button
                  type="button"
                  onClick={handleCopyRoute}
                  title="Click to copy route"
                  className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-base-200 hover:bg-base-300 font-mono text-xs font-semibold text-primary transition-all"
                >
                  <span className="truncate max-w-[240px] sm:max-w-[320px]">
                    {ticket.currentRoute}
                  </span>
                  {copiedRoute ? (
                    <FaCheck className="w-2.5 h-2.5 text-success ml-1 shrink-0" />
                  ) : (
                    <FaCopy className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 ml-1 shrink-0" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2-COLUMN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: TICKET DETAILS, PEOPLE, ATTACHMENTS (4 cols) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* TICKET PROPERTIES CARD */}
            <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 text-base-content/80 font-bold text-sm tracking-wide uppercase">
                <FaInfoCircle className="w-4 h-4 text-primary" />
                <span>Ticket Properties</span>
              </div>

              <div className="divide-y divide-base-200 text-sm">
                
                {/* Category */}
                <div className="py-3.5 flex items-center justify-between gap-2">
                  <span className="text-base-content/60 font-medium">Category</span>
                  <span className="font-semibold text-base-content inline-flex items-center gap-1.5">
                    <CategoryIcon className={`w-3.5 h-3.5 ${categoryColor}`} />
                    <span>{CATEGORY_LABELS[ticket.category]?.label || ticket.category}</span>
                  </span>
                </div>

                {/* Priority */}
                <div className="py-3.5 flex items-center justify-between gap-2">
                  <span className="text-base-content/60 font-medium">Priority</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${priorityInfo.badge}`}>
                    {priorityInfo.label}
                  </span>
                </div>

                {/* Status */}
                <div className="py-3.5 flex items-center justify-between gap-2">
                  <span className="text-base-content/60 font-medium">Status</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${statusInfo.badge}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Created On */}
                <div className="py-3.5 flex items-center justify-between gap-2">
                  <span className="text-base-content/60 font-medium">Created</span>
                  <span className="font-medium text-base-content text-right text-xs sm:text-sm">
                    {new Date(ticket.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Last Activity */}
                <div className="py-3.5 flex items-center justify-between gap-2">
                  <span className="text-base-content/60 font-medium">Last Updated</span>
                  <span className="font-medium text-base-content text-right text-xs sm:text-sm">
                    {new Date(ticket.updatedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Route */}
                {ticket.currentRoute && (
                  <div className="pt-3.5 space-y-1.5">
                    <span className="text-base-content/60 font-medium block">Originating URL / Route</span>
                    <div className="p-2.5 rounded-xl bg-base-200/70 border border-base-300/40 text-primary font-mono text-xs break-all">
                      {ticket.currentRoute}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* PEOPLE CARD (REPORTER & ASSIGNEE) */}
            <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 space-y-6">
              
              {/* Reporter Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60 block">
                  Reported By
                </span>
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-base-200/40 border border-base-200">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase shrink-0 shadow-2xs">
                    {ticket.reportedByUser?.firstName?.[0] || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-base text-base-content truncate">
                      {ticket.reportedByUser?.firstName} {ticket.reportedByUser?.lastName}
                    </div>
                    <div className="text-xs text-base-content/60 font-medium truncate capitalize">
                      {ticket.reportedByUser?.accountType || ticket.reportedByUser?.role || 'Staff Member'}
                    </div>
                    {ticket.reportedByUser?.email && (
                      <div className="text-xs text-base-content/50 truncate font-mono mt-0.5">
                        {ticket.reportedByUser?.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignee Section */}
              <div className="space-y-3 pt-3 border-t border-base-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                    Assigned Engineer / Support
                  </span>
                  {!ticket.assignedToUser && isAdmin && (
                    <button
                      type="button"
                      onClick={handleAssignToMe}
                      disabled={isUpdatingStatus}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      + Assign to Me
                    </button>
                  )}
                </div>

                {ticket.assignedToUser ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-base-200/40 border border-base-200">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg uppercase shrink-0 shadow-2xs">
                      {ticket.assignedToUser.firstName?.[0] || 'D'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-base text-base-content truncate">
                        {ticket.assignedToUser.firstName} {ticket.assignedToUser.lastName}
                      </div>
                      <div className="text-xs text-secondary font-semibold truncate capitalize">
                        {ticket.assignedToUser.role || ticket.assignedToUser.accountType || 'Developer / Support'}
                      </div>
                      {ticket.assignedToUser.email && (
                        <div className="text-xs text-base-content/50 truncate font-mono mt-0.5">
                          {ticket.assignedToUser.email}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-base-200/30 border border-dashed border-base-300 text-center space-y-2">
                    <p className="text-xs text-base-content/60 font-medium">
                      Not currently assigned to a developer or technician.
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleAssignToMe}
                        disabled={isUpdatingStatus}
                        className="btn btn-primary btn-sm rounded-xl gap-2 font-semibold shadow-xs"
                      >
                        <FaUserCheck className="w-3.5 h-3.5" />
                        <span>Assign to Myself</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* RESOLUTION CARD (IF RESOLVED) */}
            {ticket.resolutionNotes && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm uppercase tracking-wider">
                  <FaCheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Resolution Notes</span>
                </div>
                <p className="text-sm text-base-content/90 leading-relaxed whitespace-pre-wrap font-sans">
                  {ticket.resolutionNotes}
                </p>
                {ticket.resolvedAt && (
                  <div className="text-xs text-base-content/50 pt-2 border-t border-emerald-500/20">
                    Resolved at: {new Date(ticket.resolvedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* ATTACHMENTS GALLERY */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-base-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                    Attachments ({ticket.attachments.length})
                  </span>
                  <span className="text-xs text-base-content/50">Click to view / download</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {ticket.attachments.map((att) => {
                    const url = getAttachmentUrl(att.id);
                    const isImg = att.mimetype?.startsWith('image/');
                    return (
                      <a
                        key={att.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col p-2.5 rounded-2xl border border-base-200 hover:border-primary/50 bg-base-200/30 hover:bg-base-200 transition-all text-xs shadow-2xs"
                      >
                        {isImg ? (
                          <div className="w-full h-28 rounded-xl overflow-hidden mb-2 bg-base-300 border border-base-300">
                            <img
                              src={url}
                              alt={att.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-28 rounded-xl bg-base-300/80 flex items-center justify-center text-primary mb-2">
                            <FaPaperclip className="w-8 h-8" />
                          </div>
                        )}
                        <span className="font-semibold text-sm truncate text-base-content group-hover:text-primary">
                          {att.name}
                        </span>
                        <span className="text-xs text-base-content/50 flex items-center gap-1.5 mt-1 font-medium">
                          <span>View full</span>
                          <FaExternalLinkAlt className="w-2.5 h-2.5" />
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: ISSUE DESCRIPTION & TABS (8 cols)          */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ISSUE DESCRIPTION CARD */}
            <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-base-200 pb-4">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-base-content/70">
                  Issue Details & Description
                </span>
                <span className="text-xs text-base-content/50">
                  Logged on {new Date(ticket.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="text-base sm:text-lg leading-relaxed text-base-content font-sans whitespace-pre-wrap selection:bg-primary/20">
                {ticket.description}
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="bg-base-200/60 p-1.5 rounded-2xl inline-flex flex-wrap gap-1.5 border border-base-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('discussion')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
                  activeTab === 'discussion'
                    ? 'bg-base-100 text-base-content shadow-xs'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                }`}
              >
                <span>💬 Discussion & Activity</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-base-300 text-base-content">
                  {ticket.comments?.length || 0}
                </span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnostics')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
                    activeTab === 'diagnostics'
                      ? 'bg-neutral text-neutral-content shadow-xs'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                  }`}
                >
                  <FaLaptopCode className="w-4 h-4 text-warning" />
                  <span>Developer Diagnostics & Logs</span>
                  {totalErrorsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white font-mono">
                      {totalErrorsCount} errors
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-content/20 text-neutral-content">
                      Ready
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* TAB 1: DISCUSSION & UPDATES FEED */}
            {activeTab === 'discussion' && (
              <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm overflow-hidden flex flex-col">
                
                {/* Feed Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-base-200 bg-base-200/30 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-base-content">
                      Activity & Discussion Timeline ({ticket.comments?.length || 0})
                    </h3>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Replies are visible to hospital staff and engineering
                    </p>
                  </div>
                </div>

                {/* Comments Feed */}
                <div className="p-6 sm:p-8 space-y-6 min-h-[340px] max-h-[640px] overflow-y-auto">
                  {ticket.comments && ticket.comments.length > 0 ? (
                    ticket.comments.map((c) => {
                      const isOwnComment = c.userId === user?.id;
                      const isCommentAdmin =
                        c.user?.role === 'super-admin' ||
                        c.user?.role === 'developer' ||
                        c.user?.role === 'it-support' ||
                        c.user?.accountType === 'super-admin' ||
                        c.user?.accountType === 'developer' ||
                        c.user?.accountType === 'it-support';

                      return (
                        <div
                          key={c.id}
                          className={`flex gap-3.5 ${isOwnComment ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-2xl bg-base-300 flex items-center justify-center font-bold text-sm uppercase shrink-0 text-base-content/80 shadow-2xs">
                            {c.user?.firstName?.[0] || 'U'}
                          </div>

                          {/* Message Body */}
                          <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5 ${isOwnComment ? 'items-end' : 'items-start'}`}>
                            
                            {/* Header row */}
                            <div className={`flex flex-wrap items-center gap-2 text-xs ${isOwnComment ? 'justify-end' : 'justify-start'}`}>
                              <span className="font-bold text-base-content text-sm">
                                {c.user?.firstName} {c.user?.lastName}
                              </span>
                              {isCommentAdmin && (
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold text-[10px]">
                                  Support Team
                                </span>
                              )}
                              {c.isInternal && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-[10px] inline-flex items-center gap-1">
                                  <FaLock className="w-2.5 h-2.5" /> Internal Staff Note
                                </span>
                              )}
                              <span className="text-xs text-base-content/50">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                                {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Bubble */}
                            <div
                              className={`p-4 sm:p-5 rounded-3xl text-sm sm:text-base leading-relaxed whitespace-pre-wrap shadow-2xs ${
                                c.isInternal
                                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200'
                                  : isOwnComment
                                  ? 'bg-primary text-primary-content rounded-tr-xs'
                                  : 'bg-base-200/90 text-base-content rounded-tl-xs border border-base-200'
                              }`}
                            >
                              {c.message}

                              {/* Comment Attachments */}
                              {c.attachments && c.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-current/20 flex flex-wrap gap-2">
                                  {c.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={getAttachmentUrl(att.id)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-semibold backdrop-blur-xs transition-colors"
                                    >
                                      <FaPaperclip className="w-3 h-3" />
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
                    <div className="py-16 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/40">
                        💬
                      </div>
                      <p className="text-sm font-semibold text-base-content/70">No activity yet on this ticket</p>
                      <p className="text-xs text-base-content/50">Post an update, diagnostic note, or follow-up question below.</p>
                    </div>
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Reply Composer Form */}
                {ticket.status !== 'closed' ? (
                  <form
                    onSubmit={handleAddComment}
                    className="p-6 border-t border-base-200 bg-base-200/20 space-y-4"
                  >
                    <div>
                      <textarea
                        rows={4}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a message, update, or troubleshooting note..."
                        className="textarea textarea-bordered w-full text-sm sm:text-base leading-relaxed rounded-2xl focus:border-primary p-4 shadow-2xs"
                      />
                    </div>

                    {/* Attached file chip */}
                    {commentFile && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-200 border border-base-300 text-xs font-medium">
                        <FaPaperclip className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate max-w-xs">{commentFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCommentFile(null)}
                          className="hover:text-error ml-1"
                        >
                          <FaTimes className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                        
                        {/* Attach file trigger */}
                        <label className="btn btn-ghost btn-sm gap-2 cursor-pointer text-base-content/70 hover:text-base-content rounded-xl">
                          <FaPaperclip className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Attach Screenshot / File</span>
                          <input
                            type="file"
                            onChange={(e) => setCommentFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>

                        {/* Internal Note Toggle */}
                        {isAdmin && (
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="checkbox checkbox-sm checkbox-warning rounded-lg"
                            />
                            <span className="text-xs font-semibold text-base-content/80 inline-flex items-center gap-1.5">
                              <FaLock className="w-3 h-3 text-warning" />
                              <span>Internal Note (Staff & Devs Only)</span>
                            </span>
                          </label>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingComment || (!commentText.trim() && !commentFile)}
                        className="btn btn-primary btn-md rounded-2xl px-6 gap-2 font-bold shadow-sm"
                      >
                        {isSubmittingComment ? (
                          <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                          <FaPaperPlane className="w-4 h-4" />
                        )}
                        <span>Post Response</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 border-t border-base-200 bg-base-200/40 text-center text-sm text-base-content/60 font-medium">
                    This ticket has been marked closed. To report further issues or questions, please create a new ticket.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DEVELOPER DIAGNOSTICS & WINSTON LOG VIEWER */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-6">

                {/* CLIENT ENVIRONMENT CARD */}
                <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-4">
                    <div className="flex items-center gap-2.5">
                      <FaDesktop className="w-5 h-5 text-primary" />
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-base-content">
                        Client Snapshot at Ticket Creation
                      </h3>
                    </div>
                    {diagnostics?.capturedAt && (
                      <span className="text-xs font-mono text-base-content/60 bg-base-200 px-3 py-1 rounded-xl">
                        Captured: {new Date(diagnostics.capturedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {clientEnv ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                      
                      {/* Browser / UA */}
                      <div className="p-4 rounded-2xl bg-base-200/50 border border-base-200 space-y-1">
                        <span className="text-xs uppercase font-bold text-base-content/50 block">Browser / User Agent</span>
                        <div className="font-mono text-xs text-base-content break-all leading-snug">
                          {clientEnv.userAgent}
                        </div>
                      </div>

                      {/* Screen & Window */}
                      <div className="p-4 rounded-2xl bg-base-200/50 border border-base-200 space-y-1">
                        <span className="text-xs uppercase font-bold text-base-content/50 block">Display & Viewport</span>
                        <div className="font-semibold text-base-content">
                          Screen: {clientEnv.screen}
                        </div>
                        <div className="text-xs text-base-content/70">
                          Viewport: {clientEnv.viewport}
                        </div>
                      </div>

                      {/* Timezone & Network */}
                      <div className="p-4 rounded-2xl bg-base-200/50 border border-base-200 space-y-1">
                        <span className="text-xs uppercase font-bold text-base-content/50 block">Locale & Network</span>
                        <div className="font-semibold text-base-content">
                          Timezone: {clientEnv.timeZone || 'Unknown'}
                        </div>
                        <div className="text-xs text-base-content/70">
                          Online Status: {clientEnv.online ? '🟢 Connected' : '🔴 Offline'}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-base-200/40 text-sm text-base-content/60 italic text-center">
                      No client environment metadata was attached to this ticket (filed before auto-diagnostics was mounted).
                    </div>
                  )}
                </div>

                {/* FAILED API REQUESTS CARD */}
                <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-4">
                    <div className="flex items-center gap-2.5">
                      <FaServer className="w-5 h-5 text-rose-500" />
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-base-content">
                        Failed API Requests Buffer ({failedRequests.length})
                      </h3>
                    </div>
                    <span className="text-xs text-base-content/50">
                      Captured by Axios response interceptor
                    </span>
                  </div>

                  {failedRequests.length > 0 ? (
                    <div className="space-y-4">
                      {failedRequests.map((req, i) => (
                        <div
                          key={req.id || i}
                          className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono text-xs font-bold uppercase">
                                {req.method}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-neutral text-neutral-content font-mono text-xs font-bold">
                                HTTP {req.status} {req.statusText}
                              </span>
                              <code className="text-xs sm:text-sm font-mono font-bold text-base-content break-all">
                                {req.url}
                              </code>
                            </div>
                            <span className="text-xs font-mono text-base-content/50">
                              {new Date(req.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          {/* Response Payload */}
                          {req.responseData && (
                            <div className="space-y-1.5 pt-2 border-t border-rose-500/20">
                              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                                Server Response Payload:
                              </span>
                              <pre className="p-4 rounded-xl bg-[#0b1120] text-slate-100 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
                                {typeof req.responseData === 'object'
                                  ? JSON.stringify(req.responseData, null, 2)
                                  : String(req.responseData)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                      <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Zero failed API requests caught in the diagnostic buffer when this ticket was submitted.</span>
                    </div>
                  )}
                </div>

                {/* BROWSER CONSOLE ERRORS & CRASHES */}
                <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-4">
                    <div className="flex items-center gap-2.5">
                      <FaTerminal className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-base-content">
                        Console & JavaScript Runtime Errors ({consoleErrors.length})
                      </h3>
                    </div>
                    <span className="text-xs text-base-content/50">
                      Uncaught exceptions in client browser
                    </span>
                  </div>

                  {consoleErrors.length > 0 ? (
                    <div className="space-y-4">
                      {consoleErrors.map((err, i) => (
                        <div
                          key={err.id || i}
                          className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="font-mono text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                              {err.message}
                            </span>
                            <span className="text-xs font-mono text-base-content/50 shrink-0">
                              {new Date(err.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          {err.stack && (
                            <pre className="p-4 rounded-xl bg-[#0b1120] text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto max-h-52 border border-slate-800">
                              {err.stack}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                      <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Zero uncaught browser console exceptions caught in the buffer.</span>
                    </div>
                  )}
                </div>

                {/* BACKEND SERVER LOGS (WINSTON ./logs/general.log) */}
                <div className="bg-base-100 rounded-3xl border border-base-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <FaServer className="w-5 h-5 text-primary" />
                        <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-base-content">
                          Server Logs Around Ticket Creation
                        </h3>
                      </div>
                      <p className="text-xs text-base-content/60 mt-1">
                        Queries backend Winston disk log <code className="font-mono bg-base-200 px-1.5 py-0.5 rounded text-xs">./logs/general.log</code> within ±5 minutes of filing.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleFetchServerLogs}
                      disabled={isLoadingLogs}
                      className="btn btn-primary btn-sm rounded-xl gap-2 font-bold shadow-xs self-start sm:self-auto"
                    >
                      {isLoadingLogs ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaSync className="w-4 h-4" />
                      )}
                      <span>{hasFetchedLogs ? 'Refresh Server Logs' : 'Fetch Server Logs'}</span>
                    </button>
                  </div>

                  {hasFetchedLogs ? (
                    <div className="space-y-4">
                      
                      {/* Filter Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-base-200/40 p-3 rounded-2xl border border-base-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-base-content/60 uppercase">Level:</span>
                          <div className="join">
                            {['ALL', 'ERROR', 'WARN', 'INFO'].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setLogLevelFilter(lvl)}
                                className={`join-item btn btn-xs font-bold ${
                                  logLevelFilter === lvl ? 'btn-active btn-neutral' : 'btn-ghost'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            placeholder="Search log output..."
                            className="input input-bordered input-xs sm:input-sm w-full font-mono text-xs rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={handleCopyLogs}
                            className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 rounded-xl font-semibold shrink-0"
                            title="Copy filtered logs"
                          >
                            {isCopiedLogs ? (
                              <FaCheck className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <FaCopy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>

                      {/* Sleek Terminal Window */}
                      <div className="rounded-2xl bg-[#0B1120] text-slate-100 font-mono text-xs p-5 max-h-[500px] overflow-y-auto space-y-2 shadow-inner border border-slate-800">
                        {filteredServerLogs.length > 0 ? (
                          filteredServerLogs.map((log) => {
                            const isErr = log.level === 'ERROR';
                            const isWarn = log.level === 'WARN';
                            return (
                              <div
                                key={log.id}
                                className={`p-2 rounded-lg transition-colors leading-relaxed ${
                                  isErr
                                    ? 'bg-rose-500/20 text-rose-200 border-l-4 border-rose-500 pl-3'
                                    : isWarn
                                    ? 'bg-amber-500/20 text-amber-200 border-l-4 border-amber-500 pl-3'
                                    : 'hover:bg-slate-800/60'
                                }`}
                              >
                                <span className="text-slate-400 select-none mr-2 font-mono">
                                  {log.timestamp}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase ${
                                    isErr
                                      ? 'bg-rose-600 text-white'
                                      : isWarn
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {log.level}
                                </span>
                                <span className="whitespace-pre-wrap break-all font-mono">
                                  {log.message}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-slate-500 font-medium">
                            No log events match the current filter query.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-base-content/60 space-y-3 bg-base-200/20 rounded-2xl border border-dashed border-base-200">
                      <p>Click "Fetch Server Logs" to pull backend logs matching this ticket's timeframe directly from disk.</p>
                      <button
                        type="button"
                        onClick={handleFetchServerLogs}
                        disabled={isLoadingLogs}
                        className="btn btn-outline btn-primary btn-sm rounded-xl font-semibold"
                      >
                        Fetch Now
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* RESOLUTION MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-base-100 rounded-3xl shadow-2xl border border-base-200 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-base-200 pb-4">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                <FaCheckCircle className="w-6 h-6" />
                <span>Mark Ticket as Resolved</span>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-base-content/70 leading-relaxed">
              Please enter resolution details explaining how the issue was fixed, so the reporter and engineering team can refer to it in future audits.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <textarea
                required
                rows={5}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Investigated server error on /api/v1/investigation-requests; patched null pointer check in OrderService and verified fix..."
                className="textarea textarea-bordered w-full text-sm leading-relaxed rounded-2xl p-4 focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="btn btn-ghost btn-md rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus || !resolutionNotes.trim()}
                  className="btn btn-success text-white btn-md px-6 rounded-xl font-bold shadow-md"
                >
                  Confirm & Mark Resolved
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
