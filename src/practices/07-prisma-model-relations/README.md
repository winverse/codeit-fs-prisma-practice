# Prisma 모델과 관계

## 문제와 시작 상태

`prisma-client` generator와 PostgreSQL datasource를 유지하면서 `User`와 `Post` 모델의 1:N 관계, 고유 이메일, 선택 필드, 외래 키, 삭제 동작, 생성·수정 시각을 schema로 작성합니다. 시작 schema에는 generator와 datasource만 있습니다.

## 수정 파일과 fixture

- 수정: `prisma/schema.prisma`
- 필수 모델·토큰: `fixtures/expected.json`

## 실행 진입점

```bash
npm run check:07
```

작성한 학생 schema 자체는 다음 명령으로 Prisma parser 검증을 실행할 수 있습니다.

```bash
npm run verify:prisma-schema
```

직접 구현을 마친 뒤 정답 schema도 확인하려면 다음 명령을 사용합니다.

```bash
npx prisma validate --schema src/practices/07-prisma-model-relations/answers/prisma/schema.prisma
```

## 성공·실패 기준

두 모델, 선택 필드, 생성·수정 시각, 양방향 관계와 제약이 본문 스키마와 같고 Prisma 검증을 통과하면 성공합니다. 관계 필드 한쪽, FK·UNIQUE·`@updatedAt` 누락이나 schema 구문 오류는 실패합니다.
