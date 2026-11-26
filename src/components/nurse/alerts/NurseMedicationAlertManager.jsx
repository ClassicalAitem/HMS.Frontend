import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { getAdmissionMedicationAlerts } from '@/services/api/nurseAPI';
import { getSocket } from '@/services/socket';
import audioAlert from '@/utils/audioAlert';
import MedicationAlertModal from './MedicationAlertModal';
import { FaPills, FaBell } from 'react-icons/fa';

const SNOOZE_STORAGE_KEY = 'hms_nurse_med_snooze';
const DISMISSED_STORAGE_KEY = 'hms_nurse_med_dismissed';

export const NurseMedicationAlertManager = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [allAlerts, setAllAlerts] = useState([]);
  const allAlertsRef = useRef([]);
  const [activeDueAlerts, setActiveDueAlerts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snoozeMap, setSnoozeMap] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SNOOZE_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [dismissedMap, setDismissedMap] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DISMISSED_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const role = String(user?.role || user?.accountType || '').toLowerCase();
  const isNurse = role === 'nurse';

  const pathname = (location.pathname || '').toLowerCase();

  // EXPLICIT CHECK:
  // Strictly prevent modal from appearing when nurses are on consulting / outpatient pages!
  const isConsultingRoute =
    pathname.startsWith('/dashboard/nurse/patient') ||
    pathname.startsWith('/dashboard/nurse/incoming') ||
    pathname.startsWith('/dashboard/nurse/appointments') ||
    pathname.startsWith('/dashboard/nurse/payment-records') ||
    pathname.startsWith('/dashboard/nurse/lab-results') ||
    pathname.startsWith('/dashboard/nurse/antenatal-records') ||
    pathname.startsWith('/dashboard/nurse/dependant');

  // ALLOWED PAGES: Nurse Dashboard OR any admission pages
  const isDashboardRoute =
    pathname === '/dashboard/nurse' || pathname === '/dashboard/nurse/';
  const isAdmissionRoute =
    pathname.startsWith('/dashboard/nurse/admitted') ||
    pathname.startsWith('/dashboard/nurse/view-admissions');

  const isEligibleLocation =
    !isConsultingRoute && (isDashboardRoute || isAdmissionRoute);
  const shouldMonitor = isAuthenticated && isNurse && isEligibleLocation;

  // If nurse navigates to a non-admission / consulting route, silence sound and close modal immediately
  useEffect(() => {
    if (!shouldMonitor) {
      audioAlert.stop();
      setIsModalOpen(false);
    }
  }, [shouldMonitor]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioAlert.stop();
    };
  }, []);

  const evaluateDueAlerts = useCallback(
    (alertsList) => {
      const now = Date.now();
      const currentSnooze = { ...snoozeMap };
      const currentDismissed = { ...dismissedMap };

      const filtered = (alertsList || []).filter((alert) => {
        if (alert.isAdministered) return false;

        // Dynamic in-memory clock check: alert is due if current time is within trigger window
        const schedTime = new Date(alert.scheduledDateTime).getTime();
        const triggerTime = new Date(alert.alertTriggerTime || schedTime - 10 * 60 * 1000).getTime();
        const overdueLimit = schedTime + 2 * 60 * 60 * 1000;
        const isCurrentlyDue = alert.isDue || (now >= triggerTime && now <= overdueLimit);

        if (!isCurrentlyDue) return false;

        // Check if snoozed
        const snoozedUntil = currentSnooze[alert.alertId];
        if (snoozedUntil && now < snoozedUntil) {
          return false;
        }

        // Check if dismissed for this scheduled window
        const dismissedAt = currentDismissed[alert.alertId];
        if (dismissedAt) {
          // If dismissed within the last 2 hours, keep dismissed
          if (now - dismissedAt < 2 * 60 * 60 * 1000) {
            return false;
          }
        }

        return true;
      });

      return filtered;
    },
    [snoozeMap, dismissedMap]
  );

  const fetchAlerts = useCallback(async () => {
    if (!shouldMonitor) return;

    try {
      const res = await getAdmissionMedicationAlerts();
      const list = res?.alerts || [];
      allAlertsRef.current = list;
      setAllAlerts(list);

      const due = evaluateDueAlerts(list);
      setActiveDueAlerts(due);

      if (due.length > 0) {
        setIsModalOpen(true);
        audioAlert.start();
      } else {
        audioAlert.stop();
        setIsModalOpen(false);
      }
    } catch (err) {
      // Quietly ignore background poll errors to avoid toast spam
      console.warn('NurseMedicationAlertManager: fetchAlerts error', err);
    }
  }, [shouldMonitor, evaluateDueAlerts]);

  // Event-driven & in-memory evaluation:
  // - Evaluates due alerts locally in memory every 30s with ZERO network requests
  // - Listens to WebSocket 'admission:medication-updated' to fetch fresh data instantly when medications change
  // - Performs relaxed background sync only every 5 minutes
  useEffect(() => {
    if (!shouldMonitor) return undefined;

    // Initial load
    fetchAlerts();

    // In-memory evaluation timer (checks local clock against scheduled doses without calling the server)
    const localTimer = setInterval(() => {
      if (allAlertsRef.current.length > 0) {
        const due = evaluateDueAlerts(allAlertsRef.current);
        setActiveDueAlerts(due);
        if (due.length > 0) {
          setIsModalOpen(true);
          audioAlert.start();
        } else {
          audioAlert.stop();
          setIsModalOpen(false);
        }
      }
    }, 30000);

    // Real-time WebSocket event listener
    const socket = getSocket();
    const handleMedUpdate = () => {
      fetchAlerts();
    };
    socket?.on('admission:medication-updated', handleMedUpdate);
    window.addEventListener('hms:medication-administered', handleMedUpdate);

    // Refresh when tab regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Relaxed background re-sync (every 5 minutes instead of 30 seconds)
    const bgSyncInterval = setInterval(() => {
      fetchAlerts();
    }, 300000);

    return () => {
      clearInterval(localTimer);
      clearInterval(bgSyncInterval);
      socket?.off('admission:medication-updated', handleMedUpdate);
      window.removeEventListener('hms:medication-administered', handleMedUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [shouldMonitor, fetchAlerts, evaluateDueAlerts]);

  const handleSnooze = (minutes = 5) => {
    audioAlert.stop();
    setIsModalOpen(false);

    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    const nextMap = { ...snoozeMap };
    activeDueAlerts.forEach((a) => {
      nextMap[a.alertId] = snoozeUntil;
    });

    setSnoozeMap(nextMap);
    try {
      sessionStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore
    }
  };

  const handleDismiss = () => {
    audioAlert.stop();
    setIsModalOpen(false);

    const now = Date.now();
    const nextDismissed = { ...dismissedMap };
    activeDueAlerts.forEach((a) => {
      nextDismissed[a.alertId] = now;
    });

    setDismissedMap(nextDismissed);
    try {
      sessionStorage.setItem(
        DISMISSED_STORAGE_KEY,
        JSON.stringify(nextDismissed)
      );
    } catch {
      // ignore
    }
  };

  const handleAdministerSuccess = (administeredAlert) => {
    // Immediately remove this alert from active list
    const updated = activeDueAlerts.filter(
      (a) => a.alertId !== administeredAlert.alertId
    );
    setActiveDueAlerts(updated);

    if (updated.length === 0) {
      audioAlert.stop();
      setIsModalOpen(false);
    }

    // Refresh data in background
    setTimeout(() => {
      fetchAlerts();
    }, 1500);
  };

  if (!shouldMonitor) return null;

  return (
    <>
      {/* Medication Alert Modal with Sound */}
      <MedicationAlertModal
        isOpen={isModalOpen}
        alerts={activeDueAlerts}
        onClose={() => {
          audioAlert.stop();
          setIsModalOpen(false);
        }}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
        onAdministerSuccess={handleAdministerSuccess}
      />

      {/* Floating Alert Pill indicator when alerts are active but modal was minimized/snoozed */}
      {!isModalOpen && activeDueAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce">
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              audioAlert.start();
            }}
            className="btn btn-warning text-warning-content shadow-2xl rounded-full gap-2 px-4 py-2 font-bold border-2 border-warning hover:scale-105 transition-all"
            title="Open Inpatient Medication Due Alerts"
          >
            <FaPills className="w-4 h-4 animate-spin" />
            <span>
              {activeDueAlerts.length}{' '}
              {activeDueAlerts.length === 1 ? 'Med Due' : 'Meds Due'}
            </span>
          </button>
        </div>
      )}
    </>
  );
};

export default NurseMedicationAlertManager;

