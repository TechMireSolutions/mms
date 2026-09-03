import type {
  PlatformSetupStatus,
  StoredPlatformUser,
} from '@mms/shared';
import { normalizePlatformEmail } from '@mms/shared';
import { hashPassword } from '../auth/passwordService.js';
import {
  createVerifiedPlatformUser,
  hasPlatformUsers,
} from './platformUserService.js';
import { isPlatformSmtpConfigured } from './platformEmailService.js';
import { PlatformError } from './platformErrorService.js';
import {
  enforcePlatformEmail,
  enforcePlatformName,
  enforcePlatformPassword,
} from './platformValidationService.js';

export async function getPlatformSetupStatus(): Promise<PlatformSetupStatus> {
  const needsSetup = !(await hasPlatformUsers());
  return {
    needsSetup,
    // Only reveal email configuration during the first-run setup wizard; once
    // setup is complete this endpoint is public and should not leak it.
    smtpConfigured: needsSetup ? isPlatformSmtpConfigured() : false,
  };
}

export async function startPlatformSetup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<StoredPlatformUser> {
  if (await hasPlatformUsers()) {
    throw new PlatformError('setup_not_needed', 'Platform administrator already exists');
  }

  enforcePlatformEmail(input.email);
  enforcePlatformName(input.name);
  enforcePlatformPassword(input.password);

  const email = normalizePlatformEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  return createVerifiedPlatformUser({
    email,
    name: input.name.trim(),
    passwordHash,
    role: 'super_user',
  });
}
