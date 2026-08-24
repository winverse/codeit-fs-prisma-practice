import { z } from 'zod';

export const signupSchema = z.object({
  email: z.email('유효한 이메일 형식이 아닙니다.'),
  password: z
    .string({ error: '비밀번호는 필수입니다.' })
    .min(15, '비밀번호는 15자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자 이하여야 합니다.'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.').optional(),
});

export const loginSchema = z.object({
  email: z.email('유효한 이메일 형식이 아닙니다.'),
  password: z
    .string({ error: '비밀번호는 필수입니다.' })
    .min(1, '비밀번호를 입력해주세요.')
    .max(72, '비밀번호는 72자 이하여야 합니다.'),
});
