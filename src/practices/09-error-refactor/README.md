# Prisma 오류와 ID 검증

## 문제와 시작 상태

누적 프로젝트의 route·Repository와 중앙 에러 핸들러를 그대로 복제하지 않고, 입력과 Prisma 오류 경계만 `src/errors.js`의 축소된 독립 유틸리티로 확인합니다. 학생은 전달받은 파라미터를 양의 정수로 검증하는 `validateIdParam()`과 Prisma 오류를 알맞은 HTTP 예외로 바꾸는 `mapPrismaError()`를 완성합니다.

확인 명령은 ID 미들웨어의 순수 계약을 검사한 뒤 실제 `prisma_practice_blog`에서 중복 이메일과 존재하지 않는 ID 오류를 발생시켜 Prisma의 `P2002`·`P2025`가 알맞은 HTTP 예외로 바뀌는지 확인합니다.

`HttpException`, `BadRequestException`, `ConflictException`, `NotFoundException`은 선수 과정에서 완성한 공통 코드로 제공됩니다. 이 예외 클래스를 다시 구현하거나 수정하지 않습니다. 공통 `errorHandler`와 404·500 응답은 이 독립 문제의 구현 범위가 아닙니다.

## 작업 순서

1. **TODO 1**: `validateIdParam(name, label)`이 반환한 미들웨어에서 `req.params[name]`을 읽고 `Number()`로 변환한 결과가 양의 정수인지 판별합니다. `userId`나 `postId`를 코드에 직접 쓰지 말고 전달받은 `name`을 계속 사용합니다.
2. **TODO 2**: `0`, 음수, 소수, 숫자로 바꿀 수 없는 값은 `new BadRequestException(...)`을 만들어 `return next(error)`로 전달합니다. 이 경로에서는 정상 진행을 호출하거나 파라미터를 바꾸지 않습니다.
3. **TODO 3**: 유효한 경우에만 변환된 숫자를 같은 `req.params[name]`에 저장하고, 오류 인수 없이 `next()`를 한 번 호출합니다.
4. **TODO 4**: `mapPrismaError(error)`에서 optional chaining으로 Prisma 오류 코드를 안전하게 확인하고, `P2002`일 때만 입력 오류와 다른 새 `ConflictException`을 반환합니다.
5. **TODO 5**: `P2025`일 때만 새 `NotFoundException`을 반환합니다. 두 코드 이외의 Prisma 오류와 일반 `Error`는 감싸거나 복제하지 말고 받은 `error` 객체를 그대로 반환합니다.

## 수정 파일과 fixture

- 수정: `src/errors.js`
- 정상·오류 ID와 Prisma 오류 코드: `fixtures/ids.json`

## 실행 진입점

`npm run check:09`

## 성공·실패 기준

정상 `userId`와 `postId`는 숫자로 변환되어 다음 미들웨어로 전달되고, 잘못된 값은 `statusCode` 400인 `BadRequestException`으로 전달되면 성공합니다. 함수 내부에 특정 파라미터 이름을 고정하지 않고 인수로 받은 이름을 사용해야 합니다.

`mapPrismaError()`는 실제 Prisma가 전달한 `P2002`를 `ConflictException`(409), `P2025`를 `NotFoundException`(404)으로 바꿔야 합니다. 다른 Prisma 코드와 예상하지 못한 오류는 추측해서 다른 예외로 바꾸지 말고 같은 객체를 그대로 반환해야 합니다.
