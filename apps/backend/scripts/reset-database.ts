import { initDb, resetDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  // Initialize connection
  await initDb();
  
  console.log('Resetting the entire database (dropping all tables, schemas, and reseeding platform administrator)...');
  await resetDatabase();
  console.log('Database successfully reset!');
  
  process.exit(0);
}

main().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
