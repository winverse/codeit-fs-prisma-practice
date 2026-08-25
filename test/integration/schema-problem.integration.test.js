import { PrismaClient } from '../../src/practices/01-prisma-model-relations/generated/prisma/client.ts';
import { registerSchemaDatabaseContract } from './schema-contract.js';

registerSchemaDatabaseContract(PrismaClient);
