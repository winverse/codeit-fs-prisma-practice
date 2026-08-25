export function createRelationRepository(prisma) {
  return {
    findUsersWithPosts() {
      return prisma.user.findMany({
        include: {
          posts: true,
        },
      });
    },
    findPostsWithAuthors() {
      return prisma.post.findMany({
        select: {
          id: true,
          title: true,
          published: true,
          author: {
            select: { id: true, email: true, name: true },
          },
        },
      });
    },
  };
}
