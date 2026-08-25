function parseInteger(value, { defaultValue, min, max = Infinity, name }) {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}`);
  }
  return parsed;
}

export function buildPostQuery(input) {
  const page = parseInteger(input.page, {
    defaultValue: 1,
    min: 1,
    name: 'page',
  });
  const limit = parseInteger(input.limit, {
    defaultValue: 10,
    min: 1,
    max: 100,
    name: 'limit',
  });
  const where = {};

  if (input.published !== undefined) {
    if (input.published === 'true' || input.published === true) {
      where.published = true;
    } else if (input.published === 'false' || input.published === false) {
      where.published = false;
    } else {
      throw new TypeError('published must be true or false');
    }
  }

  return {
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function createPostRepository(prisma) {
  return {
    findAllPosts(input) {
      return prisma.post.findMany({
        ...buildPostQuery(input),
        include: { author: true },
      });
    },
  };
}
