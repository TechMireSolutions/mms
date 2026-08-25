import { randomBytes } from 'node:crypto';
import type { StoredPlatformUser } from '@mms/shared';
import { FULL_PLATFORM_ADMIN_PERMISSIONS } from '@mms/shared';
import {
  findPlatformUserRowByEmail,
  findPlatformUserRowByRole,
  insertPlatformUser,
  updatePlatformUserRow,
} from '../../db/repositories/platformUserRepository.js';
import { hashPassword, verifyPassword } from '../auth/passwordService.js';

/**
 * Dev/staging bootstrap from env when PLATFORM_ALLOW_ENV_BOOTSTRAP=true.
 * Requires explicit PLATFORM_ADMIN_EMAIL + PLATFORM_ADMIN_PASSWORD (or SEED_DEV_PASSWORD).
 */
export async function ensurePlatformSuperUserFromEnv(): Promise<void> {
  if (process.env.PLATFORM_ALLOW_ENV_BOOTSTRAP !== 'true') return;

  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  const password =
    process.env.PLATFORM_ADMIN_PASSWORD?.trim() ?? process.env.SEED_DEV_PASSWORD?.trim();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';

  if (!email || !password) {
    console.warn(
      '[MMS] PLATFORM_ALLOW_ENV_BOOTSTRAP=true but credentials missing — skipping bootstrap',
    );
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await findPlatformUserRowByEmail(normalizedEmail);

  if (existing) {
    const matches = await verifyPassword(password, existing.passwordHash);
    if (!matches) {
      const newHash = await hashPassword(password);
      await updatePlatformUserRow(existing.id, {
        passwordHash: newHash,
        name: name || existing.name,
      });
      console.log(`[MMS] Updated platform super-user password from env for ${existing.email}`);
    }
    return;
  }

  const existingSuperUser = await findPlatformUserRowByRole('super_user');
  if (existingSuperUser) {
    const newHash = await hashPassword(password);
    await updatePlatformUserRow(existingSuperUser.id, {
      email: normalizedEmail,
      passwordHash: newHash,
      name,
    });
    console.log(`[MMS] Updated existing super-user email to ${normalizedEmail} from env`);
    return;
  }

  const user: StoredPlatformUser = {
    id: randomBytes(8).toString('hex'),
    email: normalizedEmail,
    name,
    passwordHash: await hashPassword(password),
    role: 'super_user',
    permissions: FULL_PLATFORM_ADMIN_PERMISSIONS,
    sessionVersion: 0,
    createdAt: new Date().toISOString(),
    emailVerifiedAt: new Date().toISOString(),
  };
  await insertPlatformUser(user);
  console.log(`[MMS] Platform super-user seeded from env for ${user.email}`);
}
