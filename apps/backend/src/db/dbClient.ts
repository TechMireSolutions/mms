import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

let _db: NodePgDatabase<typeof schema> | null = null;

export function setDb(instance: NodePgDatabase<typeof schema>): void {
  _db = instance;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    throw new Error('Database not initialized');
  }
  return _db;
}
