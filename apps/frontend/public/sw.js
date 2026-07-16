// apps/frontend/public/sw.js

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    // Validate notification version (requirement 2)
    if (data.version !== 1) {
      console.warn("Unsupported push notification payload version:", data.version);
      return;
    }

    const title = data.title || "سكني | Sakani";
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url, // Path to navigate to, e.g. /dashboard/support
      },
    };

    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Requirement 1 & 9: Check if application is active and visible
        const isAppOpen = clientList.some((client) => client.visibilityState === "visible");
        
        if (isAppOpen) {
          // Broadcast event to active client tabs to refresh cache silently
          clientList.forEach((client) => {
            client.postMessage({ type: "PUSH_RECEIVED", payload: data });
          });
          return; // Suppress notification display
        }
        
        // Show native browser notification if app is closed/hidden
        return self.registration.showNotification(title, options);
      })
    );
  } catch (error) {
    console.error("Error processing push event:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url;

  if (targetUrl) {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Try to find and focus an existing app tab
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.navigate(targetUrl).then((c) => c.focus());
          }
        }
        
        // If no app tab is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  }
});
