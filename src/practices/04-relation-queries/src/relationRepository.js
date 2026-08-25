/* eslint-disable no-unused-vars -- TODO 메서드를 구현하기 전까지 prisma를 사용하지 않습니다. */

export function createRelationRepository(prisma) {
  return {
    findUsersWithPosts() {
      // TODO 1: prisma.user.findMany()를 한 번 호출해 posts 관계를 함께 조회하고,
      // 그 호출 결과를 반환하세요.
      throw new Error('TODO 1: findUsersWithPosts()를 구현하세요.');
    },
    findPostsWithAuthors() {
      // TODO 2: prisma.post.findMany()를 한 번 호출해 author 관계를 함께 조회하고,
      // 그 호출 결과를 반환하세요. 중첩 select를 사용하면 author의 id, email, name을 모두 선택하세요.
      throw new Error('TODO 2: findPostsWithAuthors()를 구현하세요.');
    },
  };
}
