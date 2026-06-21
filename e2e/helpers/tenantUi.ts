import type { Page } from '@playwright/test';
import { API_BASE, type E2ETenantSession } from './tenantApi';

const FE_BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

export function tenantAppUrl(tenant: E2ETenantSession, path = '/'): string {
  const port = new URL(FE_BASE).port || '5173';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `http://${tenant.tenantHost}:${port}${normalized}`;
}

/** Returns false when the Vite dev/preview server is not running. */
export async function isFrontendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${FE_BASE}/health`, { signal: AbortSignal.timeout(5_000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5_000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Tenant login through the React login form (cookie session via Vite /api proxy). */
export async function loginTenantInBrowser(page: Page, tenant: E2ETenantSession): Promise<void> {
  await page.goto(tenantAppUrl(tenant, '/login'), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByLabel(/Email address/i).fill(tenant.adminEmail);
  await page.getByLabel(/^Password$/i).fill(tenant.adminPassword);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
}
