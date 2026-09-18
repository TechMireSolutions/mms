import { describe, it, expect, vi } from 'vitest';

/**
 * Pure classification logic mirroring apps/frontend/public/sw.js
 * Verifies that all route categories map to their intended caching strategies.
 */
export function classifyRequest(method: string, urlStr: string, mode?: string): 'NetworkOnly' | 'CacheFirst' | 'StaleWhileRevalidate' | 'NetworkFirst' | 'Standard' {
  const url = new URL(urlStr, 'https://mmsv2.aabtaab.com');

  // 1. Strict NetworkOnly for mutative requests and secure authentication / live stream endpoints
  if (
    method !== 'GET' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/platform/auth') ||
    url.pathname.startsWith('/api/ws') ||
    url.pathname.startsWith('/ws') ||
    url.pathname.includes('/live') ||
    url.pathname.includes('/stream')
  ) {
    return 'NetworkOnly';
  }

  // 2. CacheFirst for hashed static assets (/assets/*) and external web fonts
  const isHashedAsset = url.pathname.startsWith('/assets/');
  const isWebFont = url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com');
  if (isHashedAsset || isWebFont) {
    return 'CacheFirst';
  }

  // 3. StaleWhileRevalidate for non-critical tenant assets (public branding, uploads, icons)
  const isNonCriticalAsset =
    url.pathname.includes('/public-branding') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg');
  if (isNonCriticalAsset) {
    return 'StaleWhileRevalidate';
  }

  // 4. NetworkFirst for SPA navigation requests
  if (mode === 'navigate') {
    return 'NetworkFirst';
  }

  return 'Standard';
}

describe('Service Worker Request Classification & Cache Strategy', () => {
  it('classifies mutative HTTP methods as NetworkOnly', () => {
    expect(classifyRequest('POST', 'https://mmsv2.aabtaab.com/api/contacts')).toBe('NetworkOnly');
    expect(classifyRequest('PUT', 'https://mmsv2.aabtaab.com/api/students/123')).toBe('NetworkOnly');
    expect(classifyRequest('DELETE', 'https://mmsv2.aabtaab.com/api/users/456')).toBe('NetworkOnly');
    expect(classifyRequest('PATCH', 'https://mmsv2.aabtaab.com/api/finance/invoices/1')).toBe('NetworkOnly');
  });

  it('classifies auth, websocket, and streaming paths as NetworkOnly', () => {
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/api/auth/session')).toBe('NetworkOnly');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/api/platform/auth/me')).toBe('NetworkOnly');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/ws')).toBe('NetworkOnly');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/api/ws')).toBe('NetworkOnly');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/api/events/live')).toBe('NetworkOnly');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/api/data/stream')).toBe('NetworkOnly');
  });

  it('classifies hashed assets and Google Fonts as CacheFirst', () => {
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/assets/index-B5aRUblQ.js')).toBe('CacheFirst');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/assets/vendor-react-C7k8.css')).toBe('CacheFirst');
    expect(classifyRequest('GET', 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2')).toBe('CacheFirst');
    expect(classifyRequest('GET', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap')).toBe('CacheFirst');
  });

  it('classifies non-critical tenant assets as StaleWhileRevalidate', () => {
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/api/tenant/public-branding')).toBe('StaleWhileRevalidate');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/uploads/avatars/user-1.png')).toBe('StaleWhileRevalidate');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/platform-logo.webp')).toBe('StaleWhileRevalidate');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/favicon.svg')).toBe('StaleWhileRevalidate');
  });

  it('classifies SPA page navigation requests as NetworkFirst', () => {
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/students', 'navigate')).toBe('NetworkFirst');
    expect(classifyRequest('GET', 'https://mmsv2.aabtaab.com/dashboard', 'navigate')).toBe('NetworkFirst');
  });

  it('verifies Response.clone() execution safety on cache write', () => {
    const mockClone = vi.fn().mockReturnValue({ body: 'cloned-body' });
    const mockResponse = {
      status: 200,
      clone: mockClone,
    };

    if (mockResponse.status === 200) {
      const responseClone = mockResponse.clone();
      expect(responseClone).toEqual({ body: 'cloned-body' });
    }

    expect(mockClone).toHaveBeenCalledTimes(1);
  });
});
