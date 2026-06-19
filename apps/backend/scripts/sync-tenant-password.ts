import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { closeDatabase, getCollection, initDb, saveCollection } from '../src/db/database.js';
import { findTenantUserRowByLoginEmail } from '../src/db/repositories/tenantUserRepository.js';
import { getDb } from '../src/db/dbClient.js';
import { tenantUsers } from '../src/db/schema.js';
import { runWithTenant } from '../src/lib/tenantContext.js';
import { hashPassword, verifyPassword } from '../src/services/auth/passwordService.js';

async function main(): Promise<void> {
  await initDb();
  try {
  const workspace = (process.argv[2] ?? 'dar-ul-quran').trim().toLowerCase();
  const email = (process.argv[3] ?? process.env.PLATFORM_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = (process.argv[4] ?? process.env.PLATFORM_ADMIN_PASSWORD ?? '')
    .replace(/^"|"$/g, '');

  if (!email || !password) {
    console.error(
      'Usage: pnpm exec tsx scripts/sync-tenant-password.ts <workspace> <email> <password>',
    );
    console.error('Or set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in apps/backend/.env');
    process.exit(1);
  }

  const user = await findTenantUserRowByLoginEmail(workspace, email);
  if (!user) {
    console.error(`No tenant user for ${email} on ${workspace}`);
    process.exit(1);
  }

  if (await verifyPassword(password, user.passwordHash)) {
    console.log(`Tenant password already matches for ${email} on ${workspace}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await getDb()
    .update(tenantUsers)
    .set({ passwordHash })
    .where(eq(tenantUsers.id, user.id));

  await runWithTenant(workspace, async () => {
    const raw = await getCollection('users');
    if (!Array.isArray(raw)) return;
    const next = raw.map((entry) => {
      const row = entry as Record<string, unknown>;
      if (row.id !== user.id) return row;
      return { ...row, passwordHash };
    });
    await saveCollection('users', next);
  });

  console.log(`Tenant password updated for ${email} on ${workspace}`);
  } finally {
    await closeDatabase();
  }
}

void main();
