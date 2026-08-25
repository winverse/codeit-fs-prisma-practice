import { registerContracts } from './contracts.js';
import {
  assertSafeSeedTarget,
  seed,
} from '../src/practices/03-seeding/src/seed.js';
import { createUserRepository } from '../src/practices/04-crud/src/userRepository.js';
import { createRelationRepository } from '../src/practices/05-relation-queries/src/relationRepository.js';
import { buildPostQuery } from '../src/practices/06-advanced-queries/src/postQuery.js';
import * as auth from '../src/practices/07-auth/src/auth.js';
import * as validation from '../src/practices/08-validation/src/schemas.js';
import * as errors from '../src/practices/09-error-refactor/src/errors.js';
import { createPostTransactions } from '../src/practices/10-transactions/src/postTransactions.js';

const practice = (path) => new URL(`../src/practices/${path}`, import.meta.url);

registerContracts({
  schema: {
    schema: practice('02-prisma-model-relations/prisma/schema.prisma'),
    fixture: practice('02-prisma-model-relations/fixtures/expected.json'),
  },
  seeding: {
    assertSafeSeedTarget,
    seed,
    fixture: practice('03-seeding/fixtures/seed.json'),
  },
  crud: {
    createUserRepository,
    fixture: practice('04-crud/fixtures/users.json'),
  },
  relations: {
    createRelationRepository,
    fixture: practice('05-relation-queries/fixtures/expected.json'),
  },
  advanced: {
    buildPostQuery,
    fixture: practice('06-advanced-queries/fixtures/query.json'),
  },
  auth: { ...auth, fixture: practice('07-auth/fixtures/auth.json') },
  validation: {
    ...validation,
    fixture: practice('08-validation/fixtures/cases.json'),
  },
  errors: {
    ...errors,
    fixture: practice('09-error-refactor/fixtures/ids.json'),
  },
  transactions: {
    createPostTransactions,
    fixture: practice('10-transactions/fixtures/operations.json'),
  },
});
