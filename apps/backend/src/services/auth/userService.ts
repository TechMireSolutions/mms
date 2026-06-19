import { randomBytes } from 'node:crypto';
import {
  hydrateWorkspaceUserProfile,
  resolveTenantLoginEmail,
  type ContactLike,
  type StoredTenantUser,
  type TenantUserProfile,
  type User,
} from '@mms/shared';
import type { Contact } from '@mms/shared';
import { getCollection, saveCollection } from '../../db/database.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import {
  findTenantUserRowById,
  listTenantUsersByWorkspace,
  replaceTenantUsersForWorkspace,
  type TenantUserRow,
} from '../../db/repositories/tenantUserRepository.js';
import { hashPassword, verifyPassword } from './passwordService.js';
import { loadContacts, updateContactById } from '../contactService.js';
import { assertPasswordMeetsPolicy } from '../globalSettingsService.js';

/** Auth-capable user with credentials resolved for login and session. */
export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceSubdomain: string;
  passwordHash: string;
  createdAt: string;
  contactId?: string | number;
  loginEmail: string;
  emailVerifiedAt?: string;
}

/** Public user shape — no password hash. */
export type PublicUser = User;

type PersistedUser = StoredTenantUser & Record<string, unknown>;

const COLLECTION = 'users';
const CONTACTS_COLLECTION = 'contacts';

function requireTenantSubdomain(): string {
  const tenant = getRequestTenant();
  if (!tenant) {
    throw new Error('Tenant context is required for workspace user operations');
  }
  return tenant.trim().toLowerCase();
}

async function getContacts(): Promise<ContactLike[]> {
  const raw = await getCollection(CONTACTS_COLLECTION);
  if (!Array.isArray(raw)) return [];
  return raw as ContactLike[];
}

async function getRawUsers(): Promise<PersistedUser[]> {
  const subdomain = requireTenantSubdomain();
  const fromTable = await listTenantUsersByWorkspace(subdomain);
  if (fromTable.length > 0) {
    return fromTable as PersistedUser[];
  }

  const raw = await getCollection(COLLECTION);
  if (!Array.isArray(raw)) return [];
  return raw as PersistedUser[];
}

async function getHydratedUsers(): Promise<PersistedUser[]> {
  const contacts = await getContacts();
  const users = await getRawUsers();
  return users.map((user) =>
    hydrateWorkspaceUserProfile(user, contacts) as PersistedUser,
  );
}

function hydratedEmail(user: PersistedUser): string {
  return typeof user.email === 'string' ? user.email : '';
}

function asAuthUser(user: PersistedUser): StoredUser | null {
  const loginEmail = resolveTenantLoginEmail(user, hydratedEmail(user));
  const workspaceSubdomain =
    typeof user.workspaceSubdomain === 'string' ? user.workspaceSubdomain.trim() : '';
  const passwordHash = typeof user.passwordHash === 'string' ? user.passwordHash : '';
  if (!loginEmail || !workspaceSubdomain || !passwordHash) return null;

  return {
    id: user.id,
    email: loginEmail,
    loginEmail,
    name: typeof user.name === 'string' ? user.name : '',
    role: typeof user.role === 'string' ? user.role : 'assistant_teacher',
    workspaceSubdomain,
    passwordHash,
    createdAt:
      typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString(),
    contactId: user.contactId,
    emailVerifiedAt:
      typeof user.emailVerifiedAt === 'string' ? user.emailVerifiedAt : undefined,
  };
}

function toPublicUser(authUser: StoredUser): PublicUser {
  return {
    id: authUser.id,
    email: authUser.loginEmail,
    loginEmail: authUser.loginEmail,
    name: authUser.name,
    role: authUser.role,
    workspaceSubdomain: authUser.workspaceSubdomain,
    contactId: authUser.contactId,
    emailVerifiedAt: authUser.emailVerifiedAt,
  };
}

async function saveUsers(next: PersistedUser[]): Promise<void> {
  const subdomain = requireTenantSubdomain();
  await replaceTenantUsersForWorkspace(subdomain, next as TenantUserRow[]);
  await saveCollection(COLLECTION, next);
}

export async function getWorkspaceUserRow(userId: string): Promise<PersistedUser | undefined> {
  const users = await getHydratedUsers();
  return users.find((entry) => entry.id === userId);
}

export async function getLinkedContactId(userId: string): Promise<string | number | null> {
  const user = await findTenantUserRowById(userId);
  const contactId = user?.contactId;
  if (contactId == null || contactId === '') return null;
  return contactId;
}

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
    const contacts = await loadContacts();
    contact =
      contacts.find((c) => String(c.id) === String(hydrated.contactId)) ?? null;
  }

  const raw = await getRawUsers();
  const row = raw.find((r) => r.id === userId);
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
  options?: { emailVerified?: boolean; contactId?: string | number },
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

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const row = await findTenantUserRowById(userId);
  const passwordHash = typeof row?.passwordHash === 'string' ? row.passwordHash : '';
  if (!passwordHash) {
    const users = await getRawUsers();
    const legacy = users.find((u) => u.id === userId);
    const legacyHash = typeof legacy?.passwordHash === 'string' ? legacy.passwordHash : '';
    if (!legacyHash) return false;
    return verifyPassword(password, legacyHash);
  }
  return verifyPassword(password, passwordHash);
}

export async function changeTenantUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const users = await getRawUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) throw new Error('User not found');

  const row = users[index];
  const passwordHash = typeof row.passwordHash === 'string' ? row.passwordHash : '';
  if (!passwordHash || !(await verifyPassword(currentPassword, passwordHash))) {
    const err = new Error('Current password is incorrect') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 401;
    err.type = 'invalid_credentials';
    throw err;
  }

  await assertPasswordMeetsPolicy(newPassword);
  users[index] = {
    ...row,
    passwordHash: await hashPassword(newPassword),
  };
  await saveUsers(users);
}

export async function setTenantLoginEmail(
  userId: string,
  loginEmail: string,
): Promise<PublicUser | null> {
  const normalized = loginEmail.trim().toLowerCase();
  const users = await getRawUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) return null;

  const subdomain =
    typeof users[index].workspaceSubdomain === 'string'
      ? users[index].workspaceSubdomain!
      : '';
  const conflict = users.some(
    (u, i) =>
      i !== index &&
      u.workspaceSubdomain === subdomain &&
      resolveTenantLoginEmail(u) === normalized,
  );
  if (conflict) {
    const err = new Error('Login email is already in use') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 409;
    err.type = 'conflict';
    throw err;
  }

  const next: PersistedUser = {
    ...users[index],
    loginEmail: normalized,
    emailVerifiedAt: new Date().toISOString(),
    pendingLoginEmail: undefined,
  };
  delete next.email;
  users[index] = next;
  await saveUsers(users);

  return getPublicUserById(userId);
}

export async function setPendingLoginEmail(
  userId: string,
  pendingLoginEmail: string | undefined,
): Promise<void> {
  const users = await getRawUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) return;
  const next = { ...users[index] };
  if (pendingLoginEmail) {
    next.pendingLoginEmail = pendingLoginEmail.trim().toLowerCase();
  } else {
    delete next.pendingLoginEmail;
  }
  users[index] = next;
  await saveUsers(users);
}

export async function updateOwnLinkedContact(
  userId: string,
  contact: Contact,
): Promise<Contact | null> {
  const contactId = await getLinkedContactId(userId);
  if (contactId == null) {
    const err = new Error('No linked contact for this account') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 400;
    err.type = 'no_contact_link';
    throw err;
  }
  return updateContactById(String(contactId), { ...contact, id: contactId });
}
