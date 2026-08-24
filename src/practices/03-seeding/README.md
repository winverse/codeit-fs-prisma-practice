# 시딩

## 문제와 시작 상태

Prisma Client와 PostgreSQL용 fixture로 사용자 5명과 각 사용자의 게시글을 관계 순서에 맞게 생성합니다. `NODE_ENV=development`와 삭제 가능한 로컬 데이터베이스인지 확인하는 검사, Post→User 초기화 코드는 제공되어 있습니다. 학생은 이 코드를 변경하지 않고 `User 생성 → ID 조회 → Post.authorId 연결 → Post 생성` 부분을 구현합니다.

- `prisma.user.createMany()`를 한 번 호출해 fixture에서 `posts`를 제외한 사용자 데이터를 생성합니다.
- `prisma.user.findMany()`를 한 번 호출해 fixture의 이메일 목록에 해당하는 사용자의 `id`, `email`을 조회합니다.
- 조회 결과를 이메일 기준으로 fixture 사용자와 연결하고, 해당 ID를 각 게시글의 `authorId`로 사용해 `prisma.post.createMany()`를 한 번 호출합니다.

## 수정 파일과 fixture

- 수정: `src/seed.js`
- 안전한 입력: `fixtures/seed.json`

## 실행 진입점

`npm run check:03`

## 성공·실패 기준

제공된 안전 검사와 Post→User 초기화를 먼저 실행하고, 안내된 세 번의 일괄 쿼리로 사용자 5명과 각 사용자의 게시글을 정확히 만들면 성공합니다. 안전 코드나 초기화를 건너뛰거나, 부모 ID 조회·사용자·게시글 생성이 누락되거나 fixture와 다른 데이터가 전달되면 실패합니다.
