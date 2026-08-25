# 고급 쿼리

## 문제와 시작 상태

누적 API route 전체를 복제하지 않고, Express query string을 Prisma `findMany()` 인수로 바꾸는 경계만 축소한 독립 query-builder 문제입니다. 공개 여부, 최신순 정렬, 페이지네이션을 Prisma query object로 만드는 `buildPostQuery()`를 구현합니다. 시작 파일에는 정수 변환 helper와 query object 뼈대가 제공되어 있습니다. `TODO 1`부터 `TODO 8`까지 순서대로 구현합니다.

## 수정 파일과 fixture

- 수정: `src/postQuery.js`
- 대표 query: `fixtures/query.json`

`buildPostQuery(input)`은 Express query string을 다음 규칙으로 Prisma 인수로 바꿉니다.

1. `parseInteger()`에서 값이 없으면 기본값을 반환하고, 값이 있으면 지정 범위의 정수인지 검사합니다. 범위를 벗어나거나 변환할 수 없으면 오류를 던집니다.
2. `page`는 생략 시 1, 1 이상의 정수로 변환합니다.
3. `limit`은 생략 시 10, 1~100의 정수로 변환합니다.
4. Prisma 필터를 담을 빈 `where` 객체를 만듭니다.
5. `published`는 생략할 수 있고, 문자열 `"true"` 또는 `"false"`만 boolean으로 변환해 `where`에 추가합니다. 다른 값이면 오류를 던집니다.
6. `orderBy`에 `createdAt` 내림차순 뒤 고유한 `id` 내림차순 tie-breaker를 추가합니다.
7. `page`와 `limit`으로 `skip`을 계산합니다.
8. `take`에 `limit`을 사용합니다.

범위를 벗어나거나 변환할 수 없는 값은 조용히 기본값으로 바꾸지 않고 오류를 던집니다.

## 실행 진입점

`npm run check:06`

## 성공·실패 기준

문자열 page·limit과 published를 올바른 타입으로 변환하고 공개 필터, 안정적인 최신순 정렬, skip/take를 정확히 만들면 성공합니다. 변환할 수 없거나 허용 범위를 벗어난 값, 필터·정렬·페이지네이션 구성 누락은 실패합니다.
