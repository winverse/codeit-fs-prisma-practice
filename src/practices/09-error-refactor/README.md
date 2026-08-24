# Prisma 오류와 ID 검증

## 문제와 시작 상태

누적 프로젝트의 route·Repository와 중앙 에러 핸들러를 그대로 복제하지 않고, 입력과 Prisma 오류 경계만 `src/errors.js`의 축소된 독립 유틸리티로 확인합니다. 학생은 전달받은 파라미터를 양의 정수로 검증하는 `validateIdParam()`과 Prisma 오류를 알맞은 HTTP 예외로 바꾸는 `mapPrismaError()`를 완성합니다.

`HttpException`, `BadRequestException`, `ConflictException`, `NotFoundException`은 선수 과정에서 완성한 공통 코드로 제공됩니다. 이 예외 클래스를 다시 구현하거나 수정하지 않습니다. 공통 `errorHandler`와 404·500 응답은 이 독립 문제의 구현 범위가 아닙니다.

## 수정 파일과 fixture

- 수정: `src/errors.js`
- 정상·오류 ID와 Prisma 오류 코드: `fixtures/ids.json`

## 실행 진입점

`npm run check:09`

## 성공·실패 기준

정상 `userId`와 `postId`는 숫자로 변환되어 다음 미들웨어로 전달되고, 잘못된 값은 `statusCode` 400인 `BadRequestException`으로 전달되면 성공합니다. 함수 내부에 특정 파라미터 이름을 고정하지 않고 인수로 받은 이름을 사용해야 합니다.

`mapPrismaError()`는 `P2002`를 `ConflictException`(409), `P2025`를 `NotFoundException`(404)으로 바꿔야 합니다. 다른 Prisma 코드와 예상하지 못한 오류는 추측해서 다른 예외로 바꾸지 말고 같은 객체를 그대로 반환해야 합니다.
