# 시딩

## 문제와 시작 상태

Prisma Client와 PostgreSQL용 fixture로 사용자 5명과 각 사용자의 게시글을 관계 순서에 맞게 생성합니다. `NODE_ENV=development`와 삭제 가능한 로컬 데이터베이스인지 확인하는 검사, Post→User 초기화 코드는 제공되어 있습니다. 학생은 이 코드를 변경하지 않고 `User 생성 → ID 조회 → Post.authorId 연결 → Post 생성` 부분을 구현합니다.

## 수정 파일과 fixture

- 수정: `src/seed.js`
- 안전한 입력: `fixtures/seed.json`

## 실행 진입점

`npm run check:03`

## 성공·실패 기준

제공된 안전 검사와 Post→User 초기화를 먼저 실행하고, 사용자 5명을 생성한 뒤 조회한 ID로 각 사용자의 게시글을 만들면 성공합니다. 안전 코드나 초기화를 건너뛰고 부모 ID 조회, 사용자 또는 게시글 생성이 누락되면 실패합니다.
