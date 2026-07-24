import { loadBackendEnv } from '../config/loadEnv.js';
import { hashPassword } from '../services/auth/passwordService.js';
import { insertPlatformUser, countPlatformUserRows, findPlatformUserRowByEmail, updatePlatformUserRow } from '../db/repositories/platformUserRepository.js';
import { initDb, closeDatabase } from '../db/database.js';
import { randomBytes } from 'node:crypto';

loadBackendEnv();

async function seed() {
  await initDb();
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim() || 'syedaalin@gmail.com';
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim() || 'Pa$$w0rd11111';
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Syeda Alin';

  const existing = await findPlatformUserRowByEmail(email);
  if (existing) {
    await updatePlatformUserRow(existing.id, {
      passwordHash: await hashPassword(password),
    });
    console.log(`✅ Refreshed credentials for platform super-user ${email}.`);
  } else {
    await insertPlatformUser({
      id: randomBytes(8).toString('hex'),
      email: email.toLowerCase(),
      name,
      passwordHash: await hashPassword(password),
      role: 'super_user',
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
