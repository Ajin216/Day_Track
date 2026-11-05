import { OAuth2Client } from 'google-auth-library'

// Default OAuth2Client instance
let defaultClient = null

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!defaultClient) {
    defaultClient = new OAuth2Client(clientId)
  }
  return defaultClient
}

// Token verifier function pointer to allow test mocking without network calls
let customTokenVerifier = null

/**
 * Set a custom verifier function for tests.
 * Pass null to restore standard Google OAuth verification.
 */
export const setGoogleTokenVerifier = (verifier) => {
  customTokenVerifier = verifier
}

/**
 * Verifies a Google ID Token using official google-auth-library.
 * Validates audience, issuer, expiration, signature, and email_verified claim.
 *
 * @param {string} idToken - The JWT credential provided by Google Identity Services.
 * @returns {Promise<{ googleId: string, email: string, name: string, avatar: string | null }>}
 */
export const verifyGoogleIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    const error = new Error('Google ID token is required.')
    error.statusCode = 400
    throw error
  }

  // If a custom verifier is set (e.g. for testing), invoke it
  if (customTokenVerifier) {
    return customTokenVerifier(idToken)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    const error = new Error('GOOGLE_CLIENT_ID environment variable is not configured on the server.')
    error.statusCode = 500
    throw error
  }

  const client = getOAuthClient()

  let ticket
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    })
  } catch (err) {
    const error = new Error(`Google token verification failed: ${err.message}`)
    error.statusCode = 401
    throw error
  }

  const payload = ticket.getPayload()
  if (!payload) {
    const error = new Error('Invalid Google token: payload is missing.')
    error.statusCode = 401
    throw error
  }

  // Validate issuer
  const validIssuers = ['accounts.google.com', 'https://accounts.google.com']
  if (!validIssuers.includes(payload.iss)) {
    const error = new Error('Invalid Google token: untrusted issuer.')
    error.statusCode = 401
    throw error
  }

  // Validate audience
  if (payload.aud !== clientId) {
    const error = new Error('Invalid Google token: audience mismatch.')
    error.statusCode = 401
    throw error
  }

  // Enforce email_verified claim
  if (!payload.email_verified) {
    const error = new Error('Google email address is not verified.')
    error.statusCode = 400
    throw error
  }

  if (!payload.email) {
    const error = new Error('Google token did not contain an email address.')
    error.statusCode = 400
    throw error
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || null,
  }
}

