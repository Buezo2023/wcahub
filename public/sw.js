// WCA Hub Service Worker — v1
// Cache-first para assets estáticos, network-first para API y auth

const CACHE  = "wca-hub-v1";
const STATIC = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
];

// Instalar: pre-cache shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activar: limpiar versiones viejas
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: estrategia por tipo de recurso
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Nunca interceptar: auth, API, Supabase, fuentes externas
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("jsdelivr.net") ||
    url.hostname !== self.location.hostname
  ) {
    return; // pasa directo a la red
  }

  // Archivos JS/CSS/SVG del build — cache-first con revalidación
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
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

  // Navegación SPA — network-first, fallback a index.html
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }
});

// Push notifications (cuando se implemente)
self.addEventListener("push", e => {
  if (!e.data) return;
  const { title = "WCA Hub", body = "", icon = "/icon-192.svg" } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, { body, icon, badge: "/favicon.svg" })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow("/portal"));
});
