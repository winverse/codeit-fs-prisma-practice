# 고급 쿼리

## 문제와 시작 상태

누적 API route 전체를 복제하지 않고, Express query string을 Prisma `findMany()` 호출로 연결하는 독립 Repository 문제입니다. 공개 여부, 최신순 정렬, 페이지네이션을 Prisma query object로 만드는 `buildPostQuery()`와 이를 실제 Prisma delegate에 전달하는 `createPostRepository()`를 구현합니다. 시작 파일에는 정수 변환 helper와 query object·Repository 뼈대가 제공되어 있습니다. `TODO 1`부터 `TODO 9`까지 순서대로 구현합니다.

확인 명령은 공개 여부와 생성 시각이 고정된 게시글을 실제 `prisma_practice_blog`에 준비하고, `post.findMany()`가 반환한 필터·정렬·페이지 결과와 작성자 관계를 확인합니다.

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
9. `createPostRepository(prisma)`의 `findAllPosts(input)`에서 `buildPostQuery(input)`의 결과와 `include: { author: true }`를 `prisma.post.findMany()`에 한 번 전달하고, 호출 결과를 반환합니다.

범위를 벗어나거나 변환할 수 없는 값은 조용히 기본값으로 바꾸지 않고 오류를 던집니다.

## 실행 진입점

`npm run check:06`

## 성공·실패 기준

문자열 page·limit과 published를 올바른 타입으로 변환하고 공개 필터, 안정적인 최신순 정렬, skip/take를 정확히 만든 뒤 Prisma `post.findMany()`에 작성자 관계를 포함해 한 번 전달하면 성공합니다. 실제 DB 결과도 같은 필터·순서·페이지 범위를 만족해야 합니다. 변환할 수 없거나 허용 범위를 벗어난 값, 필터·정렬·페이지네이션 구성 누락, Prisma 호출 누락은 실패합니다. 검색, 전체 개수(`count()`), 페이지 메타데이터는 구현하지 않습니다.
