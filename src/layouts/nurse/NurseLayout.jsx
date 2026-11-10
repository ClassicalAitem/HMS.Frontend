import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/nurse/dashboard';

const NurseLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen((prev) => !prev);
      } else {
        setIsDesktopCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-base-200">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-all duration-300 ease-in-out lg:static ${
          isDesktopCollapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'lg:w-64 lg:translate-x-0 lg:opacity-100'
        } ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden bg-base-200">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default NurseLayout;
