/* eslint-disable no-unused-vars -- TODO 메서드를 구현하기 전까지 매개변수를 사용하지 않습니다. */

export function createUserRepository(prisma) {
  return {
    create(data) {
      // TODO 1: prisma.user.create()에 { data }를 전달하고 호출 결과를 반환하세요.
      throw new Error('TODO 1: create()를 구현하세요.');
    },
    findAll() {
      // TODO 2: prisma.user.findMany()를 호출하고 전체 사용자 조회 결과를 반환하세요.
      throw new Error('TODO 2: findAll()을 구현하세요.');
    },
    findById(id) {
      // TODO 3: id를 숫자로 변환해 prisma.user.findUnique()의 where 조건으로 전달하고,
      // 단일 사용자 조회 결과를 반환하세요.
      throw new Error('TODO 3: findById()를 구현하세요.');
    },
    update(id, data) {
      // TODO 4: 숫자로 변환한 id를 where에, 수정할 data를 data에 전달해
      // prisma.user.update()를 호출하고 결과를 반환하세요.
      throw new Error('TODO 4: update()를 구현하세요.');
    },
    remove(id) {
      // TODO 5: id를 숫자로 변환해 prisma.user.delete()의 where 조건으로 전달하고,
      // 삭제 결과를 반환하세요.
      throw new Error('TODO 5: remove()를 구현하세요.');
    },
  };
}
