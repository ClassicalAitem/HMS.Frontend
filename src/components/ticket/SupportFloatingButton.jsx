import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import {
  FaLifeRing,
  FaTicketAlt,
  FaPlus,
  FaListUl,
  FaTimes,
} from 'react-icons/fa';
import QuickReportModal from './QuickReportModal';
import { getTicketStats } from '@/services/api/ticketAPI';

const SupportFloatingButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  // Fetch quick ticket stats
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await getTicketStats();
        if (res?.data && isMounted) {
          setOpenCount(res.data.open || 0);
        }
      } catch (err) {
        // Silently catch stats error
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // refresh every minute

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Don't display on auth pages (login, forgot-password)
  const isAuthPage =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname.startsWith('/change-password');

  if (!isAuthenticated || isAuthPage) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-2 group">
        
        {/* Expanded mini-menu */}
        {isMenuOpen && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-fadeIn">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/tickets');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-100 text-base-content border border-base-200 shadow-lg hover:bg-base-200 transition-all text-xs font-semibold"
            >
              <FaListUl className="w-3.5 h-3.5 text-primary" />
              <span>Support & Tickets Hub</span>
              {openCount > 0 && (
                <span className="badge badge-warning badge-xs px-1.5 py-0.5 text-[10px] font-bold">
                  {openCount} open
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-content shadow-lg hover:brightness-110 transition-all text-xs font-bold"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>Report Issue Now</span>
            </button>
          </div>
        )}

        {/* Floating Trigger Button */}
        <div className="flex items-center gap-2">
          {/* Quick hover pill */}
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-base-100 border border-base-200 text-xs font-medium text-base-content shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Report Issue / Tickets
          </span>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-primary/80 text-primary-content shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden ring-4 ring-primary/20"
            title="Help & Issue Reporting"
            aria-label="Help & Issue Reporting"
          >
            {isMenuOpen ? (
              <FaTimes className="w-5 h-5 transition-transform rotate-90" />
            ) : (
              <FaLifeRing className="w-5 h-5 animate-pulse" />
            )}

            {/* Notification Badge if open tickets */}
            {openCount > 0 && !isMenuOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-error text-[10px] font-black text-white shadow-xs">
                {openCount > 9 ? '9+' : openCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Quick Report Modal */}
      <QuickReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Refresh stats
          getTicketStats().then((res) => {
            if (res?.data) setOpenCount(res.data.open || 0);
          }).catch(() => {});
        }}
      />
    </>
  );
};

export default SupportFloatingButton;

