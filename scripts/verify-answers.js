import { registerContracts } from '../test/contracts.js';
import { seed } from '../src/practices/02-seeding/answers/src/seed.js';
import { assertSafeSeedTarget } from '../src/practices/02-seeding/answers/src/seed-safety.js';
import { createUserRepository } from '../src/practices/03-crud/answers/src/userRepository.js';
import { createRelationRepository } from '../src/practices/04-relation-queries/answers/src/relationRepository.js';
import {
  buildPostQuery,
  createPostRepository,
} from '../src/practices/05-advanced-queries/answers/src/postQuery.js';
import * as auth from '../src/practices/06-auth/answers/src/auth.js';
import { authRouter } from '../src/practices/07-validation/answers/src/auth.routes.js';
import { errorHandler } from '../src/practices/07-validation/answers/src/error-handler.middleware.js';
import * as validation from '../src/practices/07-validation/answers/src/schemas.js';
import { createPostTransactions } from '../src/practices/08-transactions/answers/src/postTransactions.js';

const practice = (path) => new URL(`../src/practices/${path}`, import.meta.url);

registerContracts({
  schema: {
    schema: practice('01-prisma-model-relations/answers/prisma/schema.prisma'),
    fixture: practice('01-prisma-model-relations/fixtures/expected.json'),
  },
  seeding: {
    assertSafeSeedTarget,
    seed,
    fixture: practice('02-seeding/fixtures/seed.json'),
  },
  crud: {
    createUserRepository,
    fixture: practice('03-crud/fixtures/users.json'),
  },
  relations: {
    createRelationRepository,
  },
  advanced: {
    buildPostQuery,
    createPostRepository,
    fixture: practice('05-advanced-queries/fixtures/query.json'),
  },
  auth: { ...auth, fixture: practice('06-auth/fixtures/auth.json') },
  validation: {
    ...validation,
    authRouter,
    errorHandler,
    fixture: practice('07-validation/fixtures/cases.json'),
  },
  transactions: {
    createPostTransactions,
    fixture: practice('08-transactions/fixtures/operations.json'),
  },
});
