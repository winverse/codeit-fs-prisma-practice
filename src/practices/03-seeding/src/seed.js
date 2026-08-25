import { PRACTICE_DATABASE_NAME } from '#db/practice-database.js';

export function assertSafeSeedTarget(
  databaseUrl,
  confirmation,
  databaseName,
  nodeEnv,
) {
  let target;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid URL');
  }
  const actualDatabase = decodeURIComponent(target.pathname.slice(1));
  const postgresProtocol = ['postgresql:', 'postgres:'].includes(
    target.protocol,
  );
  const localHost = ['127.0.0.1', 'localhost', '[::1]'].includes(
    target.hostname,
  );
  const confirmed = confirmation === `--allow-reset=${databaseName}`;

  if (
    nodeEnv !== 'development' ||
    databaseName !== PRACTICE_DATABASE_NAME ||
    !postgresProtocol ||
    !localHost ||
    target.port !== '5432' ||
    target.search !== '' ||
    actualDatabase !== PRACTICE_DATABASE_NAME ||
    !confirmed
  ) {
    throw new Error('Refusing to reset a database outside the practice target');
  }
  return true;
}

async function resetBlogData(prisma) {
  return prisma.$transaction([
    prisma.post.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seed(prisma, fixture) {
  assertSafeSeedTarget(
    fixture.databaseUrl,
    fixture.resetConfirmation,
    fixture.databaseName,
    fixture.nodeEnv,
  );
  await resetBlogData(prisma);

  // TODO 1: fixture.users에서 posts를 제외한 사용자 데이터 배열을 만들고,
  // prisma.user.createMany()를 한 번 호출해 User를 생성하세요.

  // TODO 2: fixture에 있는 이메일 목록을 조건으로 prisma.user.findMany()를 한 번 호출해,
  // 방금 생성된 사용자의 id와 email을 조회하세요.

  // TODO 3: 조회한 사용자 배열로 이메일에 대응하는 id를 찾을 수 있게 만드세요.

  // TODO 4: fixture의 모든 게시글에 작성자의 id를 authorId로 추가하고,
  // prisma.post.createMany()를 한 번 호출해 Post를 생성하세요.
}
