import type { Contact } from './contactTypes.js';

/** Auth-owned fields on a workspace user row (never stripped by contact-first normalize). */
export interface TenantAuthFields {
  /** Canonical sign-in identifier — not the CRM contact email. */
  loginEmail: string;
  /** ISO timestamp when `loginEmail` was last verified. */
  emailVerifiedAt?: string;
  /** True until the user changes an admin-issued temporary password. */
  mustChangePassword?: boolean;
}

/** Persisted tenant user with optional auth credentials. */
export interface StoredTenantUser extends Partial<TenantAuthFields> {
  id: string;
  contactId?: string | number;
  role?: string;
  workspaceSubdomain?: string;
  passwordHash?: string;
  createdAt?: string;
  /** Legacy / hydrated display — not used for login when `loginEmail` is set. */
  email?: string;
  name?: string;
  pendingLoginEmail?: string;
}

/** Resolves the canonical login email from persisted auth + optional hydrated contact email. */
export function resolveTenantLoginEmail(
  user: Partial<StoredTenantUser>,
  hydratedEmail?: string,
): string {
  const fromAuth = user.loginEmail?.trim() || user.email?.trim();
  if (fromAuth) return fromAuth.toLowerCase();
  if (hydratedEmail?.trim()) return hydratedEmail.trim().toLowerCase();
  return '';
}

/** Session + profile payload for tenant account page. */
export interface TenantUserProfile {
  id: string;
  loginEmail: string;
  emailVerifiedAt?: string;
  name: string;
  role: string;
  workspaceSubdomain: string;
  contactId?: string | number;
  contact: Contact | null;
  pendingLoginEmail?: string;
}
