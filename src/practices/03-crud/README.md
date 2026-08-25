# CRUD

## 문제와 시작 상태

Prisma user delegate를 사용하는 Repository의 생성·전체 조회·단건 조회·수정·삭제를 구현합니다. 문제 파일에는 반환 객체와 다섯 메서드의 뼈대가 제공되어 있습니다. `TODO 1`부터 `TODO 5`까지 순서대로 각 메서드의 Prisma 호출을 완성합니다.

확인 명령은 delegate 인수를 검사한 뒤 실제 `prisma_practice_blog`에서 사용자를 생성·조회·수정·삭제하고 마지막 데이터 상태까지 확인합니다.

## 수정 파일과 fixture

- 수정: `src/userRepository.js`
- 호출 입력: `fixtures/users.json`

`createUserRepository(prisma)`가 반환하는 객체에서 다음 메서드를 구현합니다.

1. `create(data)`는 `prisma.user.create()`에 `{ data }`를 전달하고 결과를 반환합니다.
2. `findAll()`은 `prisma.user.findMany()`로 전체 사용자를 조회하고 결과를 반환합니다.
3. `findById(id)`는 ID를 숫자로 변환해 `prisma.user.findUnique()`의 `where`에 전달하고 결과를 반환합니다.
4. `update(id, data)`는 숫자로 변환한 ID를 `where`에, 수정할 값을 `data`에 전달해 `prisma.user.update()`를 호출하고 결과를 반환합니다.
5. `remove(id)`는 ID를 숫자로 변환해 `prisma.user.delete()`의 `where`에 전달하고 결과를 반환합니다.

fixture의 ID는 문자열 `"7"`입니다. 따라서 ID를 받는 세 메서드가 `where: { id: 7 }`처럼 숫자로 변환해 전달하는지도 함께 확인합니다.

## 실행 진입점

`npm run check:03`

## 성공·실패 기준

각 메서드가 올바른 delegate와 `data`, `where` 인수를 한 번씩 전달하고 실제 DB의 생성·조회·수정·삭제 결과를 반환하면 성공합니다. ID 변환·반환 누락이나 잘못된 Prisma 메서드·인수, 삭제 뒤 데이터가 남는 경우는 실패합니다.
