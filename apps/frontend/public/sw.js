// MMS Progressive Web App (PWA) Service Worker
// Multi-tenant caching isolation & offline client resilience

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `mms-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `mms-assets-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mms-dynamic-${CACHE_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 50;

/** Prunes oldest entries from dynamic cache when capacity threshold is reached. */
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    });
  });
}

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/platform-logo.webp',
  '/theme-init.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Continue even if an optional static precache asset fails
        console.warn('[MMS-SW] Precache incomplete:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![SHELL_CACHE, ASSET_CACHE, DYNAMIC_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Strict NetworkOnly for mutative requests and secure authentication / live stream endpoints
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/platform/auth') ||
    url.pathname.startsWith('/api/ws') ||
    url.pathname.startsWith('/ws') ||
    url.pathname.includes('/live') ||
    url.pathname.includes('/stream')
  ) {
    return; // Standard network fetch
  }

  // 2. CacheFirst for hashed static assets (/assets/*) and external web fonts
  const isHashedAsset = url.pathname.startsWith('/assets/');
  const isWebFont = url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com');

  if (isHashedAsset || isWebFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. StaleWhileRevalidate for non-critical tenant assets (public branding, uploads, icons)
  const isNonCriticalAsset =
    url.pathname.includes('/public-branding') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg');

  if (isNonCriticalAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
              trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
            });
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. NetworkFirst for SPA navigation requests with fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html').then((indexFallback) => {
          return indexFallback || caches.match('/');
        });
      })
    );
  }
});
