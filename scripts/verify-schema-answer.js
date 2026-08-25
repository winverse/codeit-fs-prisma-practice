import { PrismaClient } from '../src/practices/02-prisma-model-relations/answers/generated/prisma/client.ts';
import { registerSchemaDatabaseContract } from '../test/integration/schema-contract.js';

registerSchemaDatabaseContract(PrismaClient);
