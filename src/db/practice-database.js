export const PRACTICE_DATABASE_NAME = 'prisma_practice_blog';
export const PRACTICE_RESET_CONFIRMATION = `--allow-reset=${PRACTICE_DATABASE_NAME}`;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const POSTGRES_PROTOCOLS = new Set(['postgresql:', 'postgres:']);

export function assertSafePracticeDatabase(
  databaseUrl = process.env.DATABASE_URL,
  nodeEnv = process.env.NODE_ENV,
) {
  let target;

  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error('유효한 practice DATABASE_URL이 필요합니다.');
  }

  const databaseName = decodeURIComponent(target.pathname.slice(1));
  const safe =
    nodeEnv === 'development' &&
    POSTGRES_PROTOCOLS.has(target.protocol) &&
    LOCAL_HOSTS.has(target.hostname) &&
    target.port === '5432' &&
    target.search === '' &&
    databaseName === PRACTICE_DATABASE_NAME;

  if (!safe) {
    throw new Error(
      '로컬 5432 포트의 prisma_practice_blog 데이터베이스만 practice에서 사용할 수 있습니다.',
    );
  }

  return target;
}

export async function resetPracticeDatabase(prisma, confirmation) {
  assertSafePracticeDatabase();

  if (confirmation !== PRACTICE_RESET_CONFIRMATION) {
    throw new Error(`${PRACTICE_RESET_CONFIRMATION} 확인 값이 필요합니다.`);
  }

  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}
