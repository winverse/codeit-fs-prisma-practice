import { registerDatabaseContracts } from '../test/integration/database-contracts.js';
import {
  assertSafeSeedTarget,
  seed,
} from '../src/practices/03-seeding/answers/src/seed.js';
import { createUserRepository } from '../src/practices/04-crud/answers/src/userRepository.js';
import { createRelationRepository } from '../src/practices/05-relation-queries/answers/src/relationRepository.js';
import { createPostRepository } from '../src/practices/06-advanced-queries/answers/src/postQuery.js';
import { mapPrismaError } from '../src/practices/09-error-refactor/answers/src/errors.js';
import { createPostTransactions } from '../src/practices/10-transactions/answers/src/postTransactions.js';

const practice = (path) => new URL(`../src/practices/${path}`, import.meta.url);

registerDatabaseContracts({
  seeding: {
    assertSafeSeedTarget,
    seed,
    fixture: practice('03-seeding/fixtures/seed.json'),
  },
  crud: {
    createUserRepository,
    fixture: practice('04-crud/fixtures/users.json'),
  },
  relations: { createRelationRepository },
  advanced: { createPostRepository },
  errors: { mapPrismaError },
  transactions: {
    createPostTransactions,
    fixture: practice('10-transactions/fixtures/operations.json'),
  },
});
