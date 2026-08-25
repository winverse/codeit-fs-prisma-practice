import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PRACTICE_DATABASE_NAME,
  assertSafePracticeDatabase,
} from '../src/db/practice-database.js';

test('practice DB 안전 경계', () => {
  for (const databaseUrl of [
    `postgresql://localhost:5432/${PRACTICE_DATABASE_NAME}`,
    `postgres://127.0.0.1:5432/${PRACTICE_DATABASE_NAME}`,
    `postgresql://[::1]:5432/${PRACTICE_DATABASE_NAME}`,
  ]) {
    assert.equal(
      assertSafePracticeDatabase(databaseUrl, 'development').pathname,
      `/${PRACTICE_DATABASE_NAME}`,
    );
  }

  for (const [databaseUrl, nodeEnv] of [
    [`postgresql://database.example/${PRACTICE_DATABASE_NAME}`, 'development'],
    ['postgresql://localhost/production', 'development'],
    [`mysql://localhost/${PRACTICE_DATABASE_NAME}`, 'development'],
    [`postgresql://localhost:6543/${PRACTICE_DATABASE_NAME}`, 'development'],
    [
      `postgresql://localhost:5432/${PRACTICE_DATABASE_NAME}?host=example.com`,
      'development',
    ],
    [`postgresql://localhost/${PRACTICE_DATABASE_NAME}`, 'production'],
    ['not-a-url', 'development'],
  ]) {
    assert.throws(() => assertSafePracticeDatabase(databaseUrl, nodeEnv));
  }
});
