export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

export class BadRequestError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
  }
}

export function validateIdParam(name, label) {
  return (req, res, next) => {
    const id = Number(req.params[name]);
    if (!Number.isInteger(id) || id < 1) {
      return next(
        new BadRequestError(`${label} ID must be a positive integer`),
      );
    }
    req.params[name] = id;
    return next();
  };
}

export function notFoundHandler(_req, _res, next) {
  return next(new NotFoundError('Not found'));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  const clientStatus = error.status ?? error.statusCode;
  if (
    Number.isInteger(clientStatus) &&
    clientStatus >= 400 &&
    clientStatus < 500
  ) {
    return res.status(clientStatus).json({ message: 'Bad request' });
  }
  return res.status(500).json({ message: 'Internal server error' });
}
