/* eslint-disable no-unused-vars -- TODO 미들웨어와 오류 매핑을 구현하기 전까지 매개변수를 사용하지 않습니다. */

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
    // TODO 1: req.params[name]을 읽어 Number()로 변환하고 양의 정수인지 판별하세요.
    // TODO 2: 유효하지 않으면 label을 설명에 사용한 BadRequestException을 return next(...)로 전달하세요.
    // TODO 3: 유효하면 변환된 id를 req.params[name]에 저장한 뒤 오류 없이 next()를 호출하세요.
    throw new Error('TODO 1: 경로 ID를 검증하세요.');
  };
}

export function mapPrismaError(error) {
  // TODO 4: error?.code가 P2002이면 새 ConflictException을 반환하세요.
  // TODO 5: P2025이면 새 NotFoundException을 반환하고, 나머지는 입력 error를 그대로 반환하세요.
  throw new Error('TODO 4: Prisma 오류를 매핑하세요.');
}
