import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import ShortcutsCheatSheetModal from './ShortcutsCheatSheetModal';
import { LogoutModal } from '@/components/modals';
import { 
  hasActiveTextSelection, 
  transformActiveInputSelection, 
  insertClinicalTimestamp 
} from '@/utils/textTransformShortcuts';
import { getRolePatientsPath } from './Header';
import toast from 'react-hot-toast';

const GlobalShortcutManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const normalizedRole = (user?.role || user?.accountType || '').toLowerCase().trim().replace(/_/g, '-');
  const staffName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Expose cheat sheet toggle on window
  useEffect(() => {
    window.openShortcutsGuide = () => setIsCheatSheetOpen(true);
    return () => {
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
        return '/cashier/dashboard';
      case 'front-desk':
      case 'frontdesk':
      case 'receptionist':
        return '/frontdesk/dashboard';
      case 'pharmacist':
        return '/dashboard/pharmacist';
      case 'medical-director':
        return '/dashboard/medical-director';
      case 'surgeon':
        return '/dashboard/surgeon';
      case 'medical-laboratory':
      case 'laboratory':
      case 'lab-technician':
        return '/dashboard/laboratory/incoming';
      case 'admin':
        return '/dashboard/admin';
      case 'super-admin':
      case 'superadmin':
        return '/dashboard/superadmin';
      case 'hmo':
        return '/dashboard/hmo';
      case 'sonographer':
        return '/dashboard/sonographer';
      case 'developer':
      case 'it-support':
        return '/developer/system-health';
      default:
        return '/';
    }
  }, [normalizedRole]);

  const getRoleIncomingPath = useCallback(() => {
    switch (normalizedRole) {
      case 'doctor':
        return '/dashboard/doctor/incoming';
      case 'medical-director':
        return '/dashboard/medical-director/incoming';
      case 'nurse':
        return '/dashboard/nurse/incoming';
      case 'pharmacist':
        return '/dashboard/pharmacist/incoming';
      case 'sonographer':
        return '/dashboard/sonographer/incoming';
      case 'medical-laboratory':
      case 'laboratory':
      case 'lab-technician':
        return '/dashboard/laboratory/incoming';
      case 'hmo':
        return '/dashboard/hmo/incoming';
      case 'cashier':
      case 'account-officer':
        return '/cashier/incoming';
      default:
        return null;
    }
  }, [normalizedRole]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      );

      // =========================================================================
      // 1. Ctrl + B (Format highlighted text as Bold / Undo Bold on second press)
      // =========================================================================
      if (isCtrlOrCmd && !e.shiftKey && (key === 'b' || code === 'KeyB')) {
        e.preventDefault();
        e.stopPropagation();
        if (hasActiveTextSelection() || isEditable) {
          const res = transformActiveInputSelection('bold');
          if (res) {
            if (res.action === 'normal') {
              toast.success('Removed Bold formatting (Normal text)', { id: 'sc-tx', duration: 1500 });
            } else {
              toast.success('Formatted selection as Bold', { id: 'sc-tx', duration: 1500 });
            }
          }
        }
        return;
      }

      // =========================================================================
      // 2. Ctrl + L (Undo Bold formatting / restore normal text)
      // =========================================================================
      if (isCtrlOrCmd && !e.shiftKey && (key === 'l' || code === 'KeyL')) {
        if (hasActiveTextSelection() || isEditable) {
          e.preventDefault();
          e.stopPropagation();
          const transformed = transformActiveInputSelection('unbold');
          if (transformed) {
            toast.success('Removed Bold formatting (Normal text)', { id: 'sc-tx', duration: 1500 });
          }
        }
        return;
      }

      // =========================================================================
      // 3. Ctrl + K (Fast Patient Search: Instantly focus search on Patient Search page)
      // =========================================================================
      if (isCtrlOrCmd && !e.shiftKey && (key === 'k' || code === 'KeyK')) {
        e.preventDefault();
        e.stopPropagation();

        const patientsRoute = getRolePatientsPath(normalizedRole);
        const isOnPatientsPage = location.pathname === patientsRoute;

        if (!isOnPatientsPage) {
          navigate(patientsRoute, { state: { focusSearch: true } });
        } else {
          window.dispatchEvent(new CustomEvent('focus-header-search'));
        }
        return;
      }

      // =========================================================================
      // 4. Ctrl + I (Fast Navigation to Role Incoming Page)
      // =========================================================================
      if (isCtrlOrCmd && !e.shiftKey && !e.altKey && (key === 'i' || code === 'KeyI')) {
        const incomingRoute = getRoleIncomingPath();
        if (incomingRoute) {
          e.preventDefault();
          e.stopPropagation();
          if (location.pathname !== incomingRoute) {
            navigate(incomingRoute);
            toast.success('Navigated to Incoming Queue', { id: 'sc-incoming', duration: 1500 });
          }
        }
        return;
      }

      // =========================================================================
      // 5. Ctrl + E (Quick Log Out / Exit Session Modal)
      // =========================================================================
      if (isCtrlOrCmd && !e.shiftKey && !e.altKey && (key === 'e' || code === 'KeyE')) {
        e.preventDefault();
        e.stopPropagation();
        setIsLogoutModalOpen(true);
        return;
      }

      // =========================================================================
      // 3. Text Transformations inside Inputs / Textareas / Editors
      // =========================================================================
      if (isCtrlOrCmd && e.shiftKey && (key === 'u' || code === 'KeyU')) {
        e.preventDefault();
        const done = transformActiveInputSelection('upper');
        if (done) toast.success('Converted to UPPERCASE', { id: 'sc-tx', duration: 1500 });
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && (key === 'l' || code === 'KeyL')) {
        e.preventDefault();
        const done = transformActiveInputSelection('lower');
        if (done) toast.success('Converted to lowercase', { id: 'sc-tx', duration: 1500 });
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && (key === 'c' || code === 'KeyC')) {
        e.preventDefault();
        const done = transformActiveInputSelection('title');
        if (done) toast.success('Converted to Title Case', { id: 'sc-tx', duration: 1500 });
        return;
      }

      if (isCtrlOrCmd && e.altKey && (key === 't' || code === 'KeyT')) {
        e.preventDefault();
        const done = insertClinicalTimestamp(staffName);
        if (done) toast.success('Inserted Clinical Timestamp', { id: 'sc-tx', duration: 1500 });
        return;
      }

      // =========================================================================
      // 4. Ctrl + Enter Quick Submit (Active inside forms / text areas)
      // =========================================================================
      if (isCtrlOrCmd && key === 'enter') {
        window.dispatchEvent(new CustomEvent('quick-form-submit'));
        return;
      }

      // =========================================================================
      // 5. Ctrl + / or '?' (Shortcuts Cheat Sheet)
      // =========================================================================
      if ((isCtrlOrCmd && key === '/') || (!isCtrlOrCmd && !isEditable && (key === '?' || key === '/'))) {
        e.preventDefault();
        setIsCheatSheetOpen((prev) => !prev);
        return;
      }

      // =========================================================================
      // 6. Alt + D (Jump to Role Dashboard)
      // =========================================================================
      if (e.altKey && !isCtrlOrCmd && (key === 'd' || code === 'KeyD')) {
        e.preventDefault();
        const targetPath = getDashboardPath();
        if (targetPath && location.pathname !== targetPath) {
          navigate(targetPath);
          toast.success('Navigated to Dashboard', { id: 'nav-dash', duration: 1500 });
        }
        return;
      }

      // =========================================================================
      // 7. Ctrl + Shift + R (Fast Table Refresh)
      // =========================================================================
      if (isCtrlOrCmd && e.shiftKey && (key === 'r' || code === 'KeyR')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('fast-refresh-table'));
        toast.success('Refreshing data...', { id: 'table-refresh', duration: 1200 });
        return;
      }

      // =========================================================================
      // 8. Alt + 1..7 (Switch Admission Clinical Tabs / On-page Tabs)
      // =========================================================================
      const isAltDigit = e.altKey && !isCtrlOrCmd && (
        ['1', '2', '3', '4', '5', '6', '7'].includes(key) ||
        ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7',
         'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7'].includes(code)
      );
      if (isAltDigit) {
        e.preventDefault();
        let tabIndex = parseInt(key, 10);
        if (!tabIndex || isNaN(tabIndex)) {
          tabIndex = parseInt(code.replace(/\D/g, ''), 10);
        }
        if (!tabIndex || tabIndex < 1 || tabIndex > 7) return;

        // A. If on Admission / Inpatient Clinical Record page (Doctor, Nurse, Pharmacist)
        const isAdmissionPage = 
          location.pathname.includes('/admitted') || 
          location.pathname.includes('/admissions');

        if (isAdmissionPage) {
          window.dispatchEvent(new CustomEvent('switch-admission-tab', { detail: { tabNum: tabIndex } }));
          const doctorNurseTabs = ['Vitals Chart', 'Ward Rounds', 'Treatment Plan', 'Blood Transfusion', 'IV Fluid Balance', 'Exchange Transfusion', 'Neonatal Care'];
          const tabLabel = doctorNurseTabs[tabIndex - 1] || `Tab ${tabIndex}`;
          toast.success(`Switched to: ${tabLabel}`, { id: 'alt-tab', duration: 1200 });
          return;
        }

        // B. General on-page tab buttons
        window.dispatchEvent(new CustomEvent('switch-patient-tab', { detail: { index: tabIndex } }));
        const onPageTabs = Array.from(
          document.querySelectorAll('[role="tab"], .tab, button[data-tab], [data-tab-btn], [data-tab-index]')
        ).filter((el) => el.offsetParent !== null);

        if (onPageTabs.length >= tabIndex) {
          const targetTab = onPageTabs[tabIndex - 1];
          targetTab.click();
          targetTab.focus?.();
          toast.success(`Switched to Tab ${tabIndex}`, { id: 'alt-tab', duration: 1000 });
          return;
        }
        return;
      }

      // =========================================================================
      // 9. Alt + N (Quick New Registration / OPD Ticket)
      // =========================================================================
      if (e.altKey && !isCtrlOrCmd && (key === 'n' || code === 'KeyN')) {
        e.preventDefault();
        if (['front-desk', 'frontdesk', 'admin'].includes(normalizedRole)) {
          navigate('/frontdesk/registration');
        } else if (['super-admin', 'superadmin'].includes(normalizedRole)) {
          navigate('/superadmin/registration');
        } else if (['cashier', 'account-officer'].includes(normalizedRole)) {
          navigate('/cashier/opd-patients/new');
        } else {
          navigate(getRolePatientsPath(normalizedRole));
        }
        return;
      }

      // =========================================================================
      // 11. Esc (Close Modals)
      // =========================================================================
      if (key === 'escape') {
        setIsCheatSheetOpen(false);
        setIsLogoutModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [getDashboardPath, getRoleIncomingPath, location.pathname, navigate, normalizedRole, staffName]);

  return (
    <>
      <ShortcutsCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};

export default GlobalShortcutManager;
