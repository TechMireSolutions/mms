import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations_drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'mms.db',
  },
});
