self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let notification = {};
  try {
    notification = event.data ? event.data.json() : {};
  } catch {
    notification = {};
  }

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    const visibleWindow = windows.find((client) => client.visibilityState === 'visible');

    if (visibleWindow) {
      visibleWindow.postMessage({ type: 'WEB_PUSH_RECEIVED', notification });
      return;
    }

    await self.registration.showNotification(notification.title || 'Kolak HMS', {
      body: notification.body || 'There is an update in your work queue.',
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-192x192.png',
      data: { url: notification.url || '/dashboard' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    const existingWindow = windows.find((client) => client.focused) || windows[0];

    if (existingWindow) {
      try {
        await existingWindow.focus();
        existingWindow.postMessage({
          type: 'OPEN_NOTIFICATION_URL',
          url: targetUrl,
        });
      } catch {
        // Keep the existing tab if it cannot receive the navigation message.
      }
      return;
    }

    await self.clients.openWindow(targetUrl);
  })());
});