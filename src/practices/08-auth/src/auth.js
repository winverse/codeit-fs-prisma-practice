export async function hashPassword(_password) {
  throw new Error('TODO: bcrypt로 비밀번호를 해싱하세요.');
}

export async function comparePassword(_password, _hashedPassword) {
  return false;
}

export function generateAccessToken(_user, _accessSecret, _expiresIn = '15m') {
  return '';
}

export function generateRefreshToken(_user, _refreshSecret, _expiresIn = '7d') {
  return '';
}

export function generateTokens(_user, _secrets, _expiresIn) {
  return { accessToken: '', refreshToken: '' };
}

export function verifyToken(_token, _tokenType, _secrets) {
  return null;
}

export function setAuthCookies(_res, _tokens, _options) {}

export function authenticate(_secrets) {
  return (_req, _res, next) => next();
}

export function toPublicUser(user) {
  return user;
}
