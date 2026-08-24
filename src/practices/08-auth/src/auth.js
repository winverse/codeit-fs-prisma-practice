export class HttpException extends Error {
  statusCode;

  constructor(statusCode, description, details = null) {
    super(description);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthorizedException extends HttpException {
  constructor(description = 'Unauthorized') {
    super(401, description);
  }
}

export async function hashPassword(_password) {
  // TODO: bcrypt로 비밀번호를 해싱해 반환하세요.
  throw new Error('TODO: bcrypt로 비밀번호를 해싱하세요.');
}

export async function comparePassword(_password, _hashedPassword) {
  // TODO: 입력 비밀번호와 저장된 해시를 비교하고, 비교 오류는 false로 처리하세요.
  return false;
}

export function generateAccessToken(_user, _accessSecret, _expiresIn = '15m') {
  // TODO: 사용자 ID를 담은 HS256 Access Token을 발급하세요.
  return '';
}

export function generateRefreshToken(_user, _refreshSecret, _expiresIn = '7d') {
  // TODO: 사용자 ID를 담은 HS256 Refresh Token을 발급하세요.
  return '';
}

export function generateTokens(_user, _secrets, _expiresIn) {
  // TODO: Access Token과 Refresh Token을 함께 발급해 반환하세요.
  return { accessToken: '', refreshToken: '' };
}

export function verifyToken(_token, _tokenType, _secrets) {
  // TODO: 토큰 종류에 맞는 비밀 키로 HS256 토큰을 검증하고, 실패하면 null을 반환하세요.
  return null;
}

export function setAuthCookies(_res, _tokens, _options) {
  // TODO: Access Token과 Refresh Token을 보안 옵션 및 만료 시간과 함께 쿠키로 설정하세요.
}

export function authenticate(_secrets, _options = {}) {
  // TODO: Access Token 검증, 사용자 재조회, 공개 사용자 저장, 만료 임박 토큰 갱신을 수행하는 미들웨어를 반환하세요.
  return (_req, _res, next) => next();
}

export function toPublicUser(user) {
  // TODO: 원본 사용자를 변경하지 않고 password를 제외한 사용자 객체를 반환하세요.
  return user;
}
