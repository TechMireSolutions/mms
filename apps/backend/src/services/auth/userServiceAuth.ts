import { randomBytes } from 'node:crypto';
import { resolveTenantLoginEmail, type Contact, type TenantUserProfile } from '@mms/shared';
import { getContactById } from '../contactService.js';
import { hashPassword, verifyPassword } from './passwordService.js';
import {
  asAuthUser,
  getRawUsers,
  hydratedEmail,
  toPublicUser,
  type PersistedUser,
  type PublicUser,
  type StoredUser,
} from './userServiceShared.js';
import { getHydratedUsers, getWorkspaceUserRow, saveUsers } from './userServiceList.js';

async function findUserByLoginEmailAndWorkspace(
  email: string,
  workspaceSubdomain: string,
): Promise<StoredUser | undefined> {
  const normalizedEmail = email.toLowerCase();
  const normalizedSubdomain = workspaceSubdomain.toLowerCase();
  const users = await getHydratedUsers();

  for (const user of users) {
    const loginEmail = resolveTenantLoginEmail(user, hydratedEmail(user));
    const subdomain =
      typeof user.workspaceSubdomain === 'string'
        ? user.workspaceSubdomain.toLowerCase()
        : '';
    if (loginEmail !== normalizedEmail || subdomain !== normalizedSubdomain) continue;
    const authUser = asAuthUser(user);
    if (authUser) return authUser;
  }

  return undefined;
}

async function findUserById(id: string): Promise<StoredUser | undefined> {
  const users = await getHydratedUsers();
  const user = users.find((entry) => entry.id === id);
  if (!user) return undefined;
  return asAuthUser(user) ?? undefined;
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const user = await findUserById(id);
  if (!user) return null;
  return toPublicUser(user);
}

export async function getTenantUserProfile(userId: string): Promise<TenantUserProfile | null> {
  const hydrated = await getWorkspaceUserRow(userId);
  if (!hydrated) return null;
  const authUser = asAuthUser(hydrated);
  if (!authUser) return null;

  let contact: Contact | null = null;
  if (hydrated.contactId != null && hydrated.contactId !== '') {
    contact = await getContactById(String(hydrated.contactId));
  }

  const raw = await getRawUsers();
  const row = raw.find((rawUser) => rawUser.id === userId);
  const pendingLoginEmail =
    typeof row?.pendingLoginEmail === 'string' ? row.pendingLoginEmail : undefined;

  return {
    id: authUser.id,
    loginEmail: authUser.loginEmail,
    emailVerifiedAt: authUser.emailVerifiedAt,
    name: authUser.name,
    role: authUser.role,
    workspaceSubdomain: authUser.workspaceSubdomain,
    contactId: authUser.contactId,
    contact,
    pendingLoginEmail,
  };
}

/**
 * Creates and persists a new user account for a workspace.
 * Throws if the login email is already registered on the same subdomain.
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  role: string,
  workspaceSubdomain: string,
  options?: { emailVerified?: boolean; contactId?: string | number; mustChangePassword?: boolean },
): Promise<PublicUser> {
  const loginEmail = email.trim().toLowerCase();
  if (await findUserByLoginEmailAndWorkspace(loginEmail, workspaceSubdomain)) {
    throw new Error(`User with email "${loginEmail}" already exists for this workspace.`);
  }

  const passwordHash = await hashPassword(password);
  const user: PersistedUser = {
    id: randomBytes(8).toString('hex'),
    loginEmail,
    emailVerifiedAt: options?.emailVerified === false ? undefined : new Date().toISOString(),
    name,
    role,
    workspaceSubdomain,
    passwordHash,
    mustChangePassword: options?.mustChangePassword === true,
    createdAt: new Date().toISOString(),
    contactId: options?.contactId,
  };

  const users = await getRawUsers();
  users.push(user);
  await saveUsers(users);

  const authUser = asAuthUser(user);
  if (!authUser) {
    throw new Error('Failed to create auth user record.');
  }
  return toPublicUser(authUser);
}

/**
 * Validates credentials for a tenant subdomain and returns the public user profile if correct.
 */
export async function validateCredentials(
  email: string,
  password: string,
  workspaceSubdomain: string,
): Promise<PublicUser | null> {
  const user = await findUserByLoginEmailAndWorkspace(email, workspaceSubdomain);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return toPublicUser(user);
}
