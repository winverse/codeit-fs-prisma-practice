import { assertSafeSeedTarget, resetBlogData } from './seed-safety.js';

export async function seed(prisma, fixture) {
  assertSafeSeedTarget(
    fixture.databaseUrl,
    fixture.resetConfirmation,
    fixture.databaseName,
    fixture.nodeEnv,
  );

  await resetBlogData(prisma);

  const userData = fixture.users.map(({ posts: _posts, ...user }) => user);
  await prisma.user.createMany({ data: userData });
  const users = await prisma.user.findMany({
    where: { email: { in: userData.map(({ email }) => email) } },
    select: { id: true, email: true },
  });
  const idsByEmail = new Map(users.map(({ email, id }) => [email, id]));
  const postData = [];
  for (const user of fixture.users) {
    for (const post of user.posts) {
      postData.push({
        ...post,
        authorId: idsByEmail.get(user.email),
      });
    }
  }
  await prisma.post.createMany({ data: postData });
}
