import { assertSafeSeedTarget, resetBlogData } from './seed-safety.js';

export async function seed(prisma, fixture) {
  assertSafeSeedTarget(
    fixture.databaseUrl,
    fixture.resetConfirmation,
    fixture.databaseName,
    fixture.nodeEnv,
  );
  await resetBlogData(prisma);

  // TODO 1: fixture.users에서 posts를 제외한 사용자 데이터 배열을 만들고,
  // prisma.user.createMany()를 한 번 호출해 User를 생성하세요.

  // TODO 2: fixture에 있는 이메일 목록을 조건으로 prisma.user.findMany()를 한 번 호출해,
  // 방금 생성된 사용자의 id와 email을 조회하세요.

  // TODO 3: 조회한 사용자 배열로 이메일에 대응하는 id를 찾을 수 있게 만드세요.

  // TODO 4: fixture의 모든 게시글에 작성자의 id를 authorId로 추가하고,
  // prisma.post.createMany()를 한 번 호출해 Post를 생성하세요.
}
