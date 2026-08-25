import express from 'express';

export const authRouter = express.Router();

export function respondWithValidatedBody(statusCode) {
  return (req, res) => {
    const responseBody = { ...req.validated.body };
    delete responseBody.password;
    return res.status(statusCode).json(responseBody);
  };
}

// TODO 5: 이 파일 최상단에서 `validate`와 `signupSchema`, `loginSchema`를 import하세요.
// TODO 6: POST /signup Route에 body용 signupSchema 검증 미들웨어를 연결하고,
// 검증 성공 뒤 `respondWithValidatedBody(201)` handler가 실행되게 등록하세요.
// TODO 7: POST /login Route에 body용 loginSchema 검증 미들웨어를 연결하고,
// 검증 성공 뒤 `respondWithValidatedBody(200)` handler가 실행되게 등록하세요.
