export function createPostTransactions(prisma) {
  return {
    createPostWithComment(post, comment) {
      return prisma.$transaction(async (tx) => {
        const created = await tx.post.create({ data: post });
        await tx.comment.create({ data: { ...comment, postId: created.id } });
        return created;
      });
    },
    deletePostWithComments(postId) {
      return prisma.$transaction(async (tx) => {
        const { count: deletedCommentsCount } = await tx.comment.deleteMany({
          where: { postId },
        });
        const deletedPost = await tx.post.delete({ where: { id: postId } });
        return { deletedPost, deletedCommentsCount };
      });
    },
  };
}
