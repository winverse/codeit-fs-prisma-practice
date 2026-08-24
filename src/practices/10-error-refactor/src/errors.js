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
  // TODO: 경로 ID를 양의 정수로 검증·변환하고, 실패하면 BadRequestException을 next에 전달하세요.
  return (_req, _res, next) => next();
}

export function mapPrismaError(error) {
  // TODO: P2002와 P2025만 알맞은 HTTP 예외로 변환하고, 그 밖의 오류는 그대로 반환하세요.
  return error;
}
