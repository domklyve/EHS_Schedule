// service-worker.js
const CACHE_NAME = 'ehs-schedule-v4'; // increment with each update
const CORE_HTML = ['./', './index.html'];
const ASSETS = [
  './manifest.json',
  './icon-128.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...CORE_HTML, ...ASSETS]))
  );
  self.skipWaiting();         // make this SW activate ASAP
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();       // new SW starts controlling open pages
});

// Helper: cache put safely (opaque responses etc.)
async function putInCache(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (e) {
    // ignore caching errors (e.g., opaque)
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // 1) Network-first for HTML (navigation and index.html)
  const isHTML =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname === '/' || url.pathname.endsWith('/');

  if (isHTML) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: 'no-store' });
          return putInCache(req, fresh);
        } catch {
          const cached = await caches.match(req) || await caches.match('./index.html');
          return cached;
        }
      })()
    );
    return;
  }

  // 2) Stale-while-revalidate for everything else (icons, manifest, etc.)
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const fetchPromise = fetch(req).then((resp) => putInCache(req, resp)).catch(() => null);
      return cached || (await fetchPromise) || new Response('', { status: 504 });
    })()
  );
});
