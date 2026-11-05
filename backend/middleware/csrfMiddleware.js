/**
 * CSRF Protection Middleware for Cookie-Authenticated State-Changing Requests
 * Protects against cross-site request forgery when using HTTP-only cookies.
 */
export const csrfProtection = (allowedOrigins) => (req, res, next) => {
  // 1. Safe HTTP methods do not change state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  // 2. If request is authenticated via Bearer header, CSRF is not applicable
  // because browsers never attach Authorization headers automatically to cross-site requests.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next()
  }

  // 3. If request is NOT cookie-authenticated, CSRF is not applicable
  const hasCookieAuth = req.cookies && req.cookies.token
  if (!hasCookieAuth) {
    return next()
  }

  // 4. Verify Origin header
  const origin = req.headers.origin
  if (origin) {
    const isAllowed =
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Cross-site request blocked by CSRF protection policy.',
      })
    }
    return next()
  }

  // 5. If Origin is absent, inspect Referer header
  const referer = req.headers.referer
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      const isAllowed =
        allowedOrigins.includes(refererOrigin) ||
        (process.env.NODE_ENV !== 'production' &&
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(refererOrigin))

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. Cross-site request blocked by CSRF protection policy.',
        })
      }
      return next()
    } catch {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Malformed referer header blocked.',
      })
    }
  }

  // 6. Inspect Sec-Fetch-Site metadata (present in all modern browsers)
  const fetchSite = req.headers['sec-fetch-site']
  if (fetchSite === 'cross-site') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Cross-site request blocked by CSRF protection policy.',
    })
  }

  // 7. Reject form-encoded mutations without origin in cookie-authenticated contexts
  const contentType = req.headers['content-type'] || ''
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Form-encoded cross-site requests are rejected.',
    })
  }

  next()
}

