# 유효성 검사

## 문제와 시작 상태

회원가입과 로그인 요청을 검증하는 Zod schema를 작성하고, 앞에서 배운 `validate()` 미들웨어와 함께 실제 Express Route에 연결합니다. 시작 `schemas.js`에는 Zod import가 제공되고 schema는 어떤 객체든 허용합니다. `auth.routes.js`에는 검증된 요청에서 비밀번호를 제외한 안전한 응답을 만드는 handler가 제공되며, 아직 Route는 등록되어 있지 않습니다.

회원가입 비밀번호는 15자 이상이어야 하고, 로그인 비밀번호는 빈 문자열이 아니어야 합니다. 두 비밀번호 모두 Node.js의 `Buffer.byteLength(password, 'utf8')`가 72 이하여야 합니다. 회원가입 이름은 선택 항목이며, 값이 있으면 2자 이상이어야 합니다.

제공된 `validation.middleware.js`는 선택한 요청 영역을 schema로 검사하고, 성공한 결과를 `req.validated`에 저장합니다. 실패하면 starter와 같은 `HttpException` 계열 오류를 던지고 제공된 중앙 `errorHandler`가 400 응답을 만듭니다. 확인 명령은 입력 fixture의 모든 경계를 검사한 뒤 임시 Express 서버에서 `POST /api/auth/signup`과 `POST /api/auth/login`을 실제로 요청합니다. DB·쿠키·인증 서비스는 다시 구현하지 않습니다.

## 수정 파일과 fixture

- 수정 1: `src/schemas.js`
- 수정 2: `src/auth.routes.js`
- 제공되는 미들웨어: `src/validation.middleware.js`
- 제공되는 중앙 오류 처리: `src/errors.js`, `src/error-handler.middleware.js`
- 정상·오류 요청: `fixtures/cases.json`

## 작업 순서

1. **TODO 1**: `schemas.js`의 Zod import 아래에 Node.js의 `node:buffer`에서 `Buffer`를 import합니다. 비밀번호의 글자 수가 아니라 UTF-8 바이트 수를 검사할 때 사용합니다.
2. **TODO 2**: 비밀번호 문자열을 입력받아 `Buffer.byteLength(password, 'utf8')`가 72 이하인지 boolean으로 반환하는 함수 또는 `refine` 콜백을 작성합니다. 회원가입과 로그인에서 같은 기준을 재사용합니다.
3. **TODO 3**: 회원가입 schema에 `email`, `password`, 선택 `name`을 정의합니다. 이메일은 Zod 이메일 검사, 비밀번호는 문자열·최소 15자·TODO 2의 바이트 검사를 적용합니다. 이름은 값이 제공됐을 때만 문자열 최소 2자를 검사합니다. 알 수 없는 필드는 parse 결과에서 제거되도록 객체 schema 기본 동작을 유지합니다.
4. **TODO 4**: 로그인 schema에 `email`, `password`를 정의합니다. 이메일은 Zod 이메일 검사, 비밀번호는 문자열·최소 1자·TODO 2의 바이트 검사를 적용합니다. 이 schema도 알 수 없는 필드를 parse 결과에서 제거해야 합니다.
5. **TODO 5**: `auth.routes.js`에서 `validate`와 두 schema를 가져옵니다.
6. **TODO 6**: `POST /signup`에 `validate('body', signupSchema)`와 제공된 `respondWithValidatedBody(201)` handler를 순서대로 등록합니다.
7. **TODO 7**: `POST /login`에 `validate('body', loginSchema)`와 제공된 `respondWithValidatedBody(200)` handler를 순서대로 등록합니다.

## 실행 진입점

`npm run check:07`

## 성공·실패 기준

정상 요청과 이름이 없는 회원가입 요청은 통과하고 스키마에 정의되지 않은 필드는 검증 결과에서 제거되어야 합니다. 이메일 형식, 15자 미만인 회원가입 비밀번호, UTF-8 기준 72바이트를 초과하는 회원가입·로그인 비밀번호, 제공됐지만 2자 미만인 이름, 빈 로그인 비밀번호를 거부하면 성공합니다.

실제 HTTP 확인에서는 회원가입 Route가 201, 로그인 Route가 200을 반환해야 합니다. 두 Route는 `req.body`를 직접 사용하지 않고 `validate()`가 만든 `req.validated.body`를 handler에 전달해야 하며, 잘못된 요청은 중앙 오류 처리 흐름에서 400을 반환해야 합니다. 성공 응답에는 비밀번호와 알 수 없는 필드가 포함되지 않아야 합니다. 오류 요청 하나라도 통과하거나 Route가 schema 없이 handler를 실행하면 실패합니다.
