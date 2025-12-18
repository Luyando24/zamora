self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data?.json() ?? {};
  const title = data.title || 'New Notification';
  const message = data.body || 'You have a new update.';
  const icon = '/icon-192x192.png'; // Make sure this exists or use a default
  const tag = 'zamora-notification';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      icon: icon,
      badge: icon,
      tag: tag,
      data: data.url ? { url: data.url } : {},
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle click action
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          // If so, just focus it.
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  } else {
     // Default fallback
     event.waitUntil(
        clients.openWindow('/dashboard')
     );
  }
});
