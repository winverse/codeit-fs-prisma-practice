# 트랜잭션

## 문제와 시작 상태

앞 결과가 뒤 작업에 필요한 게시글+첫 댓글 생성을 callback transaction으로 구현합니다. 시작 코드는 두 생성 작업을 트랜잭션 없이 수행합니다.

확인 명령은 실제 `prisma_practice_blog`에서 정상 게시글·댓글 생성을 확인한 뒤, 존재하지 않는 댓글 작성자 ID로 외래 키 오류를 발생시킵니다. 이때 callback transaction이 앞서 만든 게시글까지 실제로 롤백하는지 전후 행 수를 비교합니다.

## 작업 순서

1. **TODO 1**: 시작 코드의 두 생성 작업을 callback 형태의 `return prisma.$transaction(async (tx) => { ... })`로 감쌉니다. callback이 반환한 Promise를 그대로 반환해야 합니다.
2. **TODO 2**: 감싼 callback 안에서 기존의 루트 `prisma.post.create()`를 `await tx.post.create({ data: post })`로 바꿔 생성된 게시글을 보관합니다. callback 안의 DB 작업에는 루트 `prisma`를 사용하지 않습니다.
3. **TODO 3**: 기존 댓글 생성도 `await tx.comment.create(...)`로 바꾸고, 댓글 데이터에는 `comment`의 필드와 방금 만든 게시글의 `id`를 `postId`로 넣습니다. 첫 작업의 결과가 두 번째 작업에 연결되는 순서를 유지합니다.
4. **TODO 4**: 두 생성 작업이 모두 끝난 뒤 생성한 게시글을 반환합니다. 댓글 생성 오류를 catch해서 성공값으로 바꾸거나 callback 밖에서 실행하지 마세요. 오류가 callback 밖으로 전파되어 `$transaction()`이 앞선 게시글 생성을 롤백해야 합니다.

## 수정 파일과 fixture

- 수정: `src/postTransactions.js`
- 정상·의도적 실패 입력: `fixtures/operations.json`

`createPostTransactions(prisma)`는 다음 메서드를 반환합니다.

- `createPostWithComment(post, comment)`: 게시글을 만든 뒤 그 ID로 첫 댓글을 만들고 생성한 게시글을 반환

## 실행 진입점

`npm run check:10`

## 성공·실패 기준

게시글과 첫 댓글 생성은 callback `$transaction()` 안에서 실행되고, 댓글 생성이 실패하면 실제 DB에서 앞서 만든 게시글도 롤백되어야 합니다. 부분 변경이 남거나 연결 ID가 틀리면 실패합니다.
