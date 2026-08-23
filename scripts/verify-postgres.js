import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  assertAllowedSqlStatements,
  SQL_EXECUTION_TIMEOUT_MS,
} from './sql-safety.js';

const { Client } = pg;
const root = new URL('../src/practices/01-sql-basics/', import.meta.url);
const fixture = JSON.parse(
  readFileSync(new URL('fixtures/expected.json', root), 'utf8'),
);
const sqlPath = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('task.sql', root));
const sql = readFileSync(sqlPath, 'utf8');
const connectionString = process.env.PRACTICE_DATABASE_URL;

assertAllowedSqlStatements(sql);

if (!connectionString) {
  throw new Error(
    'PRACTICE_DATABASE_URL is required for explicit PostgreSQL verification',
  );
}

const target = new URL(connectionString);
const databaseName = target.pathname.slice(1);
if (!['postgresql:', 'postgres:'].includes(target.protocol)) {
  throw new Error('Only a PostgreSQL connection URL is allowed');
}
if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) {
  throw new Error('Only a local PostgreSQL host is allowed');
}
if (!databaseName.startsWith(fixture.databasePrefix)) {
  throw new Error(`Database name must start with ${fixture.databasePrefix}`);
}

const schemaName = `practice_${process.pid}_${Date.now()}`;
const client = new Client({ connectionString });
let connected = false;

async function expectPgError(statement, code) {
  await client.query('SAVEPOINT expected_failure');
  let captured;
  try {
    await client.query(statement);
  } catch (error) {
    captured = error;
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT expected_failure');
    await client.query('RELEASE SAVEPOINT expected_failure');
  }
  assert.equal(captured?.code, code);
}

try {
  await client.connect();
  connected = true;
  await client.query('SET standard_conforming_strings = on');
  await client.query(`SET statement_timeout = ${SQL_EXECUTION_TIMEOUT_MS}`);
  const stringSetting = await client.query(
    "SELECT current_setting('standard_conforming_strings') AS value",
  );
  assert.equal(stringSetting.rows[0].value, 'on');
  const timeout = await client.query(
    "SELECT setting::int AS timeout_ms FROM pg_settings WHERE name = 'statement_timeout'",
  );
  assert.equal(timeout.rows[0].timeout_ms, SQL_EXECUTION_TIMEOUT_MS);
  const server = await client.query(
    'SELECT current_database() AS database_name',
  );
  assert.equal(server.rows[0].database_name, databaseName);

  await client.query('BEGIN');
  await client.query(`CREATE SCHEMA "${schemaName}"`);
  await client.query(`SET LOCAL search_path TO "${schemaName}"`);
  const transactionBefore = await client.query(
    'SELECT pg_current_xact_id_if_assigned()::text AS transaction_id',
  );
  assert.ok(transactionBefore.rows[0].transaction_id);
  await client.query({
    text: sql,
    query_timeout: SQL_EXECUTION_TIMEOUT_MS + 500,
  });
  const transactionAfter = await client.query(
    'SELECT pg_current_xact_id_if_assigned()::text AS transaction_id',
  );
  assert.equal(
    transactionAfter.rows[0].transaction_id,
    transactionBefore.rows[0].transaction_id,
    'Student SQL must not end or replace the verifier transaction',
  );

  const tables = await client.query(
    'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename',
    [schemaName],
  );
  assert.deepEqual(
    tables.rows.map(({ tablename }) => tablename),
    [...fixture.tables].sort(),
  );

  for (const [table, count] of Object.entries(fixture.rowCounts)) {
    const rows = await client.query(
      `SELECT COUNT(*)::int AS count FROM "${table}"`,
    );
    assert.equal(rows.rows[0].count, count);
  }

  const products = await client.query(
    'SELECT "name", "price" FROM "Products" ORDER BY "id"',
  );
  assert.deepEqual(products.rows, fixture.products);

  const expensive = await client.query(
    'SELECT "name" FROM "Products" WHERE "price" >= $1 ORDER BY "id"',
    [fixture.minimumPrice],
  );
  assert.deepEqual(
    expensive.rows.map(({ name }) => name),
    fixture.expensiveProducts,
  );
  const purchases = await client.query(
    'SELECT "productId", "quantity" FROM "Purchases" WHERE "customerId" = $1 ORDER BY "id"',
    [fixture.customerId],
  );
  assert.deepEqual(purchases.rows, fixture.customerPurchases);

  await expectPgError(
    `INSERT INTO "Customers" ("id", "email", "name") VALUES (1, 'new@test.com', 'PK 중복')`,
    '23505',
  );
  await expectPgError(
    `INSERT INTO "Customers" ("email", "name")
     VALUES ((SELECT "email" FROM "Customers" ORDER BY "id" LIMIT 1), '중복')`,
    '23505',
  );
  await expectPgError(
    'INSERT INTO "Purchases" ("customerId", "productId", "quantity") VALUES (999, 1, 1)',
    '23503',
  );
  await expectPgError(
    'INSERT INTO "Purchases" ("customerId", "productId", "quantity") VALUES (1, 999, 1)',
    '23503',
  );
  await client.query('ROLLBACK');
  const rolledBack = await client.query(
    'SELECT to_regnamespace($1) AS schema_name',
    [schemaName],
  );
  assert.equal(rolledBack.rows[0].schema_name, null);

  console.log(`PostgreSQL SQL contract passed: ${sqlPath}`);
} finally {
  if (connected) {
    try {
      await client.query('ROLLBACK');
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      const cleanedUp = await client.query(
        'SELECT to_regnamespace($1) AS schema_name',
        [schemaName],
      );
      assert.equal(cleanedUp.rows[0].schema_name, null);
    } finally {
      await client.end();
    }
  }
}
