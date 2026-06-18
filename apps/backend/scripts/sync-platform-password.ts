import 'dotenv/config';
import { findPlatformUserByEmail, updatePlatformUserPassword } from '../src/services/platform/platformUserService.js';
import { hashPassword, verifyPassword } from '../src/services/auth/passwordService.js';

async function main(): Promise<void> {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.replace(/^"|"$/g, '') ?? '';
  if (!email || !password) {
    console.error('Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in apps/backend/.env');
    process.exit(1);
  }

  const user = await findPlatformUserByEmail(email);
  if (!user) {
    console.error(`No platform user for ${email}`);
    process.exit(1);
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (matches) {
    console.log(`Platform password already matches .env for ${email}`);
    return;
  }

  await updatePlatformUserPassword(user.id, await hashPassword(password));
  console.log(`Platform password updated to match PLATFORM_ADMIN_PASSWORD for ${email}`);
}

void main();
