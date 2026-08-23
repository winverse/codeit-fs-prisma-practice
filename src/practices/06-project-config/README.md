# 환경 변수 검증

## 문제와 시작 상태

서버 포트와 PostgreSQL 연결 URL을 환경 객체에서 안전하게 읽는 `parseConfig()`를 구현합니다. 시작 함수는 항상 `null`을 반환합니다.

## 수정 파일과 fixture

- 수정: `src/config.js`
- 정상·오류 환경: `fixtures/environments.json`

## 실행 진입점

`npm run check:06`

## 성공·실패 기준

정상 입력은 포트를 1000~65535 범위의 정수로 변환하고 `DATABASE_URL`에는 `postgresql:` 또는 `postgres:` 프로토콜만 허용하면 성공합니다. secret을 파일에 기록하거나 소수·범위 밖 포트·다른 프로토콜을 허용하면 실패합니다.
