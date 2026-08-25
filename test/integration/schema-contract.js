import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { prisma } from '../../src/db/prisma.js';
import {
  PRACTICE_RESET_CONFIRMATION,
  assertSafePracticeDatabase,
  resetPracticeDatabase,
} from '../../src/db/practice-database.js';

export function registerSchemaDatabaseContract(PrismaClient) {
  test('02 실제 Prisma 모델과 관계', async () => {
    const target = assertSafePracticeDatabase();
    const candidate = new PrismaClient({
      adapter: new PrismaPg({ connectionString: target.toString() }),
    });

    try {
      await resetPracticeDatabase(prisma, PRACTICE_RESET_CONFIRMATION);
      const user = await candidate.user.create({
        data: {
          email: 'schema@practice.test',
          name: 'Schema User',
          posts: {
            create: { title: 'Schema Post', published: true },
          },
        },
        include: { posts: true },
      });

      assert.equal(user.posts.length, 1);
      assert.equal(user.posts[0].authorId, user.id);

      const postId = user.posts[0].id;
      const found = await candidate.post.findUnique({
        where: { id: postId },
        include: { author: true },
      });
      assert.equal(found.author.id, user.id);

      await candidate.user.delete({ where: { id: user.id } });
      assert.equal(
        await candidate.post.findUnique({ where: { id: postId } }),
        null,
      );
    } finally {
      await resetPracticeDatabase(prisma, PRACTICE_RESET_CONFIRMATION);
      await candidate.$disconnect();
      await prisma.$disconnect();
    }
  });
}
