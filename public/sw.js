// Service worker mínimo: permite abrir la app sin conexión.
// - Navegación: red primero, con copia en caché como respaldo.
// - Recursos estáticos de Next (_next/static, iconos): caché primero.
//
// Funciona en la raíz o en una subruta (GitHub Pages): la base se deduce del
// ámbito en el que se registró este archivo, p. ej. "/koko/".
const BASE = new URL(self.registration.scope).pathname;
const CACHE = "koko-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([BASE])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(BASE, copy));
          return res;
        })
        .catch(() => caches.match(BASE)),
    );
    return;
  }

  if (url.pathname.startsWith(`${BASE}_next/static/`) || url.pathname.startsWith(`${BASE}icons/`)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
