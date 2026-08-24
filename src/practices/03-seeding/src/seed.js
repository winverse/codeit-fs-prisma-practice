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
    !postgresProtocol ||
    !localHost ||
    actualDatabase !== databaseName ||
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

  // TODO: User를 만든 뒤 ID를 확보하고 Post.authorId에 연결하세요.
}
