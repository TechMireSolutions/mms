import { loadBackendEnv } from '../config/loadEnv.js';
import { hashPassword } from '../services/auth/passwordService.js';
import { insertPlatformUser, findPlatformUserRowByEmail, updatePlatformUserRow } from '../db/repositories/platformUserRepository.js';
import { initDb, closeDatabase } from '../db/database.js';
import { randomBytes } from 'node:crypto';
import { FULL_PLATFORM_ADMIN_PERMISSIONS } from '@mms/shared';

loadBackendEnv();

async function seed() {
  await initDb();
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';

  if (!email || !password) {
    console.error('PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are required');
    process.exit(1);
  }

  const existing = await findPlatformUserRowByEmail(email);
  if (existing) {
    await updatePlatformUserRow(existing.id, {
      passwordHash: await hashPassword(password),
      sessionVersion: existing.sessionVersion + 1,
    });
    console.log(`✅ Refreshed credentials for platform super-user ${email}.`);
  } else {
    await insertPlatformUser({
      id: randomBytes(8).toString('hex'),
      email: email.toLowerCase(),
      name,
      passwordHash: await hashPassword(password),
      role: 'super_user',
      permissions: FULL_PLATFORM_ADMIN_PERMISSIONS,
      sessionVersion: 0,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Platform super-user seeded successfully for ${email}`);
  }
  await closeDatabase();
}

seed().catch((err) => {
  console.error('Failed to seed platform super-user:', err);
  process.exit(1);
});
