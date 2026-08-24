# 트랜잭션

## 문제와 시작 상태

앞 결과가 뒤 작업에 필요한 게시글+첫 댓글 생성과, 두 삭제가 모두 완료되어야 하는 게시글+댓글 삭제를 callback transaction으로 구현합니다. 시작 코드는 생성 두 작업을 트랜잭션 없이 수행하고 삭제 기능이 없습니다.

## 수정 파일과 fixture

- 수정: `src/postTransactions.js`
- 정상·의도적 실패 입력: `fixtures/operations.json`

`createPostTransactions(prisma)`는 다음 메서드를 반환합니다.

- `createPostWithComment(post, comment)`: 게시글을 만든 뒤 그 ID로 첫 댓글을 만들고 생성한 게시글을 반환
- `deletePostWithComments(postId)`: `deleteMany()`가 실제 반환한 댓글 수와 삭제한 게시글을 `{ deletedPost, deletedCommentsCount }`로 반환

## 실행 진입점

`npm run check:07`

## 성공·실패 기준

생성+댓글과 삭제+댓글은 callback `$transaction()` 안에서 실행되고 중간 실패 시 fixture 상태가 시작 전으로 롤백되어야 합니다. 부분 변경이 남거나 삭제 순서·연결 ID·삭제 수가 틀리면 실패합니다.
