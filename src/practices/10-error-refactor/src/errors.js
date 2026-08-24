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

export function validateIdParam(_name, _label) {
  return (_req, _res, next) => next();
}

export function mapPrismaError(error) {
  return error;
}
