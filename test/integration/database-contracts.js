import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, beforeEach, test } from 'node:test';
import { prisma } from '../../src/db/prisma.js';
import {
  PRACTICE_DATABASE_NAME,
  PRACTICE_RESET_CONFIRMATION,
  resetPracticeDatabase,
} from '../../src/db/practice-database.js';

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

async function seedRelationData() {
  const ada = await prisma.user.create({
    data: { email: 'ada@practice.test', name: 'Ada' },
  });
  const grace = await prisma.user.create({
    data: { email: 'grace@practice.test', name: 'Grace' },
  });

  await prisma.post.createMany({
    data: [
      { title: 'Ada 1', published: true, authorId: ada.id },
      { title: 'Ada 2', published: false, authorId: ada.id },
      { title: 'Grace 1', published: true, authorId: grace.id },
    ],
  });

  return { ada, grace };
}

export function registerDatabaseContracts(candidates) {
  beforeEach(async () => {
    await resetPracticeDatabase(prisma, PRACTICE_RESET_CONFIRMATION);
  });

  after(async () => {
    await resetPracticeDatabase(prisma, PRACTICE_RESET_CONFIRMATION);
    await prisma.$disconnect();
  });

  test('02 실제 Prisma 시딩', async () => {
    const fixture = readJson(candidates.seeding.fixture);

    await candidates.seeding.seed(prisma, {
      ...fixture,
      databaseName: PRACTICE_DATABASE_NAME,
      databaseUrl: process.env.DATABASE_URL,
      resetConfirmation: `--allow-reset=${PRACTICE_DATABASE_NAME}`,
      nodeEnv: process.env.NODE_ENV,
    });

    const users = await prisma.user.findMany({
      orderBy: { email: 'asc' },
      include: { posts: { orderBy: { title: 'asc' } } },
    });

    assert.equal(users.length, fixture.users.length);
    for (const expected of fixture.users) {
      const actual = users.find(({ email }) => email === expected.email);
      assert.ok(actual, `${expected.email} 사용자가 실제 DB에 필요합니다.`);
      assert.equal(actual.name, expected.name);
      assert.deepEqual(
        actual.posts.map(({ title, content, authorId }) => ({
          title,
          content,
          authorId,
        })),
        expected.posts.map((post) => ({ ...post, authorId: actual.id })),
      );
    }
  });

  test('03 실제 Prisma CRUD', async () => {
    const fixture = readJson(candidates.crud.fixture);
    const repository = candidates.crud.createUserRepository(prisma);
    const created = await repository.create({
      ...fixture.create,
      email: 'crud@practice.test',
    });

    const users = await repository.findAll();
    assert.ok(users.some(({ id }) => id === created.id));

    const found = await repository.findById(String(created.id));
    assert.equal(found.id, created.id);

    const updated = await repository.update(String(created.id), fixture.update);
    assert.equal(updated.name, fixture.update.name);

    const removed = await repository.remove(String(created.id));
    assert.equal(removed.id, created.id);
    assert.equal(
      await prisma.user.findUnique({ where: { id: created.id } }),
      null,
    );
  });

  test('04 실제 Prisma 관계 쿼리', async () => {
    const { ada, grace } = await seedRelationData();
    const repository = candidates.relations.createRelationRepository(prisma);

    const users = await repository.findUsersWithPosts();
    const adaWithPosts = users.find(({ id }) => id === ada.id);
    const graceWithPosts = users.find(({ id }) => id === grace.id);
    assert.equal(adaWithPosts.posts.length, 2);
    assert.equal(graceWithPosts.posts.length, 1);

    const posts = await repository.findPostsWithAuthors();
    assert.equal(posts.length, 3);
    assert.ok(
      posts.every(
        ({ author }) =>
          author &&
          ['ada@practice.test', 'grace@practice.test'].includes(author.email),
      ),
    );
  });

  test('05 실제 Prisma 필터링·정렬·페이지네이션', async () => {
    const author = await prisma.user.create({
      data: { email: 'query@practice.test', name: 'Query Author' },
    });
    const created = [];

    for (let index = 0; index < 6; index += 1) {
      created.push(
        await prisma.post.create({
          data: {
            title: `Query ${index + 1}`,
            published: index < 5,
            authorId: author.id,
            createdAt: new Date(`2026-01-0${index + 1}T00:00:00.000Z`),
          },
        }),
      );
    }

    const repository = candidates.advanced.createPostRepository(prisma);
    const posts = await repository.findAllPosts({
      published: 'true',
      page: '2',
      limit: '2',
    });
    const expectedIds = created
      .filter(({ published }) => published)
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
      )
      .slice(2, 4)
      .map(({ id }) => id);

    assert.deepEqual(
      posts.map(({ id }) => id),
      expectedIds,
    );
    assert.ok(posts.every(({ published }) => published));
    assert.ok(posts.every(({ author: actual }) => actual.id === author.id));
  });

  test('08 실제 Prisma 트랜잭션 롤백', async () => {
    const postAuthor = await prisma.user.create({
      data: { email: 'post-author@practice.test', name: 'Post Author' },
    });
    const commentAuthor = await prisma.user.create({
      data: {
        email: 'comment-author@practice.test',
        name: 'Comment Author',
      },
    });
    const fixture = readJson(candidates.transactions.fixture);
    const transactions = candidates.transactions.createPostTransactions(prisma);

    const created = await transactions.createPostWithComment(
      { ...fixture.post, authorId: postAuthor.id },
      { ...fixture.comment, authorId: commentAuthor.id },
    );
    const comment = await prisma.comment.findFirst({
      where: { postId: created.id },
    });
    assert.ok(comment);
    assert.equal(comment.authorId, commentAuthor.id);

    await resetPracticeDatabase(prisma, PRACTICE_RESET_CONFIRMATION);
    const rollbackAuthor = await prisma.user.create({
      data: { email: 'rollback@practice.test', name: 'Rollback Author' },
    });
    const before = {
      posts: await prisma.post.count(),
      comments: await prisma.comment.count(),
    };

    await assert.rejects(() =>
      transactions.createPostWithComment(
        { ...fixture.post, authorId: rollbackAuthor.id },
        { ...fixture.failingComment, authorId: 2_000_000_000 },
      ),
    );
    assert.deepEqual(
      {
        posts: await prisma.post.count(),
        comments: await prisma.comment.count(),
      },
      before,
    );
  });
}
