# 트랜잭션

## 문제와 시작 상태

앞 결과가 뒤 작업에 필요한 게시글+첫 댓글 생성을 callback transaction으로 구현합니다. 시작 코드는 두 생성 작업을 트랜잭션 없이 수행합니다.

## 수정 파일과 fixture

- 수정: `src/postTransactions.js`
- 정상·의도적 실패 입력: `fixtures/operations.json`

`createPostTransactions(prisma)`는 다음 메서드를 반환합니다.

- `createPostWithComment(post, comment)`: 게시글을 만든 뒤 그 ID로 첫 댓글을 만들고 생성한 게시글을 반환

## 실행 진입점

`npm run check:10`

## 성공·실패 기준

게시글과 첫 댓글 생성은 callback `$transaction()` 안에서 실행되고, 댓글 생성이 실패하면 앞에서 만든 게시글도 롤백되어야 합니다. 부분 변경이 남거나 연결 ID가 틀리면 실패합니다.
