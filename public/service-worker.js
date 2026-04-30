/**
 * Athena Service Worker
 * Strategy:
 *   - Cache-first for all static assets
 *   - Network-first for /.netlify/functions/* (API calls)
 *   - Offline fallback for function failures
 */

const CACHE_NAME = 'athena-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Precache failed (non-fatal):', err);
        return self.skipWaiting();
      })
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin and Google Fonts (for offline caching)
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes('fonts.googleapis.com') &&
    !url.hostname.includes('fonts.gstatic.com')
  ) {
    return; // Let browser handle cross-origin requests normally
  }

  // Network-first for Netlify Functions (API calls should always be fresh)
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for everything else (static assets, fonts)
  event.respondWith(cacheFirst(request));
});

// ─── Strategies ──────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/index.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    return new Response(
      JSON.stringify({ error: 'You appear to be offline. Please check your connection.' }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
