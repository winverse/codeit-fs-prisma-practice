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

export function resetBlogData(prisma) {
  return prisma.$transaction([
    prisma.post.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
