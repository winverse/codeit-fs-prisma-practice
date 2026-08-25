import express from 'express';
import { loginSchema, signupSchema } from './schemas.js';
import { validate } from './validation.middleware.js';

export const authRouter = express.Router();

export function respondWithValidatedBody(statusCode) {
  return (req, res) => {
    const responseBody = { ...req.validated.body };
    delete responseBody.password;
    return res.status(statusCode).json(responseBody);
  };
}

authRouter.post(
  '/signup',
  validate('body', signupSchema),
  respondWithValidatedBody(201),
);

authRouter.post(
  '/login',
  validate('body', loginSchema),
  respondWithValidatedBody(200),
);
