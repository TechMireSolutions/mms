import { initDb } from './database.js';
import { getDb } from './dbClient.js';
import { platformUsers } from './schema.js';
import { hashPassword } from '../services/auth/passwordService.js';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';

async function main() {
  await initDb();
  const db = getDb();
  
  const email = 'platform@test.com';
  const password = 'password123';
  const name = 'E2E Test Platform Admin';
  
  const passwordHash = await hashPassword(password);
  
  // Check if already exists
  const existing = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
  if (existing.length > 0) {
    console.log('E2E platform user already exists, updating password...');
    await db.update(platformUsers).set({ passwordHash }).where(eq(platformUsers.email, email));
  } else {
    console.log('Creating E2E platform user...');
    await db.insert(platformUsers).values({
      id: randomBytes(8).toString('hex'),
      email,
      name,
      passwordHash,
      createdAt: new Date(),
      emailVerifiedAt: new Date()
    });
  }
  
  console.log('E2E Platform user seeded successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
