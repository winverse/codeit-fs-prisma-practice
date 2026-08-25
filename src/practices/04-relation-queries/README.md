# 관계 쿼리

## 문제와 시작 상태

사용자별 게시글과 작성자를 포함한 게시글 목록을 항목별 반복 조회 없이 구현합니다. 시작 파일에는 반환 객체와 두 메서드 뼈대가 제공되어 있습니다. `TODO 1`부터 `TODO 2`까지 순서대로 구현합니다.

확인 명령은 고정 관계 데이터를 실제 `prisma_practice_blog`에 준비한 뒤 Repository 결과에 `posts`와 `author`가 올바르게 포함되는지 확인합니다.

## 수정 파일

- 수정: `src/relationRepository.js`

`createRelationRepository(prisma)`가 반환하는 객체에서 다음 순서로 메서드를 구현합니다.

1. `findUsersWithPosts()`는 `prisma.user.findMany()`를 한 번 호출해 `posts` 관계를 포함하고, 호출 결과를 반환합니다.
2. `findPostsWithAuthors()`는 `prisma.post.findMany()`를 한 번 호출해 `author` 관계를 포함하고, 호출 결과를 반환합니다.

관계 전체를 포함하는 `include`와 관계 필드를 고르는 중첩 `select` 중 하나를 사용할 수 있습니다. 중첩 `select`를 사용하면 작성자의 `id`, `email`, `name`은 모두 선택합니다.

## 실행 진입점

`npm run check:04`

## 성공·실패 기준

각 목록을 하나의 `findMany()` 호출과 `include` 또는 `select`로 조회하고 실제 DB의 관계 결과를 반환하면 성공합니다. 결과를 반환하지 않거나 사용자·게시글마다 추가 조회하거나 관계 데이터를 함께 조회하지 않으면 실패합니다.
