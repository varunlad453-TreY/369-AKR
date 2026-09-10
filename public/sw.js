const CACHE_NAME = 'akr-sop-cache-v1';
const PRECACHE_RESOURCES = [
  '/',
  '/portal',
  '/gateway',
  '/images/logo/logo-horizontal.svg',
  '/images/logo/logo-icon.svg',
  '/manifest.json',
];

// Install: Precache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_RESOURCES))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[ServiceWorker] Precache warning:', err);
      })
  );
});

// Activate: Clean up older cache namespaces
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests; POST/PATCH are handled by client & IndexedDB queue
  if (request.method !== 'GET') {
    return;
  }

  // Handle static assets & images: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Handle page navigation: Network-First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/portal');
          return fallback || new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>369 AKR Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{background:#06090e;color:#fff;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}h1{color:#FFD23F;font-size:1.5rem;}p{color:#94a3b8;font-size:0.9rem;max-width:400px;line-height:1.5;}button{margin-top:20px;padding:10px 20px;background:#FFD23F;color:#000;border:none;border-radius:8px;font-weight:bold;cursor:pointer;}</style></head><body><h1>ROOFTOP OFFLINE VAULT ACTIVE</h1><p>You are disconnected from the network. Your captured proofs are safely cached in IndexedDB and will auto-sync once signal returns.</p><button onclick="window.location.reload()">Retry Connection</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }
});

// Background Sync: Triggered when device recovers connectivity
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-proof-uploads') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
        });
      })
    );
  }
});

// Message Listener from Client Window
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
