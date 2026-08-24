export class HttpException extends Error {
  statusCode;

  constructor(statusCode, description, details = null) {
    super(description);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestException extends HttpException {
  constructor(description = 'BAD_REQUEST', details = null) {
    super(400, description, details);
  }
}

export class ConflictException extends HttpException {
  constructor(description = 'CONFLICT') {
    super(409, description);
  }
}

export class NotFoundException extends HttpException {
  constructor(description = 'NOT_FOUND') {
    super(404, description);
  }
}

export function validateIdParam(name, label) {
  return (req, _res, next) => {
    const id = Number(req.params[name]);
    if (!Number.isInteger(id) || id < 1) {
      return next(
        new BadRequestException(`${label} ID must be a positive integer`),
      );
    }
    req.params[name] = id;
    return next();
  };
}

export function mapPrismaError(error) {
  if (error?.code === 'P2002') {
    return new ConflictException();
  }
  if (error?.code === 'P2025') {
    return new NotFoundException();
  }
  return error;
}
