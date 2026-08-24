import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function readText(url) {
  return readFileSync(url, 'utf8');
}

function readJson(url) {
  return JSON.parse(readText(url));
}

function compactPrisma(source) {
  return source.replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
}

function readPrismaModel(source, modelName) {
  const match = source
    .replace(/\/\/.*$/gm, '')
    .match(new RegExp(`model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `${modelName} model is required`);
  return match[1]
    .split('\n')
    .map((line) => compactPrisma(line))
    .filter(Boolean);
}

function sortRecords(records) {
  return structuredClone(records).sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );
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
  test('01 환경 변수 검증', () => {
    const fixture = readJson(candidates.config.fixture);
    for (const valid of fixture.valid) {
      assert.deepEqual(candidates.config.parseConfig(valid), {
        port: Number(valid.PORT),
        databaseUrl: valid.DATABASE_URL.trim(),
      });
    }
    for (const invalid of fixture.invalid) {
      assert.throws(() => candidates.config.parseConfig(invalid));
    }
  });

  test('02 Prisma 모델과 관계', () => {
    const source = readText(candidates.schema.schema);
    const fixture = readJson(candidates.schema.fixture);
    const compactSource = compactPrisma(source);
    for (const token of fixture.requiredTokens) {
      assert.ok(compactSource.includes(compactPrisma(token)));
    }
    for (const [modelName, fields] of Object.entries(fixture.models)) {
      const modelFields = readPrismaModel(source, modelName);
      for (const field of fields) {
        assert.ok(
          modelFields.includes(compactPrisma(field)),
          `${modelName}.${field.split(' ')[0]} is required`,
        );
      }
    }
  });

  test('03 시딩', async () => {
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
    const storedUsers = fixture.users
      .map(({ email }, index) => ({
        id: 101 + index * 103,
        email,
      }))
      .reverse();
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
    assert.equal(calls.filter((call) => call.userCreateMany).length, 1);
    assert.equal(calls.filter((call) => call.userFindMany).length, 1);
    assert.equal(calls.filter((call) => call.postCreateMany).length, 1);
    assert.ok(userCreate, 'user.createMany is required');
    assert.ok(userFind, 'user.findMany is required');
    assert.ok(postCreate, 'post.createMany is required');
    const expectedUsers = fixture.users.map(
      ({ posts: _posts, ...user }) => user,
    );
    assert.deepEqual(
      sortRecords(userCreate.userCreateMany),
      sortRecords(expectedUsers),
    );
    assert.deepEqual(userFind.userFindMany, {
      where: {
        email: { in: fixture.users.map(({ email }) => email) },
      },
      select: { id: true, email: true },
    });
    const idsByEmail = new Map(storedUsers.map(({ email, id }) => [email, id]));
    const expectedPosts = fixture.users.flatMap(({ email, posts }) =>
      posts.map((post) => ({ ...post, authorId: idsByEmail.get(email) })),
    );
    assert.deepEqual(
      sortRecords(postCreate.postCreateMany),
      sortRecords(expectedPosts),
    );
  });

  test('04 CRUD', async () => {
    const fixture = readJson(candidates.crud.fixture);
    const { calls, delegate } = createRecordingDelegate([
      'create',
      'findMany',
      'findUnique',
      'update',
      'delete',
    ]);
    const repository = candidates.crud.createUserRepository({ user: delegate });
    const results = [
      await repository.create(fixture.create),
      await repository.findAll(),
      await repository.findById(fixture.id),
      await repository.update(fixture.id, fixture.update),
      await repository.remove(fixture.id),
    ];
    const expectedCalls = [
      { method: 'create', args: { data: fixture.create } },
      { method: 'findMany', args: undefined },
      { method: 'findUnique', args: { where: { id: Number(fixture.id) } } },
      {
        method: 'update',
        args: { where: { id: Number(fixture.id) }, data: fixture.update },
      },
      { method: 'delete', args: { where: { id: Number(fixture.id) } } },
    ];
    assert.deepEqual(calls, expectedCalls);
    assert.deepEqual(results, expectedCalls);
  });

  test('05 관계 쿼리', async () => {
    const users = createRecordingDelegate(['findMany']);
    const posts = createRecordingDelegate(['findMany']);
    const repository = candidates.relations.createRelationRepository({
      user: users.delegate,
      post: posts.delegate,
    });
    const usersResult = await repository.findUsersWithPosts();
    const postsResult = await repository.findPostsWithAuthors();
    assert.equal(users.calls.length, 1);
    assert.equal(posts.calls.length, 1);
    const usersArgs = users.calls[0].args;
    const postsArgs = posts.calls[0].args;
    assert.equal(
      Number(Boolean(usersArgs.include)) + Number(Boolean(usersArgs.select)),
      1,
    );
    assert.equal(
      Number(Boolean(postsArgs.include)) + Number(Boolean(postsArgs.select)),
      1,
    );
    const postsRelation = usersArgs.include?.posts ?? usersArgs.select?.posts;
    assert.ok(
      postsRelation === true ||
        (typeof postsRelation === 'object' &&
          postsRelation !== null &&
          !Array.isArray(postsRelation)),
      'posts relation must use a valid Prisma relation option',
    );
    if (postsRelation !== true) {
      assert.deepEqual(Object.keys(postsRelation), ['select']);
      assert.ok(
        typeof postsRelation.select === 'object' &&
          postsRelation.select !== null &&
          !Array.isArray(postsRelation.select),
      );
      assert.ok(Object.keys(postsRelation.select).length > 0);
      const postFields = new Set([
        'id',
        'title',
        'content',
        'published',
        'authorId',
        'author',
        'createdAt',
        'updatedAt',
      ]);
      assert.ok(
        Object.keys(postsRelation.select).every((field) =>
          postFields.has(field),
        ),
      );
      assert.ok(
        Object.values(postsRelation.select).every((value) => value === true),
      );
    }
    const authorRelation =
      postsArgs.include?.author ?? postsArgs.select?.author;
    assert.ok(authorRelation, 'author relation is required');
    if (authorRelation !== true) {
      assert.deepEqual(Object.keys(authorRelation), ['select']);
      const userFields = new Set([
        'id',
        'email',
        'name',
        'posts',
        'createdAt',
        'updatedAt',
      ]);
      assert.ok(
        Object.keys(authorRelation.select).every((field) =>
          userFields.has(field),
        ),
      );
      assert.ok(
        Object.values(authorRelation.select).every((value) => value === true),
      );
      for (const field of ['id', 'email', 'name']) {
        assert.equal(authorRelation.select[field], true);
      }
    }
    assert.deepEqual(usersResult, { method: 'findMany', args: usersArgs });
    assert.deepEqual(postsResult, { method: 'findMany', args: postsArgs });
  });

  test('06 고급 쿼리', () => {
    const fixture = readJson(candidates.advanced.fixture);
    const query = candidates.advanced.buildPostQuery(fixture.input);
    assert.deepEqual(query, fixture.expected);
    const assertUnfilteredQuery = (actual, { skip, take }) => {
      const { where, ...queryWithoutWhere } = actual;
      assert.ok(
        where === undefined ||
          (typeof where === 'object' &&
            where !== null &&
            !Array.isArray(where) &&
            Object.keys(where).length === 0),
      );
      assert.deepEqual(queryWithoutWhere, {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      });
    };
    assertUnfilteredQuery(candidates.advanced.buildPostQuery({}), {
      skip: 0,
      take: 10,
    });
    assertUnfilteredQuery(
      candidates.advanced.buildPostQuery({ page: '1', limit: '1' }),
      { skip: 0, take: 1 },
    );
    assertUnfilteredQuery(
      candidates.advanced.buildPostQuery({ page: '1', limit: '100' }),
      { skip: 0, take: 100 },
    );
    const custom = candidates.advanced.buildPostQuery({
      published: 'false',
      page: '3',
      limit: '20',
    });
    assert.deepEqual(custom, {
      where: { published: false },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 40,
      take: 20,
    });
    for (const invalid of [
      { page: '0' },
      { page: '-1' },
      { page: '1.5' },
      { page: 'abc' },
      { limit: '0' },
      { limit: '-1' },
      { limit: '1.5' },
      { limit: '101' },
      { limit: 'abc' },
      { published: 'yes' },
    ]) {
      assert.throws(() => candidates.advanced.buildPostQuery(invalid));
    }
  });

  test('07 인증 유틸리티와 미들웨어', async () => {
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
    assert.equal(
      await candidates.auth.comparePassword(
        fixture.password,
        'not-a-bcrypt-hash',
      ),
      false,
    );

    const tokens = candidates.auth.generateTokens(
      fixture.user,
      fixture.secrets,
    );
    assert.equal(
      jwt.decode(tokens.accessToken, { complete: true }).header.alg,
      'HS256',
    );
    assert.equal(
      jwt.decode(tokens.refreshToken, { complete: true }).header.alg,
      'HS256',
    );
    jwt.verify(tokens.accessToken, fixture.secrets.access, {
      algorithms: ['HS256'],
    });
    jwt.verify(tokens.refreshToken, fixture.secrets.refresh, {
      algorithms: ['HS256'],
    });
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
    assert.equal(
      accessPayload.exp - accessPayload.iat,
      fixture.cookie.accessMaxAge / 1000,
    );
    assert.equal(
      refreshPayload.exp - refreshPayload.iat,
      fixture.cookie.refreshMaxAge / 1000,
    );
    const defaultAccessPayload = candidates.auth.verifyToken(
      candidates.auth.generateAccessToken(fixture.user, fixture.secrets.access),
      'access',
      fixture.secrets,
    );
    const defaultRefreshPayload = candidates.auth.verifyToken(
      candidates.auth.generateRefreshToken(
        fixture.user,
        fixture.secrets.refresh,
      ),
      'refresh',
      fixture.secrets,
    );
    assert.equal(
      defaultAccessPayload.exp - defaultAccessPayload.iat,
      fixture.cookie.accessMaxAge / 1000,
    );
    assert.equal(
      defaultRefreshPayload.exp - defaultRefreshPayload.iat,
      fixture.cookie.refreshMaxAge / 1000,
    );
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
    const hs512AccessToken = jwt.sign(
      { userId: fixture.user.id },
      fixture.secrets.access,
      { algorithm: 'HS512', expiresIn: '1h' },
    );
    assert.equal(
      candidates.auth.verifyToken(hs512AccessToken, 'access', fixture.secrets),
      null,
    );
    const hs512RefreshToken = jwt.sign(
      { userId: fixture.user.id },
      fixture.secrets.refresh,
      { algorithm: 'HS512', expiresIn: '2h' },
    );
    assert.equal(
      candidates.auth.verifyToken(
        hs512RefreshToken,
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
    const expiredTokens = {
      accessToken: candidates.auth.generateAccessToken(
        fixture.user,
        fixture.secrets.access,
        -1,
      ),
      refreshToken: candidates.auth.generateRefreshToken(
        fixture.user,
        fixture.secrets.refresh,
        -1,
      ),
    };
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
    const expectedCookieCalls = [
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
    ];
    assert.deepEqual(
      sortRecords(cookieCalls),
      sortRecords(expectedCookieCalls),
    );
    const insecureCookieCalls = [];
    candidates.auth.setAuthCookies(
      {
        cookie(name, value, options) {
          insecureCookieCalls.push({ name, value, options });
        },
      },
      tokens,
      { secure: false },
    );
    assert.deepEqual(
      sortRecords(insecureCookieCalls),
      sortRecords(
        expectedCookieCalls.map((call) => ({
          ...call,
          options: { ...call.options, secure: false },
        })),
      ),
    );

    const databaseUser = { ...fixture.user, name: 'Ada from database' };
    const runAuthentication = ({
      accessToken,
      refreshToken,
      secure = fixture.cookie.secure,
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
        statusCalls: 0,
        jsonCalls: 0,
        status(code) {
          this.statusCalls += 1;
          this.statusCode = code;
          return this;
        },
        json(body) {
          this.jsonCalls += 1;
          this.body = body;
          return this;
        },
        cookie(name, value, options) {
          cookieCalls.push({ name, value, options });
          return this;
        },
      };
      const middleware = candidates.auth.authenticate(fixture.secrets, {
        secure,
        async findUserById(userId) {
          lookups.push(userId);
          return findUserById(userId);
        },
      });
      let nextError;
      const completion = Promise.resolve().then(() =>
        middleware(request, response, (error) => {
          nextCalled = true;
          nextError = error;
        }),
      );
      return {
        request,
        response,
        get nextCalled() {
          return nextCalled;
        },
        get nextError() {
          return nextError;
        },
        cookieCalls,
        lookups,
        completion,
      };
    };

    const authenticated = runAuthentication({
      accessToken: tokens.accessToken,
    });
    await authenticated.completion;
    assert.equal(authenticated.nextCalled, true);
    assert.equal(authenticated.nextError, undefined);
    assert.deepEqual(authenticated.request.user, { id: fixture.user.id });
    assert.deepEqual(authenticated.lookups, []);
    assert.equal(authenticated.cookieCalls.length, 0);

    const assertUnauthorized = async (execution) => {
      let captured;
      await assert.rejects(execution.completion, (error) => {
        captured = error;
        return true;
      });
      assert.ok(captured instanceof candidates.auth.HttpException);
      assert.ok(captured instanceof candidates.auth.UnauthorizedException);
      assert.equal(captured.statusCode, 401);
      assert.equal(typeof captured.message, 'string');
      assert.equal(execution.nextCalled, false);
      assert.equal(execution.response.statusCalls, 0);
      assert.equal(execution.response.jsonCalls, 0);
      assert.equal(execution.response.statusCode, 200);
      assert.equal(execution.response.body, null);
    };

    for (const rejectedToken of [
      undefined,
      tamperedAccess,
      expiredTokens.accessToken,
    ]) {
      await assertUnauthorized(
        runAuthentication({ accessToken: rejectedToken }),
      );
    }

    for (const invalidUserId of [undefined, String(fixture.user.id)]) {
      await assertUnauthorized(
        runAuthentication({
          accessToken: candidates.auth.generateAccessToken(
            { id: invalidUserId },
            fixture.secrets.access,
          ),
        }),
      );
    }

    const databaseError = new Error('Fixture database failure');
    const databaseIsSkipped = runAuthentication({
      accessToken: tokens.accessToken,
      findUserById: async () => {
        throw databaseError;
      },
    });
    await databaseIsSkipped.completion;
    assert.equal(databaseIsSkipped.nextCalled, true);
    assert.deepEqual(databaseIsSkipped.lookups, []);

    const nearExpiry = {
      accessToken: candidates.auth.generateAccessToken(
        fixture.user,
        fixture.secrets.access,
        '4m',
      ),
      refreshToken: candidates.auth.generateRefreshToken(
        fixture.user,
        fixture.secrets.refresh,
        '2h',
      ),
    };
    const withoutRefresh = runAuthentication({
      accessToken: nearExpiry.accessToken,
    });
    await withoutRefresh.completion;
    assert.equal(withoutRefresh.nextCalled, true);
    assert.equal(withoutRefresh.cookieCalls.length, 0);
    assert.deepEqual(withoutRefresh.lookups, []);

    const fixedNow = 1_800_000_000_000;
    const exactFiveMinutes = {
      accessToken: jwt.sign(
        {
          userId: fixture.user.id,
          exp: fixedNow / 1000 + 5 * 60,
        },
        fixture.secrets.access,
        { algorithm: 'HS256', noTimestamp: true },
      ),
      refreshToken: jwt.sign(
        {
          userId: fixture.user.id,
          exp: fixedNow / 1000 + 2 * 60 * 60,
        },
        fixture.secrets.refresh,
        { algorithm: 'HS256', noTimestamp: true },
      ),
    };
    const originalDateNow = Date.now;
    Date.now = () => fixedNow;
    try {
      const atRefreshBoundary = runAuthentication(exactFiveMinutes);
      await atRefreshBoundary.completion;
      assert.equal(atRefreshBoundary.nextCalled, true);
      assert.deepEqual(atRefreshBoundary.lookups, []);
      assert.equal(atRefreshBoundary.cookieCalls.length, 0);
    } finally {
      Date.now = originalDateNow;
    }

    const refreshed = runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: nearExpiry.refreshToken,
    });
    await refreshed.completion;
    assert.equal(refreshed.nextCalled, true);
    assert.equal(refreshed.cookieCalls.length, 2);
    assert.deepEqual(refreshed.lookups, [fixture.user.id]);
    const refreshedCookies = new Map(
      refreshed.cookieCalls.map((call) => [call.name, call]),
    );
    assert.deepEqual([...refreshedCookies.keys()].sort(), [
      'accessToken',
      'refreshToken',
    ]);
    assert.notEqual(
      refreshedCookies.get('accessToken').value,
      nearExpiry.accessToken,
    );
    assert.notEqual(
      refreshedCookies.get('refreshToken').value,
      nearExpiry.refreshToken,
    );
    assert.ok(
      refreshed.cookieCalls.every(
        ({ options }) => options.secure === fixture.cookie.secure,
      ),
    );
    const refreshedAccessPayload = candidates.auth.verifyToken(
      refreshedCookies.get('accessToken').value,
      'access',
      fixture.secrets,
    );
    const refreshedRefreshPayload = candidates.auth.verifyToken(
      refreshedCookies.get('refreshToken').value,
      'refresh',
      fixture.secrets,
    );
    assert.equal(refreshedAccessPayload.userId, fixture.user.id);
    assert.equal(refreshedRefreshPayload.userId, fixture.user.id);
    assert.deepEqual(customClaims(refreshedAccessPayload), ['userId']);
    assert.deepEqual(customClaims(refreshedRefreshPayload), ['userId']);
    assert.equal(
      refreshedAccessPayload.exp - refreshedAccessPayload.iat,
      fixture.cookie.accessMaxAge / 1000,
    );
    assert.equal(
      refreshedRefreshPayload.exp - refreshedRefreshPayload.iat,
      fixture.cookie.refreshMaxAge / 1000,
    );

    const refreshedInsecure = runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: nearExpiry.refreshToken,
      secure: false,
    });
    await refreshedInsecure.completion;
    assert.equal(refreshedInsecure.nextCalled, true);
    assert.equal(refreshedInsecure.cookieCalls.length, 2);
    assert.ok(
      refreshedInsecure.cookieCalls.every(
        ({ options }) => options.secure === false,
      ),
    );
    assert.deepEqual(refreshedInsecure.lookups, [fixture.user.id]);

    for (const invalidRefreshToken of [
      tamperedRefresh,
      expiredTokens.refreshToken,
      hs512RefreshToken,
    ]) {
      const invalidRefresh = runAuthentication({
        accessToken: nearExpiry.accessToken,
        refreshToken: invalidRefreshToken,
      });
      await invalidRefresh.completion;
      assert.equal(invalidRefresh.nextCalled, true);
      assert.equal(invalidRefresh.cookieCalls.length, 0);
      assert.deepEqual(invalidRefresh.lookups, []);
    }

    const missingRefreshUser = runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: nearExpiry.refreshToken,
      findUserById: async () => null,
    });
    await missingRefreshUser.completion;
    assert.equal(missingRefreshUser.nextCalled, true);
    assert.equal(missingRefreshUser.cookieCalls.length, 0);
    assert.deepEqual(missingRefreshUser.lookups, [fixture.user.id]);

    const refreshDatabaseError = new Error('Fixture refresh database failure');
    const unexpectedRefreshDatabaseFailure = runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: nearExpiry.refreshToken,
      findUserById: async () => {
        throw refreshDatabaseError;
      },
    });
    let forwardedRefreshDatabaseError;
    await assert.rejects(
      unexpectedRefreshDatabaseFailure.completion,
      (error) => {
        forwardedRefreshDatabaseError = error;
        return true;
      },
    );
    assert.equal(forwardedRefreshDatabaseError, refreshDatabaseError);
    assert.equal(unexpectedRefreshDatabaseFailure.nextCalled, false);
    assert.equal(unexpectedRefreshDatabaseFailure.response.statusCalls, 0);
    assert.equal(unexpectedRefreshDatabaseFailure.response.jsonCalls, 0);

    const otherUser = { ...fixture.user, id: 2 };
    const otherRefreshToken = candidates.auth.generateRefreshToken(
      otherUser,
      fixture.secrets.refresh,
      '2h',
    );
    const mismatched = runAuthentication({
      accessToken: nearExpiry.accessToken,
      refreshToken: otherRefreshToken,
    });
    await mismatched.completion;
    assert.equal(mismatched.nextCalled, true);
    assert.equal(mismatched.cookieCalls.length, 0);
    assert.deepEqual(mismatched.lookups, []);
  });

  test('08 유효성 검사', () => {
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
    for (const name of ['A', '가']) {
      assert.equal(
        candidates.validation.signupSchema.safeParse({
          ...fixture.validSignup,
          name,
        }).success,
        false,
      );
    }
    for (const requiredField of ['email', 'password']) {
      const missing = { ...fixture.validSignup };
      delete missing[requiredField];
      assert.equal(
        candidates.validation.signupSchema.safeParse(missing).success,
        false,
      );
    }
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
    assert.equal(
      candidates.validation.loginSchema.safeParse({
        ...fixture.validLogin,
        email: 'not-email',
      }).success,
      false,
    );
    for (const requiredField of ['email', 'password']) {
      const missing = { ...fixture.validLogin };
      delete missing[requiredField];
      assert.equal(
        candidates.validation.loginSchema.safeParse(missing).success,
        false,
      );
    }
    for (const invalid of fixture.invalidLogin) {
      assert.equal(
        candidates.validation.loginSchema.safeParse(invalid).success,
        false,
      );
    }
    for (const password of [
      'a'.repeat(15),
      'a'.repeat(72),
      '가'.repeat(24),
      '😀'.repeat(18),
    ]) {
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
    for (const password of ['a'.repeat(73), '가'.repeat(25), '😀'.repeat(19)]) {
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
    for (const password of ['a'.repeat(14), '가'.repeat(14)]) {
      assert.equal(
        candidates.validation.signupSchema.safeParse({
          ...fixture.validSignup,
          password,
        }).success,
        false,
      );
    }
    const signupWithUnknownField = candidates.validation.signupSchema.safeParse(
      {
        ...fixture.validSignup,
        role: 'admin',
      },
    );
    assert.equal(signupWithUnknownField.success, true);
    assert.deepEqual(signupWithUnknownField.data, fixture.validSignup);
    const loginWithUnknownField = candidates.validation.loginSchema.safeParse({
      ...fixture.validLogin,
      role: 'admin',
    });
    assert.equal(loginWithUnknownField.success, true);
    assert.deepEqual(loginWithUnknownField.data, fixture.validLogin);
  });

  test('09 Prisma 오류와 ID 검증', () => {
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
        assert.ok(captured instanceof candidates.errors.HttpException);
        assert.ok(captured instanceof candidates.errors.BadRequestException);
        assert.equal(captured.statusCode, 400);
      }
    }

    for (const expected of fixture.prismaErrors) {
      const prismaError = Object.assign(new Error(`Prisma ${expected.code}`), {
        code: expected.code,
        meta: { internal: 'must not be copied' },
      });
      const mapped = candidates.errors.mapPrismaError(prismaError);
      const ExpectedException = candidates.errors[expected.exception];
      assert.ok(mapped instanceof candidates.errors.HttpException);
      assert.ok(mapped instanceof ExpectedException);
      assert.notEqual(mapped, prismaError);
      assert.equal(mapped.statusCode, expected.statusCode);
    }

    const unknownPrismaError = Object.assign(
      new Error(fixture.unknownError.message),
      {
        code: fixture.unknownError.code,
      },
    );
    assert.equal(
      candidates.errors.mapPrismaError(unknownPrismaError),
      unknownPrismaError,
    );

    const unexpectedError = new Error('Unexpected database failure');
    assert.equal(
      candidates.errors.mapPrismaError(unexpectedError),
      unexpectedError,
    );
  });

  test('10 트랜잭션', async () => {
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
    assert.deepEqual(created, { id: 1, ...fixture.post });
    assert.equal(prisma.state.posts.length, 1);
    assert.deepEqual(prisma.state.comments, [
      { id: 1, ...fixture.comment, postId: created.id },
    ]);
    const beforeFailedCreate = structuredClone(prisma.state);
    await assert.rejects(() =>
      service.createPostWithComment(fixture.post, fixture.failingComment),
    );
    assert.deepEqual(prisma.transactions, ['callback', 'callback']);
    assert.deepEqual(prisma.state, beforeFailedCreate);
  });
}
