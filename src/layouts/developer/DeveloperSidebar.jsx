import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTicketAlt,
  FaTerminal,
  FaHeartbeat,
  FaSignOutAlt,
  FaCode,
  FaShieldAlt,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { LogoutModal } from '@/components/modals';
import { useAppSelector } from '@/store/hooks';

const DeveloperSidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const initials = `${user?.firstName?.[0] || 'D'}${user?.lastName?.[0] || 'V'}`.toUpperCase();
  const roleDisplay = user?.role === 'it-support' || user?.accountType === 'it-support'
    ? 'IT Support Specialist'
    : 'Software Developer';

  const menuItems = [
    {
      icon: FaTicketAlt,
      label: 'Bug & Support Tickets',
      path: '/developer/tickets',
      active: location.pathname === '/developer/tickets' || location.pathname.startsWith('/tickets'),
      badge: 'Support',
    },
    {
      icon: FaTerminal,
      label: 'Live Server Logs',
      path: '/developer/logs',
      active: location.pathname === '/developer/logs',
      badge: 'Live',
    },
    {
      icon: FaHeartbeat,
      label: 'System & API Health',
      path: '/developer/health',
      active: location.pathname === '/developer/health',
    },
    {
      icon: FaShieldAlt,
      label: 'Audit Trail Logs',
      path: '/dashboard/superadmin/audit-logs',
      active: location.pathname === '/dashboard/superadmin/audit-logs',
    },
  ];

  return (
    <aside className="flex flex-col h-full w-full bg-[#0f172a] text-[#f8fafc] border-r border-slate-800 shadow-xl select-none">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <FaCode className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
              <span>HMS DEV CONSOLE</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider block">
              DIAGNOSTICS & TELEMETRY
            </span>
          </div>
        </div>
      </div>

      {/* User Info Capsule */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-200 truncate capitalize">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-[10px] text-cyan-400 font-medium truncate flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>{roleDisplay}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 px-3 py-1">
          Engineering Navigation
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseSidebar}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                item.active
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    item.active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-semibold"
        >
          <FaSignOutAlt className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {isLogoutModalOpen && (
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
        />
      )}
    </aside>
  );
};

export default DeveloperSidebar;

