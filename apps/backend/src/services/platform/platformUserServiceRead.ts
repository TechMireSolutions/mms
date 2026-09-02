import type { PlatformUserProfile } from '@mms/shared';
import {
  findPlatformUserRowByEmail,
  findPlatformUserRowById,
  updatePlatformUserRow,
} from '../../db/repositories/platformUserRepository.js';
import type { StoredPlatformUser } from '@mms/shared';
import { PlatformError } from './platformErrorService.js';
import { toPlatformUserProfile } from './platformUserServiceMappers.js';

export async function getPlatformUserProfile(userId: string): Promise<PlatformUserProfile | null> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) return null;
  return toPlatformUserProfile(stored);
}

export async function findPlatformUserByEmail(email: string): Promise<StoredPlatformUser | null> {
  return findPlatformUserRowByEmail(email.trim().toLowerCase());
}

export async function getStoredPlatformUserById(id: string): Promise<StoredPlatformUser | null> {
  return findPlatformUserRowById(id);
}

export async function updatePlatformUserName(
  userId: string,
  name: string,
): Promise<StoredPlatformUser> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new PlatformError('invalid_name', 'Name cannot be empty');
  const updated = await updatePlatformUserRow(userId, { name: trimmedName });
  if (!updated) throw new PlatformError('user_not_found', 'Platform user not found');
  if (updated.role === 'super_user') {
    const { syncPlatformSuperUserToTenants } = await import('./platformSuperUserTenantSyncService.js');
    await syncPlatformSuperUserToTenants(updated);
  }
  return updated;
}

export async function updatePlatformUserProfile(
  userId: string,
  name: string,
): Promise<PlatformUserProfile> {
  const updated = await updatePlatformUserName(userId, name);
  return toPlatformUserProfile(updated);
}
