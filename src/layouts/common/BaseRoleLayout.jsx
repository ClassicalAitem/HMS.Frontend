import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';

/**
 * Unified Layout Shell for all role-based dashboards in KOLAK HMS.
 * Ensures consistent styling, background, drawer behavior, desktop collapse,
 * and padding across all roles.
 */
const BaseRoleLayout = ({ children, Sidebar, sidebarProps = {} }) => {
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
    <div className="flex h-screen w-full overflow-hidden bg-base-300/20">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar backdrop"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-all duration-300 ease-in-out lg:static ${
          isDesktopCollapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'lg:w-64 lg:translate-x-0 lg:opacity-100'
        } ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {Sidebar && <Sidebar onCloseSidebar={closeSidebar} {...sidebarProps} />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-2 py-1 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default BaseRoleLayout;

