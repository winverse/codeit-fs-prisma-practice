import { HttpException } from './errors.js';

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpException) {
    return res.status(error.statusCode).json({
      ...(error.details ?? {}),
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
