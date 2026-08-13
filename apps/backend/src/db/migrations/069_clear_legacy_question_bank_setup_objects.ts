import { like } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';

export async function runMigration069(): Promise<void> {
  console.log('Clearing legacy question_bank_settings from objects table...');
  const db = getDb();
  
  // Use db.delete to remove legacy configuration objects
  const result = await db
    .delete(schema.objects)
    .where(like(schema.objects.key, 'tenant:%:question_bank_settings'));
    
  console.log(`Cleared ${result.rowCount} legacy question_bank_settings objects.`);
}
