export function createPostTransactions(prisma) {
  return {
    async createPostWithComment(post, comment) {
      const created = await prisma.post.create({ data: post });
      await prisma.comment.create({ data: { ...comment, postId: created.id } });
      return created;
    },
  };
}
