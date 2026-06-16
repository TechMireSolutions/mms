import { randomBytes } from 'node:crypto';
import { getCollection, saveCollection } from '../../db/database.js';
import { type User } from '@mms/shared';
import { hashPassword, verifyPassword } from './passwordService.js';

/** Stored user shape persisted in the "users" collection. */
export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceSubdomain: string;
  /** Salted hash encoded as "salt:hash" (hex). */
  passwordHash: string;
  createdAt: string;
}

/** Public user shape — no password hash. */
export type PublicUser = User;

const COLLECTION = 'users';

async function getAllUsers(): Promise<StoredUser[]> {
  const raw = await getCollection(COLLECTION);
  if (!Array.isArray(raw)) return [];
  return raw as StoredUser[];
}

async function findUserByEmailAndWorkspace(
  email: string,
  workspaceSubdomain: string
): Promise<StoredUser | undefined> {
  const users = await getAllUsers();
  const normalizedSubdomain = workspaceSubdomain.toLowerCase();
  return users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.workspaceSubdomain.toLowerCase() === normalizedSubdomain
  );
}

async function findUserById(id: string): Promise<StoredUser | undefined> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id);
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const user = await findUserById(id);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceSubdomain: user.workspaceSubdomain,
  };
}

/**
 * Creates and persists a new user account for a workspace.
 * Throws if the email is already registered on the same subdomain.
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  role: string,
  workspaceSubdomain: string
): Promise<PublicUser> {
  if (await findUserByEmailAndWorkspace(email, workspaceSubdomain)) {
    throw new Error(`User with email "${email}" already exists for this workspace.`);
  }

  const passwordHash = await hashPassword(password);
  const user: StoredUser = {
    id: randomBytes(8).toString('hex'),
    email,
    name,
    role,
    workspaceSubdomain,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const users = await getAllUsers();
  users.push(user);
  await saveCollection(COLLECTION, users);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceSubdomain: user.workspaceSubdomain,
  };
}

/**
 * Validates credentials for a tenant subdomain and returns the public user profile if correct.
 */
export async function validateCredentials(
  email: string,
  password: string,
  workspaceSubdomain: string
): Promise<PublicUser | null> {
  const user = await findUserByEmailAndWorkspace(email, workspaceSubdomain);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceSubdomain: user.workspaceSubdomain,
  };
}
