import { Pool } from 'pg';
import {
  PRACTICE_DATABASE_NAME,
  assertSafePracticeDatabase,
} from '../src/db/practice-database.js';

const target = assertSafePracticeDatabase();
const adminUrl = new URL(target);
adminUrl.pathname = '/postgres';

const pool = new Pool({ connectionString: adminUrl.toString() });

try {
  const existing = await pool.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [PRACTICE_DATABASE_NAME],
  );

  if (existing.rowCount === 0) {
    await pool.query('CREATE DATABASE "prisma_practice_blog"');
    console.log('prisma_practice_blog 데이터베이스를 생성했습니다.');
  } else {
    console.log('prisma_practice_blog 데이터베이스가 이미 준비되어 있습니다.');
  }
} finally {
  await pool.end();
}
