export function createPostTransactions(prisma) {
  return {
    async createPostWithComment(post, comment) {
      // TODO 1: 아래 두 생성 작업을 return prisma.$transaction(async (tx) => { ... })로 감싸세요.
      // TODO 2: callback 안의 첫 작업은 root prisma 대신 await tx.post.create({ data: post })를 사용하세요.
      const created = await prisma.post.create({ data: post });
      // TODO 3: 두 번째 작업도 await tx.comment.create(...)로 바꾸고 created.id를 postId에 연결하세요.
      await prisma.comment.create({ data: { ...comment, postId: created.id } });
      // TODO 4: callback 안에서 두 작업 뒤에 created를 반환하고, 오류를 catch하지 않아 rollback되게 하세요.
      return created;
    },
  };
}
