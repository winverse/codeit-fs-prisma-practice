# JavaScript Backend Prisma Practice

`관계형 데이터베이스를 활용한 자바스크립트 서버 만들기` 과정의 Prisma 문제 해결 실습입니다. 한 번 준비한 전용 PostgreSQL 데이터베이스 `prisma_practice_blog`와 공용 Prisma Client를 바탕으로 9개 문제를 연습합니다.

DB를 사용하는 실습은 실행할 때마다 `Comment → Post → User` 순서로 practice 데이터만 초기화합니다. 따라서 같은 데이터베이스를 공유하지만 다른 실습의 이전 실행 결과에는 의존하지 않습니다. 인증 유틸리티와 Zod 유효성 검사는 데이터베이스보다 요청 경계가 학습 목표이므로 독립 fixture로 확인합니다.

## 처음 한 번 준비하기

의존성을 설치합니다.

```bash
npm install
```

`env/.env.example`을 복사해 Git이 추적하지 않는 `env/.env.development`를 만듭니다.

```bash
# macOS/Linux
cp env/.env.example env/.env.development

# Windows PowerShell
Copy-Item env/.env.example env/.env.development
```

`env/.env.development`의 `<username>`과 `<password>`를 실제 로컬 PostgreSQL 계정 값으로 바꿉니다. 비밀번호가 없는 Postgres.app 기본 서버는 비밀번호 부분을 생략할 수 있습니다. 데이터베이스 이름은 안전 검사를 위해 반드시 `prisma_practice_blog`로 유지합니다.

다음 명령은 로컬 `prisma_practice_blog`가 없으면 생성하고, 제공된 migration을 적용한 뒤 Prisma Client를 생성합니다.

```bash
npm run db:setup
```

현재 PostgreSQL 계정에 데이터베이스 생성 권한이 없으면 SQL Shell이나 `psql`에서 `CREATE DATABASE prisma_practice_blog;`를 먼저 실행한 뒤 `npm run db:setup`을 다시 실행합니다. 실제 계정 정보가 들어 있는 `env/.env.development`는 Git에 추가하지 않습니다.

## 첫 정상 상태

준비가 끝나면 `prisma_practice_blog`에 `User`, `Post`, `Comment` 테이블이 있고 `generated/prisma`에 Client가 생성됩니다. 문제 파일에는 아직 `TODO`가 있으므로 다음 전체 확인은 9개 미완성 문제를 보여 주며 실패하는 것이 정상입니다.

```bash
npm run format:check
npm test
```

## 독립 진행 방식

각 실습 폴더의 `README.md`를 읽고 문제 파일의 `TODO 1`부터 순서대로 구현한 다음 `check:NN` 명령을 실행합니다. Prisma 관련 실습은 schema·Client 생성 또는 delegate 호출 인수와 실제 `prisma_practice_blog`의 데이터 결과를 함께 확인합니다. 각 DB 확인은 고정된 reset 확인 값을 내부에서 전달하고 시작과 종료 때 practice 데이터를 초기화하므로 ID가 특정 숫자라고 가정하지 않습니다.

확인 명령은 정답 파일과 코드를 글자 단위로 비교하지 않습니다. 변수명, 보조 함수, 작성 순서가 달라도 각 실습 README의 핵심 입력·출력과 데이터 관계를 만족하면 통과합니다.

| 실습                     | 문제 폴더                                 | 확인 방식                   | 확인 명령          |
| ------------------------ | ----------------------------------------- | --------------------------- | ------------------ |
| Prisma 모델과 관계       | `src/practices/02-prisma-model-relations` | schema·Client·실제 관계 DB  | `npm run check:02` |
| 시딩                     | `src/practices/03-seeding`                | 실제 Prisma DB              | `npm run check:03` |
| CRUD                     | `src/practices/04-crud`                   | 실제 Prisma DB              | `npm run check:04` |
| 관계 쿼리                | `src/practices/05-relation-queries`       | 실제 Prisma DB              | `npm run check:05` |
| 고급 쿼리                | `src/practices/06-advanced-queries`       | 실제 Prisma DB              | `npm run check:06` |
| 인증 유틸리티와 미들웨어 | `src/practices/07-auth`                   | bcrypt·JWT·미들웨어 fixture | `npm run check:07` |
| 유효성 검사              | `src/practices/08-validation`             | Zod fixture                 | `npm run check:08` |
| Prisma 오류와 ID 검증    | `src/practices/09-error-refactor`         | 실제 Prisma 오류+미들웨어   | `npm run check:09` |
| 트랜잭션                 | `src/practices/10-transactions`           | 실제 Prisma DB rollback     | `npm run check:10` |

모든 문제 파일과 실제 DB 결과는 `npm test`, 모든 정답 계약은 `npm run test:answers`로 확인할 수 있습니다. 정답은 직접 구현을 마친 뒤에만 각 실습 루트의 `answers/`에서 비교하세요. 문제 확인은 정답 파일을 불러오지 않습니다.

practice 데이터를 수동으로 비우려면 정확한 확인 인자를 함께 사용합니다.

```bash
npm run db:reset -- --allow-reset=prisma_practice_blog
```

이 명령과 DB 실습 확인은 `NODE_ENV=development`, 로컬 호스트, 정확한 데이터베이스 이름을 모두 검사합니다. 다른 데이터베이스나 원격 데이터베이스는 초기화하지 않습니다.
