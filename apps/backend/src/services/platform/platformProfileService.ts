import type { PlatformUserProfile } from '@mms/shared';
import { validatePlatformSetupName, validatePlatformSetupPassword } from '@mms/shared';
import {
  changePlatformUserPassword,
  getStoredPlatformUserById,
  updatePlatformUserName,
} from './platformUserService.js';

export type PlatformProfileErrorCode =
  | 'invalid_name'
  | 'password_too_short'
  | 'password_weak'
  | 'invalid_current_password'
  | 'user_not_found';

export class PlatformProfileError extends Error {
  constructor(
    readonly code: PlatformProfileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PlatformProfileError';
  }
}

export function toPlatformUserProfile(stored: {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  emailVerifiedAt?: string;
}): PlatformUserProfile {
  return {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    createdAt: stored.createdAt,
    emailVerifiedAt: stored.emailVerifiedAt,
  };
}

export async function getPlatformUserProfile(userId: string): Promise<PlatformUserProfile | null> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) return null;
  return toPlatformUserProfile(stored);
}

export async function updatePlatformUserProfile(
  userId: string,
  name: string,
): Promise<PlatformUserProfile> {
  const nameError = validatePlatformSetupName(name);
  if (nameError) {
    throw new PlatformProfileError('invalid_name', 'Invalid display name');
  }

  const stored = await getStoredPlatformUserById(userId);
  if (!stored) {
    throw new PlatformProfileError('user_not_found', 'Platform user not found');
  }

  const updated = await updatePlatformUserName(userId, name);
  return toPlatformUserProfile(updated);
}

export async function updatePlatformUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const passwordError = validatePlatformSetupPassword(newPassword);
  if (passwordError === 'platform.setupPasswordTooShort') {
    throw new PlatformProfileError('password_too_short', 'Password does not meet minimum length');
  }
  if (passwordError === 'platform.setupPasswordWeak') {
    throw new PlatformProfileError('password_weak', 'Password does not meet complexity requirements');
  }

  try {
    await changePlatformUserPassword(userId, currentPassword, newPassword);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid current password')) {
      throw new PlatformProfileError('invalid_current_password', 'Current password is incorrect');
    }
    if (error instanceof Error && error.message.includes('not found')) {
      throw new PlatformProfileError('user_not_found', 'Platform user not found');
    }
    throw error;
  }
}
