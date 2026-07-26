import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  PLATFORM_FAVICON_HREF,
  applyPlatformDocumentFavicon,
  applyTenantDocumentFavicon,
  buildInitialsFaviconDataUrl,
  setDocumentFavicon,
} from '@/lib/documentFavicon';

describe('documentFavicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" />';
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('buildInitialsFaviconDataUrl encodes initials', () => {
    const href = buildInitialsFaviconDataUrl('Al-Noor Madrasa', '#0f766e');
    expect(href.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(href)).toMatch(/>[A-Z]{1,2}</);
  });

  it('applyPlatformDocumentFavicon restores platform icon', () => {
    applyPlatformDocumentFavicon();
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    expect(link?.getAttribute('href')).toBe(PLATFORM_FAVICON_HREF);
  });

  it('applyTenantDocumentFavicon never leaves platform favicon', () => {
    applyTenantDocumentFavicon({});
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    expect(link?.getAttribute('href')).not.toBe(PLATFORM_FAVICON_HREF);
    expect(link?.getAttribute('href')?.startsWith('data:')).toBe(true);
  });

  it('applyTenantDocumentFavicon prefers custom favicon over logo', () => {
    applyTenantDocumentFavicon({
      faviconUrl: 'https://cdn.example/favicon.png',
      logoUrl: 'https://cdn.example/logo.png',
      madrasaName: 'Demo',
    });
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    expect(link?.getAttribute('href')).toBe('https://cdn.example/favicon.png');
  });

  it('setDocumentFavicon creates link when missing', () => {
    document.head.innerHTML = '';
    setDocumentFavicon('https://cdn.example/icon.png');
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    expect(link?.getAttribute('href')).toBe('https://cdn.example/icon.png');
  });
});
