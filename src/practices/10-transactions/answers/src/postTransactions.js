export function createPostTransactions(prisma) {
  return {
    createPostWithComment(post, comment) {
      return prisma.$transaction(async (tx) => {
        const created = await tx.post.create({ data: post });
        await tx.comment.create({ data: { ...comment, postId: created.id } });
        return created;
      });
    },
  };
}
