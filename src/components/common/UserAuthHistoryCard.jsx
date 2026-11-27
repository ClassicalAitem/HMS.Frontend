import React, { useState, useEffect, useMemo } from "react";
import { FaHistory, FaSignInAlt, FaSignOutAlt, FaShieldAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import usersAPI from "@/services/api/usersAPI";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const PAGE_SIZE = 10;

const UserAuthHistoryCard = ({ userId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getUserAuthHistory(userId);
        const list = res?.data?.data || res?.data || [];
        if (active) {
          setLogs(Array.isArray(list) ? list : []);
          setPage(1);
        }
      } catch (err) {
        console.error("Failed to load auth history:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, page]);

  return (
    <div className="card bg-base-100 border border-base-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-base-200 pb-3">
        <div className="flex items-center gap-2">
          <FaHistory className="text-primary text-sm" />
          <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
            Login & Logout History
          </h3>
        </div>
        <span className="badge badge-outline badge-sm font-semibold">
          {logs.length} {logs.length === 1 ? "Event" : "Events"}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-6 text-xs text-base-content/50">
          No login or logout events recorded for this user yet.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-xs sm:table-sm w-full">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>IP Address</th>
                  <th>Browser / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {paginatedLogs.map((item, idx) => (
                  <tr key={item._id || `${item.createdAt}-${idx}`} className="hover:bg-base-200/30">
                    <td className="font-mono text-[11px] whitespace-nowrap">
                      {formatNigeriaDateTime(item.createdAt)}
                    </td>
                    <td>
                      {item.event === "login" && (
                        <span className="badge badge-success badge-xs text-white gap-1 font-semibold">
                          <FaSignInAlt className="w-2.5 h-2.5" /> Login
                        </span>
                      )}
                      {item.event === "logout" && (
                        <span className="badge badge-ghost badge-xs gap-1 font-semibold">
                          <FaSignOutAlt className="w-2.5 h-2.5" /> Logout
                        </span>
                      )}
                      {item.event === "force_logout" && (
                        <span className="badge badge-error badge-xs text-white gap-1 font-semibold">
                          <FaShieldAlt className="w-2.5 h-2.5" /> Force Logout
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-[11px] text-base-content/70">
                      {item.ipAddress || "—"}
                    </td>
                    <td className="text-[11px] text-base-content/70 max-w-xs truncate" title={item.userAgent}>
                      {item.userAgent || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-base-200 text-xs">
              <span className="text-base-content/60">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-xs btn-ghost bg-base-200/70"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn btn-xs btn-ghost bg-base-200/70"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserAuthHistoryCard;
