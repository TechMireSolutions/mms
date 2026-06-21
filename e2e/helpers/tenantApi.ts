import type { APIRequestContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL ?? 'http://127.0.0.1:3000';

export const E2E_PLATFORM_EMAIL = process.env.E2E_PLATFORM_EMAIL ?? 'platform@test.com';
export const E2E_PLATFORM_PASSWORD = process.env.E2E_PLATFORM_PASSWORD ?? 'password123';

export interface E2ETenantSession {
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  tenantHost: string;
}

/** Provisions a fresh tenant via platform onboard (apex host). */
export async function provisionE2ETenant(request: APIRequestContext): Promise<E2ETenantSession> {
  const subdomain = `e2e${Date.now().toString(36)}`;
  const adminEmail = `admin-${subdomain}@e2e.test`;
  const adminPassword = 'E2eTestPass1!';
  const tenantHost = `${subdomain}.localhost`;

  const platformLogin = await request.post(`${API_BASE}/api/platform/auth/login`, {
    headers: { host: 'localhost' },
    data: { email: E2E_PLATFORM_EMAIL, password: E2E_PLATFORM_PASSWORD },
  });
  if (!platformLogin.ok()) {
    throw new Error(`Platform login failed: ${platformLogin.status()} ${await platformLogin.text()}`);
  }

  const onboard = await request.post(`${API_BASE}/api/auth/onboard`, {
    headers: { host: 'localhost' },
    data: {
      madrasaName: `E2E Madrasa ${subdomain}`,
      adminName: 'E2E Admin',
      email: adminEmail,
      password: adminPassword,
      subdomain,
      tagline: 'Playwright contacts flow',
    },
  });
  if (!onboard.ok()) {
    throw new Error(`Onboard failed: ${onboard.status()} ${await onboard.text()}`);
  }

  const tenantLogin = await request.post(`${API_BASE}/api/auth/login`, {
    headers: { host: tenantHost },
    data: { email: adminEmail, password: adminPassword },
  });
  if (!tenantLogin.ok()) {
    throw new Error(`Tenant login failed: ${tenantLogin.status()} ${await tenantLogin.text()}`);
  }

  return { subdomain, adminEmail, adminPassword, tenantHost };
}

export function tenantHeaders(tenantHost: string): Record<string, string> {
  return { host: tenantHost };
}

export { API_BASE };
