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
  const search = input.search?.trim();

  if (search) {
    where.OR = [
      {
        title: { contains: search, mode: 'insensitive' },
      },
      {
        author: {
          is: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  if (input.published !== undefined) {
    if (input.published === 'true' || input.published === true) {
      where.published = true;
    } else if (input.published === 'false' || input.published === false) {
      where.published = false;
    } else {
      throw new TypeError('published must be true or false');
    }
  }

  if (input.authorId !== undefined) {
    where.authorId = parseInteger(input.authorId, {
      min: 1,
      name: 'authorId',
    });
  }

  const sortBy = input.sortBy ?? 'createdAt';
  if (!['createdAt', 'title', 'published'].includes(sortBy)) {
    throw new RangeError('sortBy is not allowed');
  }
  const order = input.order ?? 'desc';
  if (!['asc', 'desc'].includes(order)) {
    throw new RangeError('order is not allowed');
  }

  return {
    where,
    orderBy: [{ [sortBy]: order }, { id: order }],
    skip: (page - 1) * limit,
    take: limit,
  };
}
