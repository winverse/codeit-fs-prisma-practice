# SQL 기본 사용법

## 문제와 시작 상태

쇼핑몰의 고객, 상품, 구매 내역을 저장하고 조회하는 PostgreSQL SQL을 완성합니다. `task.sql`에는 TODO만 있으며 아직 테이블과 행이 없어 확인 명령이 실패합니다.

## 수정 파일과 fixture

- 수정: `task.sql`
- 입력·기대값: `fixtures/expected.json`

## 실행 진입점

기본 구조 확인은 외부 데이터베이스 없이 실행합니다.

```bash
npm run check:01
```

답안을 PostgreSQL에서 동적으로 확인할 때는 보존할 데이터가 없는 로컬 전용 데이터베이스를 따로 만들고 이름을 `codeit_prisma_practice_`로 시작합니다. 다음 값은 형식 예시이며 실제 비밀번호를 파일에 기록하지 않습니다. 사용하는 터미널에 맞는 명령 하나만 실행합니다.

**Bash/zsh:**

```bash
PRACTICE_DATABASE_URL='postgresql://<local-user>:<local-password>@127.0.0.1:5432/codeit_prisma_practice_local' npm run verify:postgres
```

**Windows PowerShell:**

```powershell
$env:PRACTICE_DATABASE_URL = "postgresql://<local-user>:<local-password>@127.0.0.1:5432/codeit_prisma_practice_local"
npm run verify:postgres
Remove-Item Env:PRACTICE_DATABASE_URL
```

**Windows Command Prompt:**

```batch
set "PRACTICE_DATABASE_URL=postgresql://<local-user>:<local-password>@127.0.0.1:5432/codeit_prisma_practice_local"
npm run verify:postgres
set "PRACTICE_DATABASE_URL="
```

검증기는 `postgresql:` 또는 `postgres:` URL, 로컬 host, 데이터베이스 이름 접두사를 모두 확인합니다. 이 실습에 필요한 `CREATE TABLE`, `INSERT INTO`, `SELECT` 문만 허용하고, 고유 schema와 하나의 transaction 안에서 `task.sql`을 실행합니다. 실행 전후의 transaction이 같은지 확인한 뒤 전체를 롤백하고, 종료 경로에서도 전용 schema를 제거합니다. 조건이 하나라도 다르면 SQL을 실행하지 않습니다. 직접 구현을 마친 뒤 정답도 같은 조건에서 확인하려면 명령 끝에 `-- src/practices/01-sql-basics/answers/task.sql`을 추가합니다.

## 성공·실패 기준

성공하려면 PostgreSQL의 quoted identifier와 `SERIAL` 문법으로 세 테이블, PK·FK·UNIQUE 제약, `Customers.email`의 `VARCHAR(255)`, `Purchases.quantity`의 `DEFAULT 1`, 제공된 행을 작성해야 합니다. 조회문은 전체 `Products`, `price`가 fixture의 `minimumPrice` 이상인 `Products`, `customerId`가 fixture 값과 같은 `Purchases`를 각각 조회합니다. `SELECT *` 또는 필요한 컬럼 목록을 사용할 수 있습니다. 동적 검증에서는 실제 PostgreSQL의 테이블·제약·조회 결과가 기대값과 같아야 합니다. SQLite 전용 구문, 테이블·PK·FK·UNIQUE·행·조회 누락, PostgreSQL 실행 오류는 실패합니다.
