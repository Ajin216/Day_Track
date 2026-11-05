import jwt from 'jsonwebtoken'

const TOKEN_COOKIE_NAME = 'token'

/**
 * Builds cookie options based on environment and optional overrides.
 * Ensures SameSite=None is always paired with Secure=true in compliance with web standards.
 */
export const getCookieOptions = (override = {}) => {
  const isProduction = process.env.NODE_ENV === 'production'

  // Secure: default to true in production, or check COOKIE_SECURE override
  const secure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : isProduction

  // SameSite: default to 'none' in production (for cross-site deployments e.g. Vercel + Render),
  // or 'lax' in development, configurable via COOKIE_SAMESITE
  let sameSite = isProduction ? 'none' : 'lax'
  if (process.env.COOKIE_SAMESITE) {
    const configured = process.env.COOKIE_SAMESITE.toLowerCase()
    if (['none', 'lax', 'strict'].includes(configured)) {
      sameSite = configured
    }
  }

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...override,
  }

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN
  }

  return options
}

/**
 * Generates a signed JWT for the provided user ID.
 */
export const signToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in environment variables.')
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn })
}

/**
 * Signs a JWT and sets an HTTP-only cookie on the response.
 */
export const setTokenCookie = (res, userId) => {
  const token = signToken(userId)
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  const options = getCookieOptions({ maxAge: maxAgeMs })
  res.cookie(TOKEN_COOKIE_NAME, token, options)

  return token
}

/**
 * Clears the authentication cookie for logout.
 */
export const clearTokenCookie = (res) => {
  const options = getCookieOptions({ expires: new Date(0) })
  res.cookie(TOKEN_COOKIE_NAME, '', options)
}
