import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:./local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
