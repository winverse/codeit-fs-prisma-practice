// TODO 1: 이 모듈 최상단에 `bcrypt`와 `jsonwebtoken`을 기본 import 하세요.
// 두 패키지는 각각 비밀번호 처리와 JWT 발급·검증에 사용합니다.

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
  // TODO 2: `_password`를 `bcrypt.hash`로 cost 10 해싱하고 생성된 해시를 반환하세요.
  throw new Error('TODO 2: bcrypt hash를 반환하세요.');
}

export async function comparePassword(_password, _hashedPassword) {
  // TODO 3: `_password`와 `_hashedPassword`를 `bcrypt.compare`로 비교하세요.
  // 비교 중 오류가 나면 catch에서 `false`를 반환하고, 그 밖에는 비교 결과를 반환하세요.
  throw new Error('TODO 3: bcrypt compare 결과를 반환하세요.');
}

export function generateAccessToken(_user, _accessSecret, _expiresIn = '15m') {
  // TODO 4: `_user.id`만 `userId` claim으로 넣어 `_accessSecret`으로 서명하세요.
  // `jwt.sign`에 HS256과 `_expiresIn`을 지정하고 Access Token 문자열을 반환하세요.
  throw new Error('TODO 4: HS256 Access Token을 반환하세요.');
}

export function generateRefreshToken(_user, _refreshSecret, _expiresIn = '7d') {
  // TODO 5: `_user.id`만 `userId` claim으로 넣어 `_refreshSecret`으로 서명하세요.
  // `jwt.sign`에 HS256과 `_expiresIn`을 지정하고 Refresh Token 문자열을 반환하세요.
  throw new Error('TODO 5: HS256 Refresh Token을 반환하세요.');
}

export function generateTokens(_user, _secrets) {
  // TODO 6: `_user`와 `_secrets.access`·`_secrets.refresh`를 각각의 발급 함수에 전달하세요.
  // `{ accessToken, refreshToken }` 객체를 반환하고 payload에 다른 사용자 정보는 넣지 마세요.
  throw new Error('TODO 6: Access Token과 Refresh Token을 함께 반환하세요.');
}

export function verifyToken(_token, _tokenType, _secrets) {
  // TODO 7: `_tokenType`이 `access` 또는 `refresh`일 때만 대응하는 비밀 키를 고르세요.
  // `jwt.verify`는 HS256만 허용하고, 종류·서명·만료·형식 오류는 catch에서 `null`을 반환하세요.
  throw new Error('TODO 7: 검증한 payload 또는 null을 반환하세요.');
}

export function setAuthCookies(_res, _tokens, _options) {
  // TODO 8: `_res.cookie`로 `accessToken`과 `refreshToken`을 각각 설정하세요.
  // `_options.secure`(기본값 false)를 보존하고 httpOnly, sameSite=lax, path=/를 적용하세요.
  // 각 token의 15분·7일 만료 시간과 같은 밀리초 `maxAge`를 지정하고 반환값은 필요 없습니다.
  throw new Error('TODO 8: 두 인증 쿠키를 설정하세요.');
}

export function authenticate(_secrets, _options = {}) {
  // TODO 9: `_options.findUserById`가 함수인지 먼저 확인하고, 아니면 즉시 TypeError를 던지세요.
  // TODO 10: 비동기 Express 미들웨어를 반환하세요. `req.cookies`에서 Access Token을 읽어 검증하고,
  // payload의 정수 `userId`가 없으면 UnauthorizedException을 던지며 직접 응답하거나 전체 try/catch로 감싸지 마세요.
  // 유효하면 `req.user`에는 `{ id: userId }`만 저장하세요. 만료까지 5분 미만이고 Refresh Token이 있을 때만
  // Refresh Token의 HS256 검증·동일 userId 확인·`findUserById` 조회를 순서대로 수행하고, 사용자가 있으면
  // `generateTokens`와 `setAuthCookies`로 갱신하세요. Refresh Token 오류·불일치는 갱신만 생략하고,
  // 조회의 예상하지 못한 오류는 그대로 전파한 뒤 정상 흐름에서는 `next()`를 호출하세요.
  throw new Error('TODO 9: 인증 미들웨어의 의존성을 확인하세요.');
}
