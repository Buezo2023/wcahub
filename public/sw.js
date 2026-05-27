// WCA Hub Service Worker
// VERSION injected at build time via sw-version.js
// DO NOT edit CACHE_VERSION manually — it's auto-updated on deploy

const CACHE_VERSION = self.__WCA_BUILD_ID__ || 'wca-v1';
const CACHE         = `wca-hub-${CACHE_VERSION}`;
const STATIC = ["/", "/index.html", "/manifest.json", "/favicon.svg"];

// Install: pre-cache shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate: delete old caches, notify ONLY if this was a real update (not first install)
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => {
        const oldCaches = keys.filter(k => k !== CACHE);
        const isRealUpdate = oldCaches.length > 0; // false on first install
        return Promise.all(oldCaches.map(k => caches.delete(k)))
          .then(() => self.clients.claim())
          .then(() => {
            if (!isRealUpdate) return; // first install — don't notify
            return self.clients.matchAll({ type: "window" }).then(clients => {
              clients.forEach(client => client.postMessage({ type: "SW_UPDATED" }));
            });
          });
      })
  );
});

// Fetch strategy
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never cache: API, auth, Supabase, external
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname !== self.location.hostname
  ) return;

  // Assets (hashed names) — cache-first, always valid due to content hash
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // Static files — stale-while-revalidate
  if ([".svg", ".css", ".webp", ".png", ".ico"].some(ext => url.pathname.endsWith(ext))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        });
        return cached || network;
      })
    );
    return;
  }

  // SPA navigation — network-first, fallback to index.html (offline)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }
});

// Push notifications
self.addEventListener("push", e => {
  if (!e.data) return;
  const { title = "WCA Hub", body = "", icon = "/icon-192.svg", url = "/portal" } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge: "/favicon.svg",
      data: { url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url || "/portal";
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(ws => {
      const existing = ws.find(w => w.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
