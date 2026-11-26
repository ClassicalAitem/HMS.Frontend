import React, { useState, useEffect } from "react";
import chatAPI from "@/services/api/chatAPI";
import {
  FaTimes,
  FaCheckDouble,
  FaCheck,
  FaInfoCircle,
  FaSpinner,
  FaHospitalUser,
  FaClock,
} from "react-icons/fa";

const formatExactTime = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }

  const dateStr = d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
  return `${dateStr} at ${timeStr}`;
};

export const MessageInfoModal = ({ isOpen, onClose, message }) => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!isOpen || !message?.id) {
      setInfo(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    chatAPI
      .getMessageInfo(message.id)
      .then((res) => {
        if (isMounted) {
          setInfo(res?.data || null);
        }
      })
      .catch((err) => {
        console.error("Failed to load message info:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, message?.id]);

  if (!isOpen) return null;

  const readByList = info?.readBy || [];
  const unreadByList = info?.unreadBy || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-base-100 shadow-2xl border border-base-300 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200/50">
          <div className="flex items-center gap-2 text-base-content">
            <FaInfoCircle className="text-primary text-sm" />
            <h3 className="text-sm font-bold">Message Info</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
          >
            <FaTimes />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 border-b border-base-200 bg-base-100">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs">
            {message?.patientRefId && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold mb-1.5 bg-primary/20 text-primary border border-primary/30">
                <FaHospitalUser className="text-[10px]" />
                <span>Patient: {message.patientRefId}</span>
              </div>
            )}
            <p className="whitespace-pre-wrap leading-relaxed text-base-content font-medium">
              {message?.content}
            </p>
            <div className="text-[10px] text-base-content/50 mt-2 flex items-center gap-1">
              <FaClock className="text-[9px]" />
              <span>Sent: {formatExactTime(message?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Info Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-base-content/50">
              <FaSpinner className="animate-spin text-primary" /> Loading read receipts...
            </div>
          ) : (
            <>
              {/* Read Section */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-500 mb-2">
                  <FaCheckDouble className="text-xs" />
                  <span>
                    Read by {readByList.length > 0 ? `(${readByList.length})` : "— Not viewed yet"}
                  </span>
                </div>

                {readByList.length === 0 ? (
                  <p className="text-xs text-base-content/40 italic px-2 py-1">
                    No recipients have viewed this message yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {readByList.map((viewer, i) => (
                      <div
                        key={`${viewer.userId}-${i}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-base-200/50 border border-base-300 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[11px] shrink-0 uppercase">
                            {viewer.userName?.charAt(0) || "S"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-base-content truncate">
                              {viewer.userName}
                            </div>
                            <span className="badge badge-2xs badge-ghost text-[8px] uppercase tracking-wider">
                              {viewer.userRole ? viewer.userRole.replace(/-/g, " ") : "Staff"}
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] text-base-content/60 font-mono shrink-0 pl-2">
                          {formatExactTime(viewer.readAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivered / Unread Section for groups */}
              {unreadByList.length > 0 && (
                <div className="pt-2 border-t border-base-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-base-content/60 mb-2">
                    <FaCheck className="text-xs" />
                    <span>Delivered / Not yet read ({unreadByList.length})</span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {unreadByList.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200/40 text-xs transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-base-300 text-base-content/60 font-semibold flex items-center justify-center text-[10px] shrink-0 uppercase">
                            {user.userName?.charAt(0) || "S"}
                          </div>
                          <span className="text-base-content/80 font-medium">
                            {user.userName}
                          </span>
                        </div>
                        <span className="badge badge-2xs badge-ghost text-[8px] uppercase">
                          {user.userRole ? user.userRole.replace(/-/g, " ") : "Staff"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-base-300 bg-base-200/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
