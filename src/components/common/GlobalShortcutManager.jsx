import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import UniversalPatientSearchModal from './UniversalPatientSearchModal';
import ShortcutsCheatSheetModal from './ShortcutsCheatSheetModal';
import { transformActiveInputSelection, insertClinicalTimestamp } from '@/utils/textTransformShortcuts';
import toast from 'react-hot-toast';

const GlobalShortcutManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const normalizedRole = (user?.role || user?.accountType || '').toLowerCase().trim().replace(/_/g, '-');
  const staffName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // Expose toggle functions on window for header buttons or programmatic triggers
  useEffect(() => {
    window.openUniversalSearch = () => setIsSearchOpen(true);
    window.openShortcutsGuide = () => setIsCheatSheetOpen(true);
    return () => {
      delete window.openUniversalSearch;
      delete window.openShortcutsGuide;
    };
  }, []);

  const getDashboardPath = useCallback(() => {
    switch (normalizedRole) {
      case 'doctor':
        return '/dashboard/doctor';
      case 'nurse':
        return '/dashboard/nurse';
      case 'cashier':
      case 'account-officer':
        return '/dashboard/cashier';
      case 'front-desk':
      case 'frontdesk':
        return '/frontdesk/dashboard';
      case 'pharmacist':
        return '/dashboard/pharmacist';
      case 'medical-director':
        return '/dashboard/medical-director';
      case 'surgeon':
        return '/dashboard/surgeon';
      case 'medical-laboratory':
      case 'lab-technician':
        return '/dashboard/laboratory/incoming';
      case 'admin':
        return '/admin/dashboard';
      case 'super-admin':
        return '/superadmin/dashboard';
      case 'hmo':
        return '/hmo/dashboard';
      case 'developer':
      case 'it-support':
        return '/developer/system-health';
      default:
        return '/';
    }
  }, [normalizedRole]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      );

      // 1. Text Transformation Shortcuts (Works inside active text fields)
      if (isCtrlOrCmd && e.shiftKey && e.code === 'KeyU') {
        e.preventDefault();
        const done = transformActiveInputSelection('upper');
        if (done) toast.success('Converted to UPPERCASE', { id: 'sc-tx', duration: 1500 });
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && e.code === 'KeyL') {
        e.preventDefault();
        const done = transformActiveInputSelection('lower');
        if (done) toast.success('Converted to lowercase', { id: 'sc-tx', duration: 1500 });
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && e.code === 'KeyC') {
        e.preventDefault();
        const done = transformActiveInputSelection('title');
        if (done) toast.success('Converted to Title Case', { id: 'sc-tx', duration: 1500 });
        return;
      }

      if (isCtrlOrCmd && e.altKey && e.code === 'KeyT') {
        e.preventDefault();
        const done = insertClinicalTimestamp(staffName);
        if (done) toast.success('Inserted Clinical Timestamp', { id: 'sc-tx', duration: 1500 });
        return;
      }

      // 2. Ctrl + Enter Quick Submit (Active inside forms / text areas)
      if (isCtrlOrCmd && e.key === 'Enter') {
        window.dispatchEvent(new CustomEvent('quick-form-submit'));
        return;
      }

      // 3. Ctrl + B: Toggle Sidebar (Across all pages)
      if (isCtrlOrCmd && !e.shiftKey && e.code === 'KeyB') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
        return;
      }

      // 4. Ctrl + K: Universal Patient Fast Search
      if (isCtrlOrCmd && !e.shiftKey && e.code === 'KeyK') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      // 5. Ctrl + /: Shortcuts Cheat Sheet
      if (isCtrlOrCmd && e.key === '/') {
        e.preventDefault();
        setIsCheatSheetOpen((prev) => !prev);
        return;
      }

      // 6. '?' (Shift + /) when NOT typing in an input
      if (!isCtrlOrCmd && !isEditable && e.key === '?') {
        e.preventDefault();
        setIsCheatSheetOpen(true);
        return;
      }

      // 7. Alt + D: Jump to Role Dashboard
      if (e.altKey && !isCtrlOrCmd && e.code === 'KeyD') {
        e.preventDefault();
        const targetPath = getDashboardPath();
        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath);
          toast.success('Navigated to Dashboard', { id: 'nav-dash', duration: 1500 });
        }
        return;
      }

      // 8. Ctrl + Shift + R: Fast Table Refresh (re-fetch current view without full page reload)
      if (isCtrlOrCmd && e.shiftKey && e.code === 'KeyR') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('fast-refresh-table'));
        toast.success('Refreshing data...', { id: 'table-refresh', duration: 1500 });
        return;
      }

      // 9. Alt + 1..5: Quick Tab Switching in Patient Chart
      if (e.altKey && !isCtrlOrCmd && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key, 10);
        window.dispatchEvent(new CustomEvent('switch-patient-tab', { detail: { index: tabIndex } }));
        return;
      }

      // 10. Alt + N: Quick New Patient Registration / Ticket
      if (e.altKey && !isCtrlOrCmd && e.code === 'KeyN') {
        e.preventDefault();
        if (['front-desk', 'frontdesk', 'admin', 'super-admin'].includes(normalizedRole)) {
          navigate('/frontdesk/registration');
        } else {
          window.dispatchEvent(new CustomEvent('quick-new-patient'));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getDashboardPath, location.pathname, navigate, normalizedRole, staffName]);

  return (
    <>
      <UniversalPatientSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ShortcutsCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />
    </>
  );
};

export default GlobalShortcutManager;

