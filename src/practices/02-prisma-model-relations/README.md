# Prisma 모델과 관계

## 문제와 시작 상태

`prisma-client` generator와 PostgreSQL datasource를 유지하면서 `User`와 `Post` 모델의 1:N 관계, 고유 이메일, 선택 필드, 외래 키, 삭제 동작, 생성·수정 시각을 schema로 작성합니다. 시작 schema에는 generator·datasource와 `TODO 1`부터 `TODO 8`까지의 구현 안내만 있습니다. 다음 순서대로 `prisma/schema.prisma`을 완성하세요.

이 실습의 문제 schema는 프로젝트 실행용 공용 schema와 분리되어 있습니다. `check:02`는 학생이 작성한 문제 schema를 Prisma CLI로 검증하고 해당 schema만으로 Client를 생성한 뒤, 실제 `prisma_practice_blog`에서 User–Post 생성·관계 조회·작성자 삭제 시 cascade까지 확인합니다.

프로젝트 루트의 공용 `prisma/schema.prisma`와 migration은 모든 실습이 같은 전용 DB에서 재실행될 수 있도록 제공되는 기반입니다. 공용 schema의 `Comment` 모델은 뒤의 트랜잭션 실습을 실제 DB에서 확인하기 위한 것이며 이 문제의 수정 대상은 아닙니다.

1. `User` 모델과 자동 증가하는 `Int` 기본 키 `id`를 선언합니다.
2. `User`에 고유한 `email`과 선택적인 `name`을 추가합니다.
3. `User`에 여러 `Post`를 나타내는 양방향 관계 필드를 추가합니다.
4. `User`에 생성 시각과 자동 수정 시각 필드를 추가합니다.
5. `Post` 모델과 자동 증가하는 `Int` 기본 키 `id`, 필수 `title`을 선언합니다.
6. `Post`에 선택적인 `content`와 기본값이 `false`인 `published`를 추가합니다.
7. `Post`에 `authorId` 외래 키와 `User` 관계 필드를 추가하고, 작성자 삭제 시 게시글도 삭제되게 설정합니다.
8. `Post`에 생성 시각과 자동 수정 시각 필드를 추가합니다.

## 수정 파일과 fixture

- 수정: `prisma/schema.prisma`
- 필수 모델·토큰: `fixtures/expected.json`

## 실행 진입점

```bash
npm run check:02
```

작성한 학생 schema 자체는 다음 명령으로 Prisma parser 검증을 실행할 수 있습니다.

```bash
npm run verify:prisma-schema
```

직접 구현을 마친 뒤 정답 schema도 확인하려면 다음 명령을 사용합니다.

```bash
npx prisma validate --schema src/practices/02-prisma-model-relations/answers/prisma/schema.prisma
```

## 성공·실패 기준

두 모델, 선택 필드, 생성·수정 시각, 양방향 관계와 제약이 본문 스키마와 같고 Prisma 검증·Client 생성·실제 관계 및 cascade 확인을 통과하면 성공합니다. 관계 필드 한쪽, FK·UNIQUE·`@updatedAt` 누락이나 schema 구문 오류, 실제 DB 관계 동작 불일치는 실패합니다.
