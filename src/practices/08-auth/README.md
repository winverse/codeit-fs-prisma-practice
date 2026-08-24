# 인증 유틸리티와 미들웨어

## 문제와 시작 상태

본문과 같은 `bcrypt` 6.0.0과 `jsonwebtoken` 9.0.3으로 인증을 두 단계로 구현합니다. 먼저 비밀번호 해시·비교와 Access Token 검증, DB 사용자 재조회, password가 없는 `req.user`를 완성합니다. 이 흐름이 동작한 뒤 Refresh Token과 두 인증 쿠키, 만료 임박 갱신을 추가합니다. 시작 파일에는 함수 계약과 TODO만 있으며 인증 처리가 완성되지 않아 확인 명령이 실패합니다.

## 수정 파일과 fixture

- 수정: `src/auth.js`
- 안전한 테스트 입력: `fixtures/auth.json`

`authenticate(secrets, options)`는 비동기 Express 미들웨어를 반환합니다. 1단계에서는 `options.findUserById(userId)`로 Access Token의 사용자를 다시 조회하고, 조회한 사용자에서 `password`를 제거해 `req.user`에 저장합니다. Access Token이 없거나 유효하지 않거나 사용자가 없으면 401을 반환합니다.

2단계에서는 Access Token과 Refresh Token의 payload에 `userId`만 넣습니다. `verifyToken()`은 정상 token의 payload를 반환하고, 지원하지 않는 token 종류나 누락·변조·만료된 token에는 오류를 외부로 던지지 않고 `null`을 반환합니다. 유효한 Access Token은 Refresh Token이 없어도 정상 통과합니다. 만료까지 5분 미만이고 Refresh Token도 있을 때만 Refresh Token을 검증하며, 두 token의 `userId`가 같고 사용자를 다시 조회할 수 있을 때 `setAuthCookies()`로 두 token을 갱신합니다. `options.secure`는 갱신 쿠키의 Secure 설정에 전달합니다.

## 실행 진입점

`npm run check:08`

## 성공·실패 기준

성공하려면 bcrypt cost 10 해시와 비교, payload에 `userId`만 담고 서로 다른 키를 쓰는 HS256 Access/Refresh Token, `httpOnly`·`secure`·`sameSite=lax`·`path=/`·각 만료 시간이 적용된 두 쿠키, password 비노출을 모두 만족해야 합니다. 정상 Access Token은 DB에서 다시 조회한 사용자와 함께 `req.user`에 연결되고 쿠키 누락·변조·만료와 없는 사용자는 각각 401로 거부되어야 합니다. 유효한 Access Token에서 Refresh Token이 없으면 갱신만 생략하고, 만료 임박 시에는 정상 서명과 Access/Refresh `userId` 일치를 모두 확인한 경우에만 두 쿠키를 갱신합니다. fixture 값은 실행 계약만 확인하는 공개 테스트 문자열이며 실제 secret으로 사용하지 않습니다.
