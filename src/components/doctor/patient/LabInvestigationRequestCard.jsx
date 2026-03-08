import React from "react";
import { FaFlask, FaCheckCircle, FaClock, FaExclamationCircle, FaCalendarAlt } from "react-icons/fa";

const LabInvestigationRequestCard = ({ investigations = [], loading = false }) => {
  if (loading) {
    return (
      <div className="shadow-xl card bg-base-100 mb-4">
        <div className="p-4 card-body">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!investigations || investigations.length === 0) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success/10 border-success/20 text-success';
      case 'in_progress':
      case 'processing':
        return 'bg-info/10 border-info/20 text-info';
      case 'requested':
      case 'pending':
        return 'bg-warning/10 border-warning/20 text-warning';
      default:
        return 'bg-base-200/50 border-base-300 text-base-content';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'in_progress':
      case 'processing':
        return <FaClock className="w-4 h-4" />;
      case 'requested':
      case 'pending':
        return <FaExclamationCircle className="w-4 h-4" />;
      default:
        return <FaFlask className="w-4 h-4" />;
    }
  };

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex items-center gap-2 mb-4">
          <FaFlask className="text-info w-5 h-5" />
          <h3 className="text-lg font-semibold text-base-content">Lab Investigation Requests</h3>
          <span className="badge badge-primary badge-sm">{investigations.length}</span>
        </div>

        <div className="space-y-3">
          {investigations.map((inv, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${getStatusColor(inv.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(inv.status)}
                  <div>
                    <h4 className="font-semibold text-sm">Investigation ID: {inv.id?.substring(0, 8) || '—'}</h4>
                    <p className="text-xs opacity-75">{inv.type || 'Lab Investigation'}</p>
                  </div>
                </div>
                <span className={`badge badge-sm ${
                  inv.status?.toLowerCase() === 'completed' ? 'badge-success' :
                  inv.status?.toLowerCase() === 'in_progress' || inv.status?.toLowerCase() === 'processing' ? 'badge-info' :
                  inv.status?.toLowerCase() === 'requested' || inv.status?.toLowerCase() === 'pending' ? 'badge-warning' :
                  'badge-ghost'
                }`}>
                  {inv.status ? inv.status.replace('_', ' ') : 'Unknown'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                <div className="flex items-center gap-1">
                  <FaCalendarAlt className="w-3 h-3 opacity-60" />
                  <span>
                    {inv.createdAt
                      ? new Date(inv.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : '—'}
                  </span>
                </div>
                {inv.priority && (
                  <div>
                    <span className={`badge badge-xs ${
                      inv.priority === 'urgent' ? 'badge-error' :
                      inv.priority === 'high' ? 'badge-warning' :
                      'badge-ghost'
                    }`}>
                      {inv.priority.charAt(0).toUpperCase() + inv.priority.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {inv.tests && inv.tests.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium opacity-75 mb-1">Tests Requested:</p>
                  <div className="flex flex-wrap gap-1">
                    {inv.tests.map((test, tIdx) => (
                      <span key={tIdx} className="badge badge-outline badge-xs">
                        {typeof test === 'string' ? test : test.name || test.code || '—'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabInvestigationRequestCard;
