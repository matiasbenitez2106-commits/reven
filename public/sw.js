// Service worker mínimo para que trato sea instalable como PWA.
// No cachea contenido (un marketplace necesita datos frescos); solo provee el
// fetch handler que Chrome requiere para ofrecer "Instalar app".
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
