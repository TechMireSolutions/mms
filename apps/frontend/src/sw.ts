/**
 * MMS PWA Service Worker Configuration & Cache Strategy SSOT
 *
 * Configured via `vite-plugin-pwa` in `vite.config.ts`.
 *
 * Caching Policy:
 * 1. NetworkOnly: `/api/*`, `/uploads/*`, `/health`, and all non-GET requests (mutations).
 * 2. CacheFirst: `/assets/*` (hashed immutable chunks), fonts, icons, media (maxAge: 30d, maxEntries: 200).
 * 3. StaleWhileRevalidate: `/index.html`, `/`, `/site.webmanifest` (maxAge: 24h, maxEntries: 10).
 */

export const PWA_CACHE_NAMES = {
  staticAssets: 'mms-static-assets',
  htmlManifest: 'mms-html-manifest',
} as const;

export const PWA_OFFLINE_DENYLIST = [
  /^\/api\//,
  /^\/uploads\//,
  /^\/health/,
] as const;

export const PWA_CACHE_EXPIRATIONS = {
  staticAssetsMaxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  staticAssetsMaxEntries: 200,
  htmlManifestMaxAgeSeconds: 24 * 60 * 60, // 24 hours
  htmlManifestMaxEntries: 10,
} as const;
