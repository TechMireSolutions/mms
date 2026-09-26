import { describe, expect, it } from 'vitest';
import { platformWorkspacesRoutes } from '../contracts/platform.contract.js';

describe('platformWorkspacesRoutes.createWorkspaceAdminUser contract', () => {
  it('validates request path params and body schemas', () => {
    const route = platformWorkspacesRoutes.createWorkspaceAdminUser;
    expect(route.method).toBe('POST');
    expect(route.path).toBe('/api/platform/workspaces/:subdomain/admin-users');

    const validBody = route.body.safeParse({
      name: 'Administrator',
      email: 'admin@subdomain.org',
      password: 'StrongPassword123',
    });
    expect(validBody.success).toBe(true);

    const validBodyNoPassword = route.body.safeParse({
      name: 'Administrator',
      email: 'admin@subdomain.org',
    });
    expect(validBodyNoPassword.success).toBe(true);

    const invalidEmail = route.body.safeParse({
      name: 'Administrator',
      email: 'invalid-email',
    });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = route.body.safeParse({
      name: 'Administrator',
      email: 'admin@subdomain.org',
      password: 'short',
    });
    expect(shortPassword.success).toBe(false);
  });

  it('validates 200 response schema shape', () => {
    const response200Schema = platformWorkspacesRoutes.createWorkspaceAdminUser.responses[200];
    const validResponse = response200Schema.safeParse({
      success: true,
      subdomain: 'demo',
      adminEmail: 'admin@subdomain.org',
      name: 'Administrator',
      initialPassword: 'Mms#RandomPass123',
    });
    expect(validResponse.success).toBe(true);
  });
});
