# 시딩

## 문제와 시작 상태

Prisma Client와 PostgreSQL용 fixture로 사용자 5명과 각 사용자의 게시글을 관계 순서에 맞게 생성합니다. `NODE_ENV=development`와 삭제 가능한 로컬 데이터베이스인지 확인하는 검사, Post→User 초기화 코드는 제공되어 있습니다. 학생은 이 코드를 변경하지 않고 문제 파일의 `TODO 1`부터 `TODO 4`까지 순서대로 구현합니다.

확인 명령은 주입형 호출 계약을 먼저 검사한 뒤 공용 Prisma Client로 실제 `prisma_practice_blog`를 초기화하고 `seed()`를 실행합니다.

1. fixture의 각 사용자에서 `posts`를 제외한 사용자 데이터 배열을 만들고, `prisma.user.createMany()`를 한 번 호출합니다.
2. fixture의 이메일 목록을 조건으로 `prisma.user.findMany()`를 한 번 호출해 생성된 사용자의 `id`와 `email`을 조회합니다.
3. 조회한 사용자 배열로 이메일에 대응하는 `id`를 찾을 수 있게 만듭니다.
4. fixture의 모든 게시글에 작성자의 `id`를 `authorId`로 추가하고, `prisma.post.createMany()`를 한 번 호출합니다.

## 수정 파일과 fixture

- 수정: `src/seed.js`
- 안전한 입력: `fixtures/seed.json`

## 실행 진입점

`npm run check:03`

## 성공·실패 기준

제공된 안전 검사와 Post→User 초기화를 먼저 실행하고, 안내된 세 번의 일괄 쿼리로 실제 DB에 사용자 5명과 각 사용자의 게시글을 정확히 만들면 성공합니다. 안전 코드나 초기화를 건너뛰거나, 부모 ID 조회·사용자·게시글 생성이 누락되거나 fixture와 다른 데이터가 전달되면 실패합니다.
