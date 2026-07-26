import { getInitials } from '@mms/shared';

export const PLATFORM_FAVICON_HREF = '/favicon.svg';

/** Transparent placeholder so browsers do not fall back to requesting `/favicon.svg`. */
const EMPTY_FAVICON_HREF =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"></svg>');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Builds a square initials favicon for tenants without a custom logo/favicon. */
export function buildInitialsFaviconDataUrl(name: string, primaryColor = '#0f766e'): string {
  const initials = (getInitials(name) || 'M').slice(0, 2);
  const fill = /^#[0-9a-fA-F]{3,8}$/.test(primaryColor.trim()) ? primaryColor.trim() : '#0f766e';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${fill}"/><text x="16" y="21" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#ffffff">${escapeXml(initials)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function ensureIconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

/** Sets the browser tab icon. Pass `null` to clear any platform/default icon. */
export function setDocumentFavicon(href: string | null): void {
  if (typeof document === 'undefined') return;
  const link = ensureIconLink();
  const next = href?.trim() || EMPTY_FAVICON_HREF;
  if (link.getAttribute('href') === next) return;
  link.type = next.startsWith('data:image/svg+xml') || next.endsWith('.svg') ? 'image/svg+xml' : '';
  link.href = next;
}

/** Platform apex — MMS product favicon. */
export function applyPlatformDocumentFavicon(): void {
  setDocumentFavicon(PLATFORM_FAVICON_HREF);
}

export interface TenantFaviconInput {
  faviconUrl?: string | null;
  logoUrl?: string | null;
  madrasaName?: string | null;
  primaryColor?: string | null;
}

/**
 * Applies tenant tab icon: custom favicon → logo → initials mark.
 * Never leaves the platform `/favicon.svg` on a tenant host.
 */
export function applyTenantDocumentFavicon(input: TenantFaviconInput): void {
  const custom = (input.faviconUrl || input.logoUrl || '').trim();
  if (custom) {
    setDocumentFavicon(custom);
    return;
  }
  const name = input.madrasaName?.trim();
  if (name) {
    setDocumentFavicon(buildInitialsFaviconDataUrl(name, input.primaryColor || undefined));
    return;
  }
  setDocumentFavicon(null);
}
