import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RiCloseLine, RiNotification3Line } from 'react-icons/ri';
import { useAppSelector } from '@/store/hooks';
import {
  getWebPushPublicKey,
  saveWebPushSubscription,
} from '@/services/api/notificationAPI';

const DISMISS_KEY = 'pushPromptDismissed';

const decodeApplicationServerKey = (value) => {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`;
  const decoded = window.atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const PushNotificationPrompt = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const userId = user?.id || user?._id;
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type !== 'OPEN_NOTIFICATION_URL') return;

      try {
        const target = new URL(event.data.url, window.location.origin);
        if (target.origin !== window.location.origin) return;
        navigate(`${target.pathname}${target.search}${target.hash}`);
      } catch (navigationError) {
        console.error('Unable to open notification destination:', navigationError);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [navigate]);

  const subscribeCurrentDevice = useCallback(async () => {
    const publicKey = await getWebPushPublicKey();
    if (!publicKey) {
      throw new Error('Browser notifications are not configured on this server.');
    }

    await navigator.serviceWorker.register('/service-worker.js');
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(publicKey),
      });
    }

    await saveWebPushSubscription(subscription.toJSON());
  }, []);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !userId ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      Notification.permission === 'denied'
    ) {
      setVisible(false);
      return undefined;
    }

    let cancelled = false;
    const prepareNotifications = async () => {
      try {
        const publicKey = await getWebPushPublicKey();
        if (!publicKey || cancelled) return;

        await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        if (Notification.permission === 'granted') {
          await subscribeCurrentDevice();
          if (!cancelled) setVisible(false);
        } else if (!sessionStorage.getItem(DISMISS_KEY)) {
          setVisible(true);
        }
      } catch (setupError) {
        console.warn('Unable to prepare browser notifications:', setupError);
      }
    };

    prepareNotifications();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, subscribeCurrentDevice, userId]);

  const enableNotifications = async () => {
    setBusy(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setVisible(false);
        return;
      }

      await subscribeCurrentDevice();
      sessionStorage.removeItem(DISMISS_KEY);
      setVisible(false);
    } catch (setupError) {
      console.error('Unable to enable browser notifications:', setupError);
      setError('Could not enable notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const dismissPrompt = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 28 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          role="status"
          className="fixed right-4 top-4 z-[100000] w-[min(92vw,390px)] rounded-lg border border-base-300 bg-base-100 p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <RiNotification3Line className="mt-0.5 shrink-0 text-xl text-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-base-content">Enable browser notifications</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square -mr-1 -mt-1"
                  onClick={dismissPrompt}
                  aria-label="Dismiss notification prompt"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
              <p className="mt-1 text-sm text-base-content/65">
                Get queue updates while Kolak is closed.
              </p>
              {error && <p className="mt-2 text-xs text-error">{error}</p>}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={enableNotifications}
                  disabled={busy}
                >
                  {busy ? <span className="loading loading-spinner loading-xs" /> : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationPrompt;