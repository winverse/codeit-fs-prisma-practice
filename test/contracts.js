import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import bcrypt from 'bcrypt';

function readText(url) {
  return readFileSync(url, 'utf8');
}

function readJson(url) {
  return JSON.parse(readText(url));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mirrorCardinality(marker) {
  return {
    '||': '||',
    'o|': '|o',
    '|o': 'o|',
    'o{': '}o',
    '}o': 'o{',
    '|{': '}|',
    '}|': '|{',
  }[marker];
}

function hasMermaidRelation(source, relation) {
  const [left, edge, right] = relation.split(/\s+/);
  const [, leftMarker, rightMarker] = edge.match(
    /^(\|\||o\||\|o|o\{|\}o|\|\{|\}\|)--(\|\||o\||\|o|o\{|\}o|\|\{|\}\|)$/,
  );
  const pattern = (from, fromMarker, toMarker, to) =>
    new RegExp(
      `\\b${escapeRegExp(from)}\\s+${escapeRegExp(fromMarker)}\\s*--\\s*${escapeRegExp(toMarker)}\\s+${escapeRegExp(to)}\\b`,
    );
  return (
    pattern(left, leftMarker, rightMarker, right).test(source) ||
    pattern(
      right,
      mirrorCardinality(rightMarker),
      mirrorCardinality(leftMarker),
      left,
    ).test(source)
  );
}

function mermaidEntityBody(source, entity) {
  return source.match(
    new RegExp(`\\b${escapeRegExp(entity)}\\s*\\{([\\s\\S]*?)\\}`),
  )?.[1];
}

function tamperJwt(token) {
  const parts = token.split('.');
  const first = parts[1][0];
  parts[1] = `${first === 'a' ? 'b' : 'a'}${parts[1].slice(1)}`;
  return parts.join('.');
}

function createRecordingDelegate(methods) {
  const calls = [];
  const delegate = Object.fromEntries(
    methods.map((method) => [
      method,
      async (args) => {
        calls.push({ method, args });
        return { method, args };
      },
    ]),
  );
  return { calls, delegate };
}

function createTransactionPrisma() {
  const state = { posts: [], comments: [] };
  const operations = [];
  const transactions = [];

  const createDelegates = (scope) => ({
    post: {
      async create({ data }) {
        operations.push({ scope, method: 'post.create' });
        if (data.title === 'FAIL') throw new Error('Fixture failure');
        const post = { id: state.posts.length + 1, ...data };
        state.posts.push(post);
        return post;
      },
      async delete({ where }) {
        operations.push({ scope, method: 'post.delete' });
        if (where.id === 999) throw new Error('Fixture failure');
        const index = state.posts.findIndex(({ id }) => id === where.id);
        if (index < 0) throw new Error('Post not found');
        return state.posts.splice(index, 1)[0];
      },
      async createMany({ data }) {
        operations.push({ scope, method: 'post.createMany' });
        if (data.some(({ title }) => title === 'FAIL')) {
          throw new Error('Fixture failure');
        }
        for (const post of data) {
          state.posts.push({ id: state.posts.length + 1, ...post });
        }
        return { count: data.length };
      },
    },
    comment: {
      async create({ data }) {
        operations.push({ scope, method: 'comment.create' });
        if (data.content === 'FAIL') throw new Error('Fixture failure');
        const comment = { id: state.comments.length + 1, ...data };
        state.comments.push(comment);
        return comment;
      },
      async deleteMany({ where }) {
        operations.push({ scope, method: 'comment.deleteMany' });
        const before = state.comments.length;
        state.comments = state.comments.filter(
          ({ postId }) => postId !== where.postId,
        );
        return { count: before - state.comments.length };
      },
    },
  });

  const root = createDelegates('root');
  const tx = createDelegates('transaction');
  return {
    state,
    operations,
    transactions,
    ...root,
    async $transaction(callback) {
      if (typeof callback !== 'function') {
        throw new TypeError('A callback transaction is required');
      }
      transactions.push('callback');
      const snapshot = structuredClone(state);
      try {
        return await callback(tx);
      } catch (error) {
        state.posts = snapshot.posts;
        state.comments = snapshot.comments;
        throw error;
      }
    },
  };
}

export function registerContracts(candidates) {
  test('01 SQL 기본 사용법', () => {
    const expected = readJson(candidates.sql.fixture);
    const source = readText(candidates.sql.task);
    assert.equal(candidates.sql.assertAllowedSqlStatements(source), true);
    assert.equal(
      candidates.sql.assertAllowedSqlStatements(`
        CREATE TABLE "Purchases" (
          "id" SERIAL PRIMARY KEY,
          "customerId" INTEGER NOT NULL,
          FOREIGN KEY ("customerId") REFERENCES "Customers"("id")
        );
      `),
      true,
    );
    assert.equal(
      candidates.sql.assertAllowedSqlStatements(`
        INSERT INTO "Customers" (email, name)
        VALUES ('course@test.com', '강의 예시');
        INSERT INTO "Products" (name, price)
        VALUES ('키보드', 120000);
        INSERT INTO "Purchases" ("customerId", "productId", quantity)
        VALUES (1, 1, 1);
        SELECT * FROM "Products" WHERE price >= 1000000;
      `),
      true,
    );
    assert.equal(
      candidates.sql.assertAllowedSqlStatements(`
        INSERT INTO "Customers" ("email", "name")
        VALUES ('commit@test.com', 'END;');
        SELECT * FROM "Products"
        WHERE "name" = 'COMMIT;' /* outer /* ROLLBACK; */ comment */;
      `),
      true,
    );
    for (const unsafeSql of [
      'COMMIT;',
      '-- comment\nEND;',
      '/* comment */ ROLLBACK;',
      'START TRANSACTION;',
      "PREPARE TRANSACTION 'practice';",
      'SET search_path TO public; COMMIT;',
      'CREATE TABLE public."Customers" ("id" INTEGER);',
      'INSERT INTO public."Customers" ("id") VALUES (1);',
      'WITH rows AS (SELECT * FROM "Products") SELECT * FROM rows;',
      'SELECT pg_sleep(10);',
      "SELECT set_config('search_path', 'public', false);",
      'SELECT * FROM "Products" FOR UPDATE;',
      'SELECT * FROM "Products" UNION SELECT * FROM "Products";',
      'SELECT * INTO "Customers" FROM "Products";',
      'SELECT * FROM "pg_authid";',
      'INSERT INTO "Customers" ("email", "name") SELECT "email", "name" FROM "Customers";',
      'INSERT INTO "Customers" (password) VALUES (\'secret\');',
      'CREATE TABLE "Customers" ("id" INTEGER) AS SELECT * FROM "Products";',
      'CREATE TABLE "Customers" ("id" INTEGER, "payload" TEXT);',
      'SELECT * FROM "Products" AS foo$tag$; COMMIT; SELECT * FROM "Products" AS bar$tag$;',
      'INSERT INTO "Customers" ("email", "name") VALUES (E\'one\', \'two\');',
      'INSERT INTO "Customers" ("email", "name") VALUES (\'foo\\\\\', \', \', \'); COMMIT; SELECT 1; --\');',
      '/* unterminated',
      Array.from({ length: 17 }, () => 'SELECT * FROM "Products";').join('\n'),
      ' '.repeat(32 * 1024 + 1),
      '',
    ]) {
      assert.throws(() => candidates.sql.assertAllowedSqlStatements(unsafeSql));
    }
    assert.doesNotMatch(source, /\b(?:PRAGMA|sqlite_master|AUTOINCREMENT)\b/i);
    const normalized = source
      .replace(/--.*$/gm, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replaceAll('"', '')
      .replace(/\s+/g, ' ')
      .trim();
    const statements = normalized
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);
    const tableBodies = new Map();
    for (const table of expected.tables) {
      const match = normalized.match(
        new RegExp(
          `create\\s+table\\s+${table}\\s*\\(([\\s\\S]*?)\\)\\s*;`,
          'i',
        ),
      );
      assert.ok(match, `CREATE TABLE ${table} is required`);
      tableBodies.set(table, match[1]);
      assert.match(match[1], /\bid\s+serial\b/i);
      assert.ok(
        /\bid\s+serial\s+primary\s+key\b/i.test(match[1]) ||
          /\bprimary\s+key\s*\(\s*id\s*\)/i.test(match[1]),
        `${table}.id must be a primary key`,
      );
    }

    const customers = tableBodies.get('Customers');
    const products = tableBodies.get('Products');
    const purchases = tableBodies.get('Purchases');
    assert.match(customers, /\bemail\s+varchar\(255\)[^,]*\bnot\s+null\b/i);
    assert.ok(
      /\bemail\s+varchar\(255\)[^,]*\bunique\b/i.test(customers) ||
        /\bunique\s*\(\s*email\s*\)/i.test(customers),
      'Customers.email must be unique',
    );
    assert.match(products, /\bprice\s+integer\s+not\s+null\b/i);
    assert.match(purchases, /\bquantity\s+integer\s+not\s+null\b/i);
    assert.match(purchases, /\bdefault\s+1\b/i);

    for (const [column, target] of [
      ['customerId', 'Customers'],
      ['productId', 'Products'],
    ]) {
      assert.match(
        purchases,
        new RegExp(`\\b${column}\\s+integer\\s+not\\s+null\\b`, 'i'),
      );
      assert.ok(
        new RegExp(
          `\\b${column}\\s+integer\\s+not\\s+null[^,]*\\breferences\\s+${target}\\s*\\(\\s*id\\s*\\)`,
          'i',
        ).test(purchases) ||
          new RegExp(
            `\\bforeign\\s+key\\s*\\(\\s*${column}\\s*\\)\\s+references\\s+${target}\\s*\\(\\s*id\\s*\\)`,
            'i',
          ).test(purchases),
        `${column} must reference ${target}.id`,
      );
    }

    for (const table of expected.tables) {
      assert.ok(
        statements.some((statement) =>
          new RegExp(`^insert\\s+into\\s+${table}\\b`, 'i').test(statement),
        ),
        `INSERT INTO ${table} is required`,
      );
    }
    assert.ok(
      statements.some(
        (statement) =>
          /^select\b[\s\S]*\bfrom\s+products\b/i.test(statement) &&
          !/\bwhere\b/i.test(statement),
      ),
      'A query for all products is required',
    );
    assert.ok(
      statements.some((statement) =>
        new RegExp(
          `^select\\b[\\s\\S]*\\bfrom\\s+products\\b[\\s\\S]*\\bwhere\\s+price\\s*>=\\s*${expected.minimumPrice}\\b`,
          'i',
        ).test(statement),
      ),
      'The minimum-price product query is required',
    );
    assert.ok(
      statements.some((statement) =>
        new RegExp(
          `^select\\b[\\s\\S]*\\bfrom\\s+purchases\\b[\\s\\S]*\\bwhere\\s+customerid\\s*=\\s*${expected.customerId}\\b`,
          'i',
        ).test(statement),
      ),
      'The customer-purchases query is required',
    );
  });

  test('02 요구사항을 바탕으로 ER 모델링하기', () => {
    const model = readJson(candidates.er.model);
    const fixture = readJson(candidates.er.fixture);
    assert.equal(
      new Set(model.entities.map(({ name }) => name)).size,
      model.entities.length,
    );
    for (const name of fixture.requiredEntities) {
      const entity = model.entities.find(
        (candidate) => candidate.name === name,
      );
      assert.ok(entity, `${name} entity is required`);
      for (const attribute of fixture.requiredAttributes[name]) {
        assert.ok(
          entity.attributes.includes(attribute),
          `${name}.${attribute} is required`,
        );
      }
    }
    assert.equal(
      new Set(model.relationships.map(({ name }) => name)).size,
      model.relationships.length,
    );
    for (const relationship of fixture.requiredRelationships) {
      assert.ok(
        model.relationships.some(
          ({ name, from, to }) =>
            name === relationship.name &&
            from === relationship.from &&
            to === relationship.to,
        ),
        `${relationship.name}: ${relationship.from} -> ${relationship.to} is required`,
      );
    }
  });

  test('03 카디널리티와 Mermaid 사용하기', () => {
    const source = readText(candidates.cardinality.diagram);
    const fixture = readJson(candidates.cardinality.fixture);
    assert.match(source, /^erDiagram/m);
    for (const relation of fixture.relations)
      assert.ok(
        hasMermaidRelation(source, relation),
        `${relation} is required`,
      );
  });

  test('04 실전 데이터 모델링', () => {
    const fixture = readJson(candidates.modeling.fixture);
    const assertModel = (source, model) => {
      assert.match(source, /^erDiagram/m);
      for (const entity of model.entities) {
        const body = mermaidEntityBody(source, entity);
        assert.ok(body, `${entity} entity is required`);
        assert.match(body, /\bid\s+PK\b/, `${entity}.id PK is required`);
      }
      for (const relation of model.relations)
        assert.ok(
          hasMermaidRelation(source, relation),
          `${relation} is required`,
        );
      for (const [entity, fields] of Object.entries(model.requiredFields)) {
        const body = mermaidEntityBody(source, entity);
        for (const field of fields)
          assert.match(
            body,
            new RegExp(`\\b${escapeRegExp(field)}\\b`),
            `${entity}.${field} is required`,
          );
      }
      for (const [entity, keyFields] of Object.entries(
        model.requiredKeyFields ?? {},
      )) {
        const body = mermaidEntityBody(source, entity);
        for (const requirement of keyFields) {
          const [field, key] = requirement.split(' ');
          assert.match(
            body,
            new RegExp(`\\b${escapeRegExp(field)}\\s+[^\\n]*\\b${key}\\b`),
            `${entity}.${field} ${key} is required`,
          );
        }
      }
      for (const qualified of model.uniqueFields) {
        const [entity, field] = qualified.split('.');
        assert.match(
          mermaidEntityBody(source, entity),
          new RegExp(`\\b${escapeRegExp(field)}\\s+[^\\n]*\\bUK\\b`),
          `${qualified} must be unique`,
        );
      }
    };

    const movie = readText(candidates.modeling.diagram);
    assertModel(movie, fixture);
    for (const constraint of fixture.uniqueConstraints) {
      const match = constraint.match(/^(\w+)\((\w+),(\w+)\)$/);
      assert.ok(match);
      const [, entity, first, second] = match;
      assert.match(
        movie,
        new RegExp(
          `%%\\s*UNIQUE\\s+${entity}\\s*\\(\\s*${first}\\s*,\\s*${second}\\s*\\)`,
          'i',
        ),
        `${constraint} is required`,
      );
    }
    assert.doesNotMatch(movie, /Screening \|\|--\|\{ Ticket/);
    assert.doesNotMatch(
      mermaidEntityBody(movie, 'Seat'),
      /\bseatNumber\s+[^\n]*\bUK\b/,
    );

    const blog = readText(candidates.modeling.blog);
    assertModel(blog, fixture.blog);
  });

  test('06 환경 변수 검증', () => {
    const fixture = readJson(candidates.config.fixture);
    for (const valid of fixture.valid) {
      assert.deepEqual(candidates.config.parseConfig(valid), {
        port: Number(valid.PORT),
        databaseUrl: valid.DATABASE_URL,
      });
    }
    for (const invalid of fixture.invalid) {
      assert.throws(() => candidates.config.parseConfig(invalid));
    }
  });

  test('07 Prisma 모델과 관계', () => {
    const source = readText(candidates.schema.schema);
    const fixture = readJson(candidates.schema.fixture);
    for (const model of fixture.models)
      assert.match(source, new RegExp(`model ${model} \\{`));
    for (const token of fixture.requiredTokens)
      assert.ok(source.includes(token));
  });

  test('08 시딩', async () => {
    const fixture = readJson(candidates.seeding.fixture);
    assert.equal(fixture.users.length, 5);
    assert.ok(fixture.users.every(({ posts }) => posts.length >= 1));
    assert.equal(
      candidates.seeding.assertSafeSeedTarget(
        fixture.databaseUrl,
        fixture.resetConfirmation,
        fixture.databaseName,
        fixture.nodeEnv,
      ),
      true,
    );
    for (const localUrl of [
      `postgresql://localhost/${fixture.databaseName}`,
      `postgres://127.0.0.1/${fixture.databaseName}`,
      `postgresql://[::1]/${fixture.databaseName}`,
    ]) {
      assert.equal(
        candidates.seeding.assertSafeSeedTarget(
          localUrl,
          fixture.resetConfirmation,
          fixture.databaseName,
          fixture.nodeEnv,
        ),
        true,
      );
    }
    assert.throws(() =>
      candidates.seeding.assertSafeSeedTarget(
        'postgresql://database.example/prisma_blog',
        fixture.resetConfirmation,
        fixture.databaseName,
        fixture.nodeEnv,
      ),
    );
    for (const protocol of ['https:', 'mysql:']) {
      assert.throws(() =>
        candidates.seeding.assertSafeSeedTarget(
          `${protocol}//127.0.0.1/${fixture.databaseName}`,
          fixture.resetConfirmation,
          fixture.databaseName,
          fixture.nodeEnv,
        ),
      );
    }
    assert.throws(() =>
      candidates.seeding.assertSafeSeedTarget(
        'postgresql://127.0.0.1/production',
        fixture.resetConfirmation,
        fixture.databaseName,
        fixture.nodeEnv,
      ),
    );
    assert.throws(() =>
      candidates.seeding.assertSafeSeedTarget(
        fixture.databaseUrl,
        '--allow-reset=other',
        fixture.databaseName,
        fixture.nodeEnv,
      ),
    );
    assert.throws(() =>
      candidates.seeding.assertSafeSeedTarget(
        fixture.databaseUrl,
        fixture.resetConfirmation,
        fixture.databaseName,
        'production',
      ),
    );

    let unsafeMutationCount = 0;
    const recordUnsafeMutation = async () => {
      unsafeMutationCount += 1;
      return { count: 0 };
    };
    const unsafePrisma = {
      post: {
        deleteMany: recordUnsafeMutation,
        createMany: recordUnsafeMutation,
      },
      user: {
        deleteMany: recordUnsafeMutation,
        createMany: recordUnsafeMutation,
        findMany: recordUnsafeMutation,
      },
      async $transaction(operations) {
        unsafeMutationCount += 1;
        return Promise.all(operations);
      },
    };
    await assert.rejects(() =>
      candidates.seeding.seed(unsafePrisma, {
        ...fixture,
        nodeEnv: 'production',
      }),
    );
    assert.equal(unsafeMutationCount, 0);

    const calls = [];
    const storedUsers = fixture.users.map(({ email }, index) => ({
      id: index + 1,
      email,
    }));
    const prisma = {
      post: {
        deleteMany() {
          calls.push('post.deleteMany');
          return Promise.resolve({ count: 0 });
        },
        async createMany({ data }) {
          calls.push({ postCreateMany: data });
          return { count: data.length };
        },
      },
      user: {
        deleteMany() {
          calls.push('user.deleteMany');
          return Promise.resolve({ count: 0 });
        },
        async createMany({ data }) {
          calls.push({ userCreateMany: data });
          return { count: data.length };
        },
        async findMany(args) {
          calls.push({ userFindMany: args });
          return storedUsers;
        },
      },
      async $transaction(operations) {
        calls.push({ transactionOperations: operations.length });
        return Promise.all(operations);
      },
    };
    await candidates.seeding.seed(prisma, fixture);
    assert.deepEqual(calls.slice(0, 3), [
      'post.deleteMany',
      'user.deleteMany',
      { transactionOperations: 2 },
    ]);
    const userCreate = calls.find((call) => call.userCreateMany);
    const userFind = calls.find((call) => call.userFindMany);
    const postCreate = calls.find((call) => call.postCreateMany);
    assert.equal(userCreate.userCreateMany.length, fixture.users.length);
    assert.deepEqual(userFind.userFindMany, {
      where: {
        email: { in: fixture.users.map(({ email }) => email) },
      },
      select: { id: true, email: true },
    });
    assert.equal(
      postCreate.postCreateMany.length,
      fixture.users.reduce((count, { posts }) => count + posts.length, 0),
    );
    assert.ok(
      postCreate.postCreateMany.every(({ authorId }) =>
        storedUsers.some(({ id }) => id === authorId),
      ),
    );
  });

  test('09 CRUD', async () => {
    const fixture = readJson(candidates.crud.fixture);
    const { calls, delegate } = createRecordingDelegate([
      'create',
      'findMany',
      'findUnique',
      'update',
      'delete',
    ]);
    const repository = candidates.crud.createUserRepository({ user: delegate });
    await repository.create(fixture.create);
    await repository.findAll();
    await repository.findById(fixture.id);
    await repository.update(fixture.id, fixture.update);
    await repository.remove(fixture.id);
    assert.deepEqual(calls, [
      { method: 'create', args: { data: fixture.create } },
      { method: 'findMany', args: undefined },
      { method: 'findUnique', args: { where: { id: Number(fixture.id) } } },
      {
        method: 'update',
        args: { where: { id: Number(fixture.id) }, data: fixture.update },
      },
      { method: 'delete', args: { where: { id: Number(fixture.id) } } },
    ]);
  });

  test('10 관계 쿼리', async () => {
    const users = createRecordingDelegate(['findMany']);
    const posts = createRecordingDelegate(['findMany']);
    const repository = candidates.relations.createRelationRepository({
      user: users.delegate,
      post: posts.delegate,
    });
    await repository.findUsersWithPosts();
    await repository.findPostsWithAuthors();
    assert.equal(users.calls.length, 1);
    assert.equal(posts.calls.length, 1);
    const postsRelation =
      users.calls[0].args.include?.posts ?? users.calls[0].args.select?.posts;
    assert.ok(postsRelation, 'posts relation is required');
    const authorRelation =
      posts.calls[0].args.include?.author ?? posts.calls[0].args.select?.author;
    assert.ok(authorRelation, 'author relation is required');
    if (authorRelation !== true) {
      assert.deepEqual(authorRelation.select, {
        id: true,
        email: true,
        name: true,
      });
    }
  });

  test('11 고급 쿼리', () => {
    const fixture = readJson(candidates.advanced.fixture);
    const query = candidates.advanced.buildPostQuery(fixture.input);
    assert.deepEqual(query, fixture.expected);
    assert.deepEqual(candidates.advanced.buildPostQuery({}), {
      where: {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 0,
      take: 10,
    });
    const custom = candidates.advanced.buildPostQuery({
      published: 'false',
      authorId: '7',
      sortBy: 'title',
      order: 'asc',
    });
    assert.deepEqual(custom.where, { published: false, authorId: 7 });
    assert.deepEqual(custom.orderBy, [{ title: 'asc' }, { id: 'asc' }]);
    for (const invalid of [
      { page: '0' },
      { page: '1.5' },
      { limit: '101' },
      { limit: 'abc' },
      { published: 'yes' },
      { authorId: '0' },
      { sortBy: 'email' },
      { order: 'sideways' },
    ]) {
      assert.throws(() => candidates.advanced.buildPostQuery(invalid));
    }
  });

  test('12 트랜잭션', async () => {
    const fixture = readJson(candidates.transactions.fixture);
    const prisma = createTransactionPrisma();
    const service = candidates.transactions.createPostTransactions(prisma);
    const created = await service.createPostWithComment(
      fixture.post,
      fixture.comment,
    );
    assert.deepEqual(prisma.transactions, ['callback']);
    assert.deepEqual(prisma.operations.slice(-2), [
      { scope: 'transaction', method: 'post.create' },
      { scope: 'transaction', method: 'comment.create' },
    ]);
    assert.equal(prisma.state.posts.length, 1);
    assert.equal(prisma.state.comments[0].postId, created.id);
    await assert.rejects(() =>
      service.createPostWithComment(fixture.post, fixture.failingComment),
    );
    assert.deepEqual(prisma.transactions, ['callback', 'callback']);
    assert.equal(prisma.state.posts.length, 1);
    assert.equal(prisma.state.comments.length, 1);
    const deleted = await service.deletePostWithComments(created.id);
    assert.deepEqual(prisma.transactions, ['callback', 'callback', 'callback']);
    assert.deepEqual(prisma.operations.slice(-2), [
      { scope: 'transaction', method: 'comment.deleteMany' },
      { scope: 'transaction', method: 'post.delete' },
    ]);
    assert.equal(deleted.deletedCommentsCount, 1);
    assert.equal(deleted.deletedPost.id, created.id);
    assert.deepEqual(prisma.state, { posts: [], comments: [] });

    prisma.state.posts.push({ id: fixture.failingDeleteId, ...fixture.post });
    prisma.state.comments.push({
      id: 1,
      postId: fixture.failingDeleteId,
      ...fixture.comment,
    });
    const beforeFailedDelete = structuredClone(prisma.state);
    await assert.rejects(() =>
      service.deletePostWithComments(fixture.failingDeleteId),
    );
    assert.deepEqual(prisma.state, beforeFailedDelete);
    assert.equal(prisma.transactions.length, 4);
  });

  test('13 인증 유틸리티와 미들웨어', async () => {
    const fixture = readJson(candidates.auth.fixture);
    const packageJson = readJson(new URL('../package.json', import.meta.url));
    assert.equal(packageJson.dependencies.bcrypt, '6.0.0');
    assert.equal(packageJson.dependencies.jsonwebtoken, '9.0.3');

    const stored = await candidates.auth.hashPassword(fixture.password);
    assert.notEqual(stored, fixture.password);
    assert.equal(bcrypt.getRounds(stored), 10);
    assert.equal(
      await candidates.auth.comparePassword(fixture.password, stored),
      true,
    );
    assert.equal(
      await candidates.auth.comparePassword(fixture.wrongPassword, stored),
      false,
    );

    const tokens = candidates.auth.generateTokens(
      fixture.user,
      fixture.secrets,
      { access: '1h', refresh: '2h' },
    );
    const accessPayload = candidates.auth.verifyToken(
      tokens.accessToken,
      'access',
      fixture.secrets,
    );
    const refreshPayload = candidates.auth.verifyToken(
      tokens.refreshToken,
      'refresh',
      fixture.secrets,
    );
    assert.equal(accessPayload.userId, fixture.user.id);
    assert.equal(refreshPayload.userId, fixture.user.id);
    const customClaims = (payload) =>
      Object.keys(payload)
        .filter((key) => !['iat', 'exp'].includes(key))
        .sort();
    assert.deepEqual(customClaims(accessPayload), ['userId']);
    assert.deepEqual(customClaims(refreshPayload), ['userId']);
    assert.equal(
      candidates.auth.verifyToken(
        tokens.accessToken,
        'refresh',
        fixture.secrets,
      ),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(
        tokens.refreshToken,
        'access',
        fixture.secrets,
      ),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(
        tokens.accessToken,
        'unknown',
        fixture.secrets,
      ),
      null,
    );

    const tamperedAccess = tamperJwt(tokens.accessToken);
    const tamperedRefresh = tamperJwt(tokens.refreshToken);
    const expiredTokens = candidates.auth.generateTokens(
      fixture.user,
      fixture.secrets,
      { access: -1, refresh: -1 },
    );
    assert.equal(
      candidates.auth.verifyToken(undefined, 'access', fixture.secrets),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(tamperedAccess, 'access', fixture.secrets),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(
        expiredTokens.accessToken,
        'access',
        fixture.secrets,
      ),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(undefined, 'refresh', fixture.secrets),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(tamperedRefresh, 'refresh', fixture.secrets),
      null,
    );
    assert.equal(
      candidates.auth.verifyToken(
        expiredTokens.refreshToken,
        'refresh',
        fixture.secrets,
      ),
      null,
    );

    const cookieCalls = [];
    const cookieResponse = {
      cookie(name, value, options) {
        cookieCalls.push({ name, value, options });
      },
    };
    candidates.auth.setAuthCookies(cookieResponse, tokens, {
      secure: fixture.cookie.secure,
    });
    const baseCookieOptions = {
      httpOnly: true,
      secure: fixture.cookie.secure,
      sameSite: 'lax',
      path: '/',
    };
    assert.deepEqual(cookieCalls, [
      {
        name: 'accessToken',
        value: tokens.accessToken,
        options: {
          ...baseCookieOptions,
          maxAge: fixture.cookie.accessMaxAge,
        },
      },
      {
        name: 'refreshToken',
        value: tokens.refreshToken,
        options: {
          ...baseCookieOptions,
          maxAge: fixture.cookie.refreshMaxAge,
        },
      },
    ]);

    const publicUser = candidates.auth.toPublicUser(fixture.user);
    assert.equal('password' in publicUser, false);
    assert.equal(fixture.user.password, 'must-not-leak');

    const databaseUser = { ...fixture.user, name: 'Ada from database' };
    const runAuthentication = async ({
      accessToken,
      refreshToken,
      findUserById = async (userId) =>
        userId === fixture.user.id ? databaseUser : null,
    }) => {
      const cookies = {};
      if (accessToken !== undefined) cookies.accessToken = accessToken;
      if (refreshToken !== undefined) cookies.refreshToken = refreshToken;
      const request = { cookies };
      let nextCalled = false;
      const cookieCalls = [];
      const lookups = [];
      const response = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.body = body;
          return this;
        },
        cookie(name, value, options) {
          cookieCalls.push({ name, value, options });
          return this;
        },
      };
      await candidates.auth.authenticate(fixture.secrets, {
        secure: fixture.cookie.secure,
        async findUserById(userId) {
          lookups.push(userId);
          return findUserById(userId);
        },
      })(request, response, () => {
        nextCalled = true;
      });
      return { request, response, nextCalled, cookieCalls, lookups };
    };

    const authenticated = await runAuthentication({
      accessToken: tokens.accessToken,
    });
    assert.equal(authenticated.nextCalled, true);
    assert.equal(authenticated.request.user.id, fixture.user.id);
    assert.equal(authenticated.request.user.name, databaseUser.name);
    assert.equal('password' in authenticated.request.user, false);
    assert.deepEqual(authenticated.lookups, [fixture.user.id]);
    assert.equal(authenticated.cookieCalls.length, 0);

    for (const rejectedToken of [
      undefined,
      tamperedAccess,
      expiredTokens.accessToken,
    ]) {
      const rejected = await runAuthentication({ accessToken: rejectedToken });
      assert.equal(rejected.nextCalled, false);
      assert.equal(rejected.response.statusCode, 401);
      assert.equal(typeof rejected.response.body.message, 'string');
    }

    const missingUser = await runAuthentication({
      accessToken: tokens.accessToken,
      findUserById: async () => null,
    });
    assert.equal(missingUser.nextCalled, false);
    assert.equal(missingUser.response.statusCode, 401);

    const nearExpiry = candidates.auth.generateTokens(
      fixture.user,
      fixture.secrets,
      { access: '4m', refresh: '2h' },
    );
    const withoutRefresh = await runAuthentication({
      accessToken: nearExpiry.accessToken,
    });
    assert.equal(withoutRefresh.nextCalled, true);
    assert.equal(withoutRefresh.cookieCalls.length, 0);
    assert.deepEqual(withoutRefresh.lookups, [fixture.user.id]);

    const refreshed = await runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: nearExpiry.refreshToken,
    });
    assert.equal(refreshed.nextCalled, true);
    assert.equal(refreshed.cookieCalls.length, 2);
    assert.deepEqual(refreshed.lookups, [fixture.user.id, fixture.user.id]);

    const otherUserTokens = candidates.auth.generateTokens(
      { ...fixture.user, id: 2 },
      fixture.secrets,
      { access: '4m', refresh: '2h' },
    );
    const mismatched = await runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: otherUserTokens.refreshToken,
    });
    assert.equal(mismatched.nextCalled, true);
    assert.equal(mismatched.cookieCalls.length, 0);
    assert.deepEqual(mismatched.lookups, [fixture.user.id]);
  });

  test('14 유효성 검사', () => {
    const fixture = readJson(candidates.validation.fixture);
    assert.equal(
      candidates.validation.signupSchema.safeParse(fixture.validSignup).success,
      true,
    );
    const signupWithoutName = { ...fixture.validSignup };
    delete signupWithoutName.name;
    const optionalName =
      candidates.validation.signupSchema.safeParse(signupWithoutName);
    assert.equal(optionalName.success, true);
    assert.deepEqual(optionalName.data, signupWithoutName);
    for (const invalid of fixture.invalidSignup) {
      assert.equal(
        candidates.validation.signupSchema.safeParse(invalid).success,
        false,
      );
    }
    assert.equal(
      candidates.validation.loginSchema.safeParse(fixture.validLogin).success,
      true,
    );
    for (const invalid of fixture.invalidLogin) {
      assert.equal(
        candidates.validation.loginSchema.safeParse(invalid).success,
        false,
      );
    }
    for (const password of ['a'.repeat(15), 'a'.repeat(72), '가'.repeat(24)]) {
      assert.equal(
        candidates.validation.signupSchema.safeParse({
          ...fixture.validSignup,
          password,
        }).success,
        true,
      );
      assert.equal(
        candidates.validation.loginSchema.safeParse({
          ...fixture.validLogin,
          password,
        }).success,
        true,
      );
    }
    for (const password of ['a'.repeat(73), '가'.repeat(25)]) {
      assert.equal(
        candidates.validation.signupSchema.safeParse({
          ...fixture.validSignup,
          password,
        }).success,
        false,
      );
      assert.equal(
        candidates.validation.loginSchema.safeParse({
          ...fixture.validLogin,
          password,
        }).success,
        false,
      );
    }
    for (const password of ['a'.repeat(14), '😀'.repeat(8)]) {
      assert.equal(
        candidates.validation.signupSchema.safeParse({
          ...fixture.validSignup,
          password,
        }).success,
        false,
      );
    }
    assert.equal(
      candidates.validation.signupSchema.safeParse({
        ...fixture.validSignup,
        password: '😀'.repeat(15),
      }).success,
      true,
    );
    const signupWithUnknownField = candidates.validation.signupSchema.safeParse(
      {
        ...fixture.validSignup,
        role: 'admin',
      },
    );
    assert.equal(signupWithUnknownField.success, true);
    assert.deepEqual(signupWithUnknownField.data, fixture.validSignup);
  });

  test('15 커스텀 에러와 검증 리팩터링', () => {
    const fixture = readJson(candidates.errors.fixture);
    for (const { name, label } of fixture.params) {
      for (const value of fixture.valid) {
        const req = { params: { [name]: value } };
        let nextValue;
        candidates.errors.validateIdParam(name, label)(req, {}, (error) => {
          nextValue = error ?? null;
        });
        assert.equal(nextValue, null);
        assert.equal(req.params[name], Number(value));
      }
      for (const value of fixture.invalid) {
        const req = { params: { [name]: value } };
        let captured;
        candidates.errors.validateIdParam(name, label)(req, {}, (error) => {
          captured = error;
        });
        assert.ok(captured instanceof candidates.errors.HttpError);
        assert.equal(captured.status, 400);
      }
    }
    const handleError = (error) => {
      const response = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.body = body;
          return this;
        },
      };
      candidates.errors.errorHandler(error, {}, response, () => {});
      return response;
    };

    const customResponse = handleError(
      new candidates.errors.HttpError(404, 'Not found'),
    );
    assert.equal(customResponse.statusCode, 404);
    assert.deepEqual(customResponse.body, { message: 'Not found' });

    let notFoundError;
    candidates.errors.notFoundHandler({}, {}, (error) => {
      notFoundError = error;
    });
    assert.ok(notFoundError instanceof candidates.errors.HttpError);
    assert.equal(notFoundError.status, 404);
    const notFoundResponse = handleError(notFoundError);
    assert.equal(notFoundResponse.statusCode, 404);
    assert.deepEqual(notFoundResponse.body, { message: 'Not found' });

    for (const [statusProperty, status] of [
      ['status', 400],
      ['statusCode', 413],
    ]) {
      const internalMessage = `Internal ${status} details`;
      const error = new Error(internalMessage);
      error[statusProperty] = status;
      const clientResponse = handleError(error);
      assert.equal(clientResponse.statusCode, status);
      assert.deepEqual(clientResponse.body, { message: 'Bad request' });
      assert.notEqual(clientResponse.body.message, internalMessage);
    }

    const internalMessage = 'Database credentials leaked';
    const unexpectedResponse = handleError(new Error(internalMessage));
    assert.equal(unexpectedResponse.statusCode, 500);
    assert.deepEqual(unexpectedResponse.body, {
      message: 'Internal server error',
    });
    assert.notEqual(unexpectedResponse.body.message, internalMessage);
  });
}
