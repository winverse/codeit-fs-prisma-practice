# 관계 쿼리

## 문제와 시작 상태

사용자별 게시글과 작성자를 포함한 게시글 목록을 항목별 반복 조회 없이 구현합니다. 시작 함수는 TODO 오류를 던집니다.

## 수정 파일과 fixture

- 수정: `src/relationRepository.js`
- 조회 계약: `fixtures/expected.json`

`createRelationRepository(prisma)`는 다음 메서드가 있는 객체를 반환합니다.

- `findUsersWithPosts()`는 `prisma.user.findMany()` 한 번으로 `posts` 관계를 포함합니다.
- `findPostsWithAuthors()`는 `prisma.post.findMany()` 한 번으로 `author` 관계를 포함합니다.

관계 전체를 포함하는 `include`와 관계 필드를 고르는 중첩 `select` 중 하나를 사용할 수 있습니다. 중첩 `select`를 사용하면 작성자의 `id`, `email`, `name`은 모두 선택합니다.
두 Repository 메서드는 각각의 `findMany()` 호출 결과를 호출한 쪽에 반환합니다.

## 실행 진입점

`npm run check:05`

## 성공·실패 기준

각 목록을 하나의 `findMany()` 호출과 `include` 또는 `select`로 조회하고 그 결과를 반환하면 성공합니다. 결과를 반환하지 않거나 사용자·게시글마다 추가 조회하거나 관계 데이터를 함께 조회하지 않으면 실패합니다.
