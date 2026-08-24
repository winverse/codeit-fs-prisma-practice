import { Buffer } from 'node:buffer';
import { z } from 'zod';

const MIN_PASSWORD_CHARACTERS = 15;
const MAX_BCRYPT_PASSWORD_BYTES = 72;
const hasEnoughPasswordCharacters = (password) =>
  [...password].length >= MIN_PASSWORD_CHARACTERS;
const fitsBcryptPasswordLimit = (password) =>
  Buffer.byteLength(password, 'utf8') <= MAX_BCRYPT_PASSWORD_BYTES;

export const signupSchema = z.object({
  email: z.email('유효한 이메일 형식이 아닙니다.'),
  password: z
    .string({ error: '비밀번호는 필수입니다.' })
    .refine(hasEnoughPasswordCharacters, '비밀번호는 15자 이상이어야 합니다.')
    .refine(
      fitsBcryptPasswordLimit,
      '비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.',
    ),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.').optional(),
});

export const loginSchema = z.object({
  email: z.email('유효한 이메일 형식이 아닙니다.'),
  password: z
    .string({ error: '비밀번호는 필수입니다.' })
    .min(1, '비밀번호를 입력해주세요.')
    .refine(
      fitsBcryptPasswordLimit,
      '비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.',
    ),
});
