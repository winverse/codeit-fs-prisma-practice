import { flattenError } from 'zod';
import { BadRequestException } from './errors.js';

export function validate(target, schema) {
  if (!['body', 'params', 'query'].includes(target)) {
    throw new Error(`지원하지 않는 검증 대상입니다: ${target}`);
  }

  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const { fieldErrors, formErrors } = flattenError(result.error);
      throw new BadRequestException('Validation failed', {
        details: fieldErrors,
        formErrors,
      });
    }

    req.validated = {
      ...req.validated,
      [target]: result.data,
    };
    return next();
  };
}
