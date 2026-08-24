import { z } from 'zod';

const databaseUrlSchema = z
  .url()
  .refine(
    (url) => url.startsWith('postgresql:') || url.startsWith('postgres:'),
    'DATABASE_URL must use postgresql: or postgres:',
  );

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1000 || port > 65535) {
    throw new Error('PORT must be an integer between 1000 and 65535');
  }

  return port;
}

function parseDatabaseUrl(value) {
  const databaseUrl = value?.trim();
  databaseUrlSchema.parse(databaseUrl);

  return databaseUrl;
}

export function parseConfig(env) {
  return {
    port: parsePort(env.PORT),
    databaseUrl: parseDatabaseUrl(env.DATABASE_URL),
  };
}
