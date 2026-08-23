import { registerContracts } from '../test/contracts.js';
import { parseConfig } from '../src/practices/06-project-config/answers/src/config.js';
import {
  assertSafeSeedTarget,
  seed,
} from '../src/practices/08-seeding/answers/src/seed.js';
import { createUserRepository } from '../src/practices/09-crud/answers/src/userRepository.js';
import { createRelationRepository } from '../src/practices/10-relation-queries/answers/src/relationRepository.js';
import { buildPostQuery } from '../src/practices/11-advanced-queries/answers/src/postQuery.js';
import { createPostTransactions } from '../src/practices/12-transactions/answers/src/postTransactions.js';
import * as auth from '../src/practices/13-auth/answers/src/auth.js';
import * as validation from '../src/practices/14-validation/answers/src/schemas.js';
import * as errors from '../src/practices/15-error-refactor/answers/src/errors.js';
import { assertAllowedSqlStatements } from './sql-safety.js';

const practice = (path) => new URL(`../src/practices/${path}`, import.meta.url);

registerContracts({
  sql: {
    task: practice('01-sql-basics/answers/task.sql'),
    fixture: practice('01-sql-basics/fixtures/expected.json'),
    assertAllowedSqlStatements,
  },
  er: {
    model: practice('02-er-requirements/answers/model.json'),
    fixture: practice('02-er-requirements/fixtures/requirements.json'),
  },
  cardinality: {
    diagram: practice('03-cardinality-mermaid/answers/diagram.mmd'),
    fixture: practice('03-cardinality-mermaid/fixtures/cardinalities.json'),
  },
  modeling: {
    diagram: practice('04-practical-modeling/answers/diagram.mmd'),
    blog: practice('04-practical-modeling/answers/blog-diagram.mmd'),
    fixture: practice('04-practical-modeling/fixtures/constraints.json'),
  },
  config: {
    parseConfig,
    fixture: practice('06-project-config/fixtures/environments.json'),
  },
  schema: {
    schema: practice('07-prisma-model-relations/answers/prisma/schema.prisma'),
    fixture: practice('07-prisma-model-relations/fixtures/expected.json'),
  },
  seeding: {
    assertSafeSeedTarget,
    seed,
    fixture: practice('08-seeding/fixtures/seed.json'),
  },
  crud: {
    createUserRepository,
    fixture: practice('09-crud/fixtures/users.json'),
  },
  relations: {
    createRelationRepository,
    fixture: practice('10-relation-queries/fixtures/expected.json'),
  },
  advanced: {
    buildPostQuery,
    fixture: practice('11-advanced-queries/fixtures/query.json'),
  },
  transactions: {
    createPostTransactions,
    fixture: practice('12-transactions/fixtures/operations.json'),
  },
  auth: { ...auth, fixture: practice('13-auth/fixtures/auth.json') },
  validation: {
    ...validation,
    fixture: practice('14-validation/fixtures/cases.json'),
  },
  errors: {
    ...errors,
    fixture: practice('15-error-refactor/fixtures/ids.json'),
  },
});
