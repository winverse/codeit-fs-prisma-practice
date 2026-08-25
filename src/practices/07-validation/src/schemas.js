import { z } from 'zod';

// TODO 1: 이 import 아래에 `node:buffer`의 `Buffer`를 import하세요.
// TODO 2: 비밀번호 문자열을 입력받아 `Buffer.byteLength(password, 'utf8')`가 72 이하인지
// 반환하는 검사 함수 또는 같은 역할의 refine 콜백을 만드세요. 두 schema에서 같은 UTF-8 바이트 기준을 사용합니다.

// TODO 3: email, password, 선택 name을 가진 회원가입 객체 schema로 바꾸세요.
// email에는 Zod 이메일 검사를, password에는 문자열·최소 15자·TODO 2의 72바이트 검사를 적용하세요.
// name은 제공된 경우에만 문자열 최소 2자를 검사하며, 정의되지 않은 필드는 parse 결과에서 제거되어야 합니다.
export const signupSchema = z.object({});

// TODO 4: email과 password를 가진 로그인 객체 schema로 바꾸세요.
// email에는 Zod 이메일 검사를, password에는 문자열·최소 1자·TODO 2의 72바이트 검사를 적용하세요.
// 정의되지 않은 필드는 parse 결과에서 제거되어야 합니다.
export const loginSchema = z.object({});
