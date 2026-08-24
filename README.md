# JavaScript Backend Prisma Practice

`관계형 데이터베이스를 활용한 자바스크립트 서버 만들기` 과정의 Prisma 활용 독립 문제 해결 실습입니다. 10개 문제를 각각 별도 시작 상태에서 연습합니다.

## 첫 정상 상태

프로젝트에 필요한 패키지를 설치한 직후에는 각 문제의 핵심 구현이 `TODO`로 남아 있어 확인 명령이 실패하는 것이 정상입니다. 실패 메시지에서 요구 조건을 확인하고 해당 실습 폴더의 문제 파일만 수정하세요.

`npm install`은 `package.json`에 적힌 패키지를 내려받아 `node_modules` 폴더에
설치합니다.

```bash
npm install
npm run format:check
npm test
```

마지막 `npm test`가 10개 문제의 미완성 조건을 보여 주며 실패하면 정상입니다.

## 독립 진행 방식

각 실습은 다른 실습의 결과에 의존하지 않습니다. 원하는 폴더의 `README.md`를 읽고 안내된 파일을 수정한 다음 해당 명령을 실행하세요. 기본 확인 명령은 새 객체와 주입형 fixture만 사용하므로 개인 데이터베이스나 외부 서비스에 연결하지 않습니다. 작성한 SQL은 별도의 명시적 명령으로 폐기 가능한 로컬 PostgreSQL 데이터베이스에서도 확인할 수 있습니다.

| 실습                     | 문제 폴더                                 | 확인 명령          |
| ------------------------ | ----------------------------------------- | ------------------ |
| 환경 변수 검증           | `src/practices/01-project-config`         | `npm run check:01` |
| Prisma 모델과 관계       | `src/practices/02-prisma-model-relations` | `npm run check:02` |
| 시딩                     | `src/practices/03-seeding`                | `npm run check:03` |
| CRUD                     | `src/practices/04-crud`                   | `npm run check:04` |
| 관계 쿼리                | `src/practices/05-relation-queries`       | `npm run check:05` |
| 고급 쿼리                | `src/practices/06-advanced-queries`       | `npm run check:06` |
| 트랜잭션                 | `src/practices/07-transactions`           | `npm run check:07` |
| 인증 유틸리티와 미들웨어 | `src/practices/08-auth`                   | `npm run check:08` |
| 유효성 검사              | `src/practices/09-validation`             | `npm run check:09` |
| Prisma 오류와 ID 검증    | `src/practices/10-error-refactor`         | `npm run check:10` |

모든 문제 파일은 `npm test`, 모든 정답 계약은 `npm run test:answers`로 확인할 수 있습니다. 정답은 직접 구현을 마친 뒤에만 각 실습 루트의 `answers/`에서 비교하세요. 기본 실행과 문제 테스트는 정답 파일을 불러오지 않습니다.
