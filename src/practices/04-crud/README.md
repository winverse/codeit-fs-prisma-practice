# CRUD

## 문제와 시작 상태

Prisma user delegate를 사용하는 Repository의 생성·전체 조회·단건 조회·수정·삭제를 구현합니다. 시작 함수는 TODO 오류를 던집니다.

## 수정 파일과 fixture

- 수정: `src/userRepository.js`
- 호출 입력: `fixtures/users.json`

`createUserRepository(prisma)`는 다음 메서드가 있는 객체를 반환합니다.

- `create(data)` → `prisma.user.create()`
- `findAll()` → `prisma.user.findMany()`
- `findById(id)` → `prisma.user.findUnique()`
- `update(id, data)` → `prisma.user.update()`
- `remove(id)` → `prisma.user.delete()`

ID를 받는 메서드는 문자열 ID를 숫자로 변환해 `where: { id }`에 전달합니다.
각 Repository 메서드는 Prisma delegate 호출 결과를 호출한 쪽에 반환합니다.

## 실행 진입점

`npm run check:04`

## 성공·실패 기준

각 메서드가 올바른 delegate와 `data`, `where` 인수를 한 번씩 전달하고 그 결과를 반환하면 성공합니다. ID 변환·반환 누락이나 잘못된 Prisma 메서드·인수는 실패합니다.
