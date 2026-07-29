import type { FastifyInstance } from 'fastify';

type TokenRole = 'admin' | 'teacher' | 'accountant' | 'assistant_teacher' | 'viewer';

export function signTenantToken(
  app: FastifyInstance,
  options: {
    role?: TokenRole;
    id?: string;
    email?: string;
    name?: string;
    workspaceSubdomain?: string;
  } = {},
): string {
  const role = options.role ?? 'admin';
  return app.jwt.sign({
    id: options.id ?? `u-${role}`,
    email: options.email ?? `${role}@test.com`,
    name: options.name ?? role.charAt(0).toUpperCase() + role.slice(1),
    role,
    workspaceSubdomain: options.workspaceSubdomain ?? 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

export function adminToken(app: FastifyInstance): string {
  return signTenantToken(app, { role: 'admin', id: 'u-admin', email: 'admin@test.com', name: 'Admin' });
}

export function teacherToken(app: FastifyInstance): string {
  return signTenantToken(app, {
    role: 'teacher',
    id: 'u-teacher',
    email: 'teacher@test.com',
    name: 'Teacher',
  });
}

export function accountantToken(app: FastifyInstance): string {
  return signTenantToken(app, {
    role: 'accountant',
    id: 'u-accountant',
    email: 'accountant@test.com',
    name: 'Accountant',
  });
}
