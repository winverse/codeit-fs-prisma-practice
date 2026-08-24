export class HttpError extends Error {}

export function validateIdParam(_name, _label) {
  return (_req, _res, next) => next();
}

export function notFoundHandler(_req, _res, next) {
  return next();
}

export function errorHandler(_error, _req, res, _next) {
  return res.status(500).json({ message: 'Internal server error' });
}
