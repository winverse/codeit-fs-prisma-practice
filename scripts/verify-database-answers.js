import { registerDatabaseContracts } from '../test/integration/database-contracts.js';
import { seed } from '../src/practices/02-seeding/answers/src/seed.js';
import { assertSafeSeedTarget } from '../src/practices/02-seeding/answers/src/seed-safety.js';
import { createUserRepository } from '../src/practices/03-crud/answers/src/userRepository.js';
import { createRelationRepository } from '../src/practices/04-relation-queries/answers/src/relationRepository.js';
import { createPostRepository } from '../src/practices/05-advanced-queries/answers/src/postQuery.js';
import { createPostTransactions } from '../src/practices/08-transactions/answers/src/postTransactions.js';

const practice = (path) => new URL(`../src/practices/${path}`, import.meta.url);

registerDatabaseContracts({
  seeding: {
    assertSafeSeedTarget,
    seed,
    fixture: practice('02-seeding/fixtures/seed.json'),
  },
  crud: {
    createUserRepository,
    fixture: practice('03-crud/fixtures/users.json'),
  },
  relations: { createRelationRepository },
  advanced: { createPostRepository },
  transactions: {
    createPostTransactions,
    fixture: practice('08-transactions/fixtures/operations.json'),
  },
});
