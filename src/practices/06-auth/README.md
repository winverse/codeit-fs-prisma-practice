# 인증 유틸리티와 미들웨어

## 문제와 시작 상태

본문과 같은 `bcrypt` 6.0.0과 `jsonwebtoken` 9.0.3으로 인증을 두 단계로 구현합니다. 먼저 비밀번호 해시·비교와 Access Token 검증, payload의 `userId`로 만드는 `req.user`를 완성합니다. 이 흐름이 동작한 뒤 Refresh Token과 두 인증 쿠키, 만료 임박 갱신을 추가합니다. 시작 파일에는 인증 함수의 TODO와 함께 선수 과정에서 완성한 `HttpException`·`UnauthorizedException`이 제공됩니다. 공통 예외 기반 코드는 다시 구현하거나 수정하지 않습니다.

이 실습은 Prisma 조회보다 bcrypt·JWT·쿠키와 인증 미들웨어의 요청 경계가 목표입니다. 유효한 Access Token에서 DB를 조회하지 않는 계약도 확인해야 하므로 실제 practice DB 대신 주입형 사용자 조회 함수와 fixture를 사용합니다.

## 수정 파일과 fixture

- 수정: `src/auth.js`
- 안전한 테스트 입력: `fixtures/auth.json`

`authenticate(secrets, options)`는 비동기 Express 5 미들웨어를 반환합니다. 1단계에서는 Access Token을 검증하고 payload의 정수형 `userId`로 `{ id: userId }` 형태의 `req.user`를 만듭니다. 이때는 데이터베이스를 조회하지 않습니다. Access Token이 없거나 유효하지 않거나 만료됐거나 `userId`가 정수가 아니면 `statusCode`가 401인 `UnauthorizedException`을 던집니다. 미들웨어가 직접 401·500 응답을 만들지 않으며, 바깥 전체를 감싼 전달용 `try/catch`도 두지 않습니다.

2단계에서는 Access Token과 Refresh Token의 payload에 `userId`만 넣고 유효기간을 각각 15분과 7일로 설정합니다. 두 쿠키의 이름은 각각 `accessToken`, `refreshToken`을 사용하고, 쿠키의 `maxAge`도 token과 같은 15분과 7일로 맞춥니다. `comparePassword()`의 bcrypt 오류를 `false`로 바꾸는 catch와 `verifyToken()`의 JWT 오류를 `null`로 바꾸는 catch는 각 유틸리티가 정한 의미 있는 경계이므로 유지합니다. 유효한 Access Token은 Refresh Token이 없어도 정상 통과합니다. 만료까지 5분 미만이고 Refresh Token도 있을 때만 Refresh Token을 검증하며, 두 token의 `userId`가 같고 `options.findUserById(userId)`로 사용자를 조회할 수 있을 때 `setAuthCookies()`로 두 token을 갱신합니다. 이때 Refresh Token이 유효하지 않거나 만료됐거나 두 token의 `userId`가 다르면 현재 Access Token의 인증은 유지하고 갱신만 생략합니다. 갱신 중 발생한 예상하지 못한 DB 오류는 원본 그대로 reject되어 공통 에러 핸들러에 도달해야 합니다. `options.secure`는 갱신 쿠키의 Secure 설정에 전달하며 `false`와 `true`를 그대로 보존합니다.

## 작업 순서

1. **TODO 1**: `auth.js`의 모듈 최상단에 `bcrypt`와 `jsonwebtoken`을 기본 import합니다. 이후 TODO에서 각각 해시·비교와 JWT 발급·검증에 사용합니다.
2. **TODO 2**: `hashPassword(password)`에서 `bcrypt.hash`와 cost 10을 사용해 해시 문자열을 반환합니다.
3. **TODO 3**: `comparePassword(password, hashedPassword)`에서 `bcrypt.compare` 결과를 반환하고, 비교 API가 오류를 던질 때만 `false`를 반환합니다.
4. **TODO 4**: `generateAccessToken(user, accessSecret, expiresIn)`에서 `user.id`만 담은 `userId` payload를 HS256으로 서명해 Access Token 문자열을 반환합니다. 기본 만료 시간은 15분입니다.
5. **TODO 5**: `generateRefreshToken(user, refreshSecret, expiresIn)`에서 같은 최소 payload를 HS256으로 서명해 Refresh Token 문자열을 반환합니다. 기본 만료 시간은 7일입니다.
6. **TODO 6**: `generateTokens(user, secrets)`에서 앞의 두 발급 함수를 각각 `secrets.access`, `secrets.refresh`와 함께 호출하고 `{ accessToken, refreshToken }`을 반환합니다.
7. **TODO 7**: `verifyToken(token, tokenType, secrets)`에서 token 종류에 맞는 secret과 HS256만 허용하는 `jwt.verify`를 사용합니다. 지원하지 않는 종류와 모든 JWT 검증 오류는 `null`을 반환합니다.
8. **TODO 8**: `setAuthCookies(res, tokens, options)`에서 두 쿠키를 설정합니다. `secure` 기본값은 false이고, 두 쿠키 모두 `httpOnly`, `sameSite: 'lax'`, `path: '/'`를 사용합니다. Access/Refresh의 `maxAge`는 각각 15분/7일의 밀리초 값입니다.
9. **TODO 9**: `authenticate(secrets, options)`를 만들기 전에 `options.findUserById`가 함수인지 검사하고, 아니면 TypeError를 던집니다.
10. **TODO 10**: 반환한 비동기 미들웨어에서 Access Token을 검증해 정수 `userId`만 `{ id: userId }` 형태로 `req.user`에 저장합니다. Access Token이 없거나 유효하지 않으면 `UnauthorizedException`을 던지고, 직접 응답하거나 전체 try/catch로 전달하지 않습니다. 만료 5분 미만이며 Refresh Token이 있을 때만 두 token의 userId 일치와 사용자 조회를 확인해 두 쿠키를 갱신합니다. Refresh Token 오류·불일치는 갱신만 생략하고, 조회의 예상하지 못한 오류는 그대로 전파한 뒤 정상 흐름에서는 `next()`를 호출합니다.

## 실행 진입점

`npm run check:06`

## 성공·실패 기준

성공하려면 bcrypt cost 10 해시와 비교, payload에 `userId`만 담고 서로 다른 키를 쓰는 HS256 Access/Refresh Token, `httpOnly`·`secure`·`sameSite=lax`·`path=/`·각 만료 시간이 적용된 두 쿠키를 모두 만족해야 합니다. 정상 Access Token은 DB 조회 없이 `{ id: userId }`만 `req.user`에 저장하고 `next()`로 진행합니다. Access Token 누락·변조·만료와 정수가 아닌 `userId`는 401 예외로 거부되어야 합니다. 유효한 Access Token에서 Refresh Token이 없으면 갱신만 생략하고, 만료 임박 시에는 정상 서명과 Access/Refresh `userId` 일치를 모두 확인한 뒤 사용자를 한 번 조회할 수 있을 때만 두 쿠키를 갱신합니다. 갱신 중 예상하지 못한 DB 오류는 응답으로 바꾸거나 새 오류로 감싸지 않고 그대로 reject해야 합니다. 이 구조에서는 삭제되거나 상태가 바뀐 사용자의 기존 Access Token도 만료될 때까지 최대 15분간 유효할 수 있습니다. 즉시 차단이 필요한 서비스라면 별도의 세션 상태나 토큰 버전 검사를 설계해야 합니다. fixture 값은 실행 계약만 확인하는 공개 테스트 문자열이며 실제 secret으로 사용하지 않습니다.
