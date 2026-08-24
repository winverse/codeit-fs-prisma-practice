import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_BEFORE_SECONDS = 5 * 60;

export class HttpException extends Error {
  statusCode;

  constructor(statusCode, description, details = null) {
    super(description);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthorizedException extends HttpException {
  constructor(description = 'Unauthorized') {
    super(401, description);
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    return false;
  }
}

export function generateAccessToken(user, accessSecret, expiresIn = '15m') {
  return jwt.sign({ userId: user.id }, accessSecret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

export function generateRefreshToken(user, refreshSecret, expiresIn = '7d') {
  return jwt.sign({ userId: user.id }, refreshSecret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

export function generateTokens(user, secrets, expiresIn = {}) {
  return {
    accessToken: generateAccessToken(
      user,
      secrets.access,
      expiresIn.access ?? '15m',
    ),
    refreshToken: generateRefreshToken(
      user,
      secrets.refresh,
      expiresIn.refresh ?? '7d',
    ),
  };
}

export function verifyToken(token, tokenType, secrets) {
  try {
    if (!['access', 'refresh'].includes(tokenType)) return null;
    const secret = tokenType === 'access' ? secrets.access : secrets.refresh;
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

function cookieOptions(secure) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  };
}

export function setAuthCookies(res, tokens, { secure = false } = {}) {
  const base = cookieOptions(secure);
  res.cookie('accessToken', tokens.accessToken, {
    ...base,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function authenticate(secrets, { findUserById, secure = false } = {}) {
  if (typeof findUserById !== 'function') {
    throw new TypeError('findUserById is required');
  }

  return async (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies ?? {};
    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    const accessPayload = verifyToken(accessToken, 'access', secrets);
    if (!accessPayload) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await findUserById(accessPayload.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    req.user = toPublicUser(user);

    const expiresIn = accessPayload.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0 && expiresIn < REFRESH_BEFORE_SECONDS && refreshToken) {
      const refreshPayload = verifyToken(refreshToken, 'refresh', secrets);
      if (refreshPayload?.userId === accessPayload.userId) {
        const refreshedUser = await findUserById(refreshPayload.userId);
        if (refreshedUser) {
          setAuthCookies(res, generateTokens(refreshedUser, secrets), {
            secure,
          });
        }
      }
    }

    return next();
  };
}

export function toPublicUser(user) {
  const publicUser = { ...user };
  delete publicUser.password;
  return publicUser;
}
