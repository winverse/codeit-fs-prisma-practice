# 환경 변수 검증

## 문제와 시작 상태

20과정에서 완성한 `PORT` 숫자 변환과 1000~65535 범위 검증은 선수 코드인 `parsePort()`로 제공됩니다. 이 함수는 수정하지 않고, 환경 객체의 `DATABASE_URL`을 안전하게 읽는 `parseDatabaseUrl()`만 완성합니다. 시작 함수는 값의 앞뒤 공백만 제거하고 URL 형식과 프로토콜을 아직 검증하지 않습니다.

## 수정 파일과 fixture

- 수정: `src/config.js`
- 정상·오류 환경: `fixtures/environments.json`

## 실행 진입점

`npm run check:01`

## 성공·실패 기준

`DATABASE_URL`이 올바른 URL이면서 `postgresql:` 또는 `postgres:` 프로토콜을 사용할 때만 앞뒤 공백을 제거한 값을 반환하면 성공합니다. 누락된 값, 잘못된 URL, 다른 프로토콜은 오류로 거부해야 합니다. 제공된 `parsePort()`의 정수 변환과 범위 검증도 그대로 유지되어야 하며, 실제 연결 secret을 파일에 기록하면 실패합니다.
