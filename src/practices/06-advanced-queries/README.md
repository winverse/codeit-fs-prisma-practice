# 고급 쿼리

## 문제와 시작 상태

누적 API route 전체를 복제하지 않고, Express query string을 Prisma `findMany()` 인수로 바꾸는 경계만 축소한 독립 query-builder 문제입니다. 공개 여부, 최신순 정렬, 페이지네이션을 Prisma query object로 만드는 `buildPostQuery()`를 구현합니다. 시작 함수는 빈 객체를 반환합니다.

## 수정 파일과 fixture

- 수정: `src/postQuery.js`
- 대표 query: `fixtures/query.json`

`buildPostQuery(input)`은 Express query string을 다음 규칙으로 Prisma 인수로 바꿉니다.

- `page`: 생략 시 1, 1 이상의 정수
- `limit`: 생략 시 10, 1~100의 정수
- `published`: 생략 가능, 문자열 `"true"` 또는 `"false"`만 boolean으로 변환
- `authorId`: 생략 가능, 1 이상의 정수로 변환
- `sortBy`: 생략 시 `createdAt`, 허용값은 `createdAt`, `title`, `published`
- `order`: 생략 시 `desc`, 허용값은 `asc`, `desc`
- 정렬: 선택한 필드 뒤에 고유한 `id`를 같은 방향의 tie-breaker로 추가

범위를 벗어나거나 변환할 수 없는 값은 조용히 기본값으로 바꾸지 않고 오류를 던집니다.

## 실행 진입점

`npm run check:06`

## 성공·실패 기준

문자열 page·limit·authorId와 published를 올바른 타입으로 변환하고 공개·작성자 필터, 안정적인 정렬, skip/take를 정확히 만들면 성공합니다. 변환할 수 없거나 허용 범위를 벗어난 값, 필터·정렬·페이지네이션 구성 누락은 실패합니다.
