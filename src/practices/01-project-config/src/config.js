function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1000 || port > 65535) {
    throw new Error('PORT must be an integer between 1000 and 65535');
  }

  return port;
}

function parseDatabaseUrl(value) {
  // TODO: URL 형식과 PostgreSQL 프로토콜을 검증하세요.
  return value?.trim();
}

export function parseConfig(env) {
  return {
    port: parsePort(env.PORT),
    databaseUrl: parseDatabaseUrl(env.DATABASE_URL),
  };
}
