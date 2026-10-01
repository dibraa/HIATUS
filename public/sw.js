/*
 * Hiatus service worker — browser push only.
 *
 * Runs in the background, outside any open tab, so a "your order is ready"
 * push still shows when the site is closed. Deliberately does no caching:
 * an offline cache is a separate decision with its own staleness bugs.
 *
 * Payload (sent by src/lib/push-server.ts):
 *   { title, body, url, tag }
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Hiatus Coffee", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Hiatus Coffee", {
      body: data.body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      // One notification per order: a newer status replaces the older one
      // instead of stacking "Preparing" under "Ready".
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/orders" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/orders", self.location.origin).href;

  // Reuse a tab that is already on this site rather than opening another.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      for (const tab of tabs) {
        if (new URL(tab.url).origin === self.location.origin && "focus" in tab) {
          return tab.navigate(target).then((t) => (t || tab).focus());
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
