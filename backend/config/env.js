/**
 * Production environment variable validator for DayTrack backend.
 * Ensures all required environment variables are present and secure at startup.
 * Never prints secrets, keys, or credentials to logs.
 */
export const validateEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'
  const errors = []

  // 1. Validate PORT
  if (process.env.PORT) {
    const portNum = Number(process.env.PORT)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.push(`PORT must be a valid port number between 1 and 65535. Received: "${process.env.PORT}".`)
    }
  }

  // 2. Validate MONGODB_URI
  const mongodbUri = process.env.MONGODB_URI
  if (!mongodbUri || !mongodbUri.trim()) {
    errors.push('MONGODB_URI is required. Please provide a valid MongoDB connection string.')
  } else if (isProduction) {
    if (!mongodbUri.startsWith('mongodb://') && !mongodbUri.startsWith('mongodb+srv://')) {
      errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".')
    }
  }

  // 3. Validate JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || !jwtSecret.trim()) {
    errors.push('JWT_SECRET is required to sign authentication tokens.')
  } else if (isProduction) {
    if (jwtSecret.length < 32) {
      errors.push(
        `JWT_SECRET in production must be at least 32 characters long for security. Current length: ${jwtSecret.length}.`
      )
    }
    const insecurePlaceholders = [
      'your_jwt_secret',
      'secret',
      'changeme',
      'defaultsecret',
      '123456',
    ]
    if (insecurePlaceholders.some((ph) => jwtSecret.toLowerCase().includes(ph))) {
      errors.push('JWT_SECRET is set to an insecure default or placeholder. Please provide a cryptographically strong secret.')
    }
  }

  // 4. Validate CLIENT_URL in production
  if (isProduction) {
    const clientUrl = process.env.CLIENT_URL
    if (!clientUrl || !clientUrl.trim()) {
      errors.push(
        'CLIENT_URL is required in production to configure CORS and CSRF protection (e.g. "https://daytrack.app").'
      )
    } else {
      const origins = clientUrl.split(',').map((o) => o.trim())
      for (const origin of origins) {
        try {
          const parsed = new URL(origin)
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            errors.push(`CLIENT_URL origin "${origin}" must use http or https protocol.`)
          }
        } catch {
          errors.push(`CLIENT_URL origin "${origin}" is not a valid URL.`)
        }
      }
    }
  }

  // 5. Validate COOKIE_SAMESITE if explicitly configured
  if (process.env.COOKIE_SAMESITE) {
    const sameSite = process.env.COOKIE_SAMESITE.toLowerCase()
    if (!['none', 'lax', 'strict'].includes(sameSite)) {
      errors.push(`COOKIE_SAMESITE must be one of: 'none', 'lax', 'strict'. Received: "${process.env.COOKIE_SAMESITE}".`)
    }
    // If SameSite=None, Secure must be true
    if (sameSite === 'none') {
      const isSecure =
        process.env.COOKIE_SECURE !== undefined
          ? process.env.COOKIE_SECURE === 'true'
          : isProduction
      if (!isSecure) {
        errors.push("COOKIE_SAMESITE='none' requires COOKIE_SECURE='true' (browsers reject SameSite=None without Secure).")
      }
    }
  }

  // If validation errors exist, fail fast with a descriptive message
  if (errors.length > 0) {
    console.error('=====================================================')
    console.error('[DayTrack Config Error] Production Environment Validation Failed:')
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`))
    console.error('=====================================================')
    const error = new Error(`Environment validation failed with ${errors.length} error(s).`)
    error.errors = errors
    throw error
  }

  return true
}

/**
 * Returns parsed list of allowed client origins from CLIENT_URL and dev defaults.
 */
export const getAllowedOrigins = () => {
  const origins = []

  if (process.env.CLIENT_URL) {
    const clientUrls = process.env.CLIENT_URL.split(',').map((u) => u.trim()).filter(Boolean)
    origins.push(...clientUrls)
  }

  // In development and test, include standard local Vite ports
  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
    ]
    for (const devOrigin of devOrigins) {
      if (!origins.includes(devOrigin)) {
        origins.push(devOrigin)
      }
    }
  }

  return origins
}

