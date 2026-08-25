/* eslint-disable no-unused-vars, no-unassigned-vars -- TODO 단계가 모두 구현되기 전까지 중간 값을 사용하지 않습니다. */

function parseInteger(value, { defaultValue, min, max = Infinity, name }) {
  // TODO 1: value가 없으면 defaultValue를 반환하세요. 값이 있으면 정수로 변환하고,
  // min 이상 max 이하의 정수가 아니면 name을 사용한 오류를 던지세요.
  throw new Error(`TODO 1: ${name} 정수 검증을 구현하세요.`);
}

export function buildPostQuery(input) {
  // TODO 2: input.page를 page로 변환하세요. 생략 시 1이고, 1 이상의 정수만 허용합니다.
  const page = parseInteger(input.page, {
    defaultValue: 1,
    min: 1,
    name: 'page',
  });

  // TODO 3: input.limit을 limit으로 변환하세요. 생략 시 10이고, 1~100 정수만 허용합니다.
  const limit = parseInteger(input.limit, {
    defaultValue: 10,
    min: 1,
    max: 100,
    name: 'limit',
  });

  // TODO 4: Prisma 필터를 담을 빈 where 객체를 만드세요.
  let where;

  // TODO 5: input.published가 있으면 문자열 "true" 또는 "false"만 boolean으로 변환해
  // where에 추가하고, 다른 값이면 오류를 던지세요.

  return {
    where,
    // TODO 6: createdAt 내림차순 뒤 id 내림차순을 적용하는 orderBy를 추가하세요.
    // TODO 7: page와 limit으로 skip을 계산해 추가하세요.
    // TODO 8: limit을 take로 추가하세요.
  };
}
