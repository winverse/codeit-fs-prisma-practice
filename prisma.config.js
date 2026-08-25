import { defineConfig, env } from 'prisma/config';
import { assertSafePracticeDatabase } from './src/db/practice-database.js';

const databaseUrl = env('DATABASE_URL');
assertSafePracticeDatabase(databaseUrl, process.env.NODE_ENV);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
