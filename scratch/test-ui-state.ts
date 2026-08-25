import { getDb } from './apps/backend/src/db/dbClient.js';
import { userUiPreferences } from './apps/backend/src/db/schema/system.js';

async function main() {
  const db = getDb();
  const res = await db.select().from(userUiPreferences);
  console.log(res);
  process.exit(0);
}
main();
