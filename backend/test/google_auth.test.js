import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'http'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import app from '../server.js'
import { User } from '../models/User.js'
import { connectDB } from '../config/db.js'
import { setGoogleTokenVerifier } from '../services/googleAuthService.js'

dotenv.config()

let server
let baseUrl

// Helper to extract cookie from set-cookie header
function getCookieHeader(res) {
  const rawCookie = res.headers.get('set-cookie')
  if (!rawCookie) return ''
  return rawCookie.split(';')[0]
}

describe('Google Authentication Verification Suite', () => {
  before(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com'
    await connectDB()

    // Start server on dynamic port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })

    // Clean test users scoped to google-test domain
    await User.deleteMany({ email: /@google-test\.com$/ })
  })

  after(async () => {
    // Reset verifier to default
    setGoogleTokenVerifier(null)
    // Clean test users
    await User.deleteMany({ email: /@google-test\.com$/ })
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.connection.close()
  })

  describe('1. Input Validation for /api/auth/google', () => {
    it('rejects empty request body with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.match(data.message, /token|credential/i)
    })

    it('rejects whitespace-only token with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: '   ' }),
      })

      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.strictEqual(data.success, false)
    })
  })

  describe('2. Token Verification Security & Claim Enforcement', () => {
    it('rejects token when Google verification throws invalid signature / expired (401)', async () => {
      // Mock verifier throwing expired / signature error
      setGoogleTokenVerifier(async () => {
        const err = new Error('Token used too late or signature invalid')
        err.statusCode = 401
        throw err
      })

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'expired.token.jwt' }),
      })

      assert.strictEqual(res.status, 401)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.match(data.message, /verification failed|signature/i)
    })

    it('rejects token when email is not verified (email_verified: false) with 400', async () => {
      setGoogleTokenVerifier(async () => {
        const err = new Error('Google email address is not verified.')
        err.statusCode = 400
        throw err
      })

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'unverified-email.token.jwt' }),
      })

      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.match(data.message, /not verified/i)
    })

    it('rejects token when audience does not match server GOOGLE_CLIENT_ID (401)', async () => {
      setGoogleTokenVerifier(async () => {
        const err = new Error('Invalid Google token: audience mismatch.')
        err.statusCode = 401
        throw err
      })

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'wrong-audience.token.jwt' }),
      })

      assert.strictEqual(res.status, 401)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.match(data.message, /audience mismatch/i)
    })
  })

  describe('3. New User Registration via Google Sign-In', () => {
    let authCookie = ''
    const newGoogleUser = {
      googleId: 'google-sub-10001',
      email: 'newuser@google-test.com',
      name: 'New Google User',
      avatar: 'https://lh3.googleusercontent.com/a/photo1',
    }

    before(() => {
      setGoogleTokenVerifier(async () => newGoogleUser)
    })

    it('registers new user and returns 201 with user profile and auth cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid.token.for.newuser' }),
      })

      assert.strictEqual(res.status, 201)
      authCookie = getCookieHeader(res)
      assert.ok(authCookie.includes('token='), 'Should issue HTTP-only JWT token cookie')

      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.user.email, 'newuser@google-test.com')
      assert.strictEqual(data.data.user.name, 'New Google User')
      assert.strictEqual(data.data.user.avatar, newGoogleUser.avatar)
      assert.strictEqual(data.data.user.authProvider, 'google')
      assert.strictEqual(data.data.user.password, undefined, 'Password must never be exposed')

      // Verify in DB directly
      const dbUser = await User.findOne({ googleId: newGoogleUser.googleId }).select('+password')
      assert.ok(dbUser)
      assert.strictEqual(dbUser.password, undefined, 'Google-only users should have no password')
      assert.strictEqual(dbUser.authProvider, 'google')
    })

    it('allows newly created Google user to access protected /api/auth/me', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Cookie: authCookie },
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.user.email, 'newuser@google-test.com')
      assert.strictEqual(data.data.user.name, 'New Google User')
    })
  })

  describe('4. Existing Google User Login', () => {
    let authCookie = ''
    const existingGoogleUser = {
      googleId: 'google-sub-10001', // same sub as registered above
      email: 'newuser@google-test.com',
      name: 'New Google User Updated Name',
      avatar: 'https://lh3.googleusercontent.com/a/photo1',
    }

    before(() => {
      setGoogleTokenVerifier(async () => existingGoogleUser)
    })

    it('authenticates existing Google user and returns 200 with JWT cookie without creating duplicate', async () => {
      const countBefore = await User.countDocuments({ email: 'newuser@google-test.com' })
      assert.strictEqual(countBefore, 1)

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid.token.for.existinguser' }),
      })

      assert.strictEqual(res.status, 200)
      authCookie = getCookieHeader(res)
      assert.ok(authCookie.includes('token='))

      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.user.email, 'newuser@google-test.com')

      const countAfter = await User.countDocuments({ email: 'newuser@google-test.com' })
      assert.strictEqual(countAfter, 1, 'No duplicate user created')
    })
  })

  describe('5. Safe Account Linking to Existing Password-Based Account', () => {
    const localUserEmail = 'localuser@google-test.com'
    const localPassword = 'Password123!'
    const googleIdToLink = 'google-sub-20002'

    before(async () => {
      // Create local password-based account first
      await User.create({
        name: 'Local Test User',
        email: localUserEmail,
        password: localPassword,
        authProvider: 'local',
      })
    })

    it('links Google account to existing user with same verified email address', async () => {
      setGoogleTokenVerifier(async () => ({
        googleId: googleIdToLink,
        email: localUserEmail,
        name: 'Local Test User Google',
        avatar: 'https://lh3.googleusercontent.com/a/avatar2',
      }))

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token.for.linking' }),
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.user.email, localUserEmail)

      // Verify in DB that googleId was linked
      const userInDb = await User.findOne({ email: localUserEmail })
      assert.strictEqual(userInDb.googleId, googleIdToLink)
      assert.strictEqual(userInDb.avatar, 'https://lh3.googleusercontent.com/a/avatar2')
    })

    it('ensures existing password login still functions after Google account linking', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localUserEmail,
          password: localPassword,
        }),
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.user.email, localUserEmail)
    })
  })

  describe('6. Conflict & Identity Collision Handling', () => {
    it('rejects attempt to link account if email is already linked to a different googleId (409 Conflict)', async () => {
      // Local user from test 5 already has googleId = 'google-sub-20002'
      // Attacker/different Google account claims same email with a different google sub
      setGoogleTokenVerifier(async () => ({
        googleId: 'different-google-sub-99999',
        email: 'localuser@google-test.com',
        name: 'Impostor User',
      }))

      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token.from.different.google.sub' }),
      })

      assert.strictEqual(res.status, 409)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.match(data.message, /already associated with a different Google account/i)
    })
  })

  describe('7. Session Lifecycle & Logout', () => {
    it('logs out and clears authentication cookie', async () => {
      // Login with Google first
      setGoogleTokenVerifier(async () => ({
        googleId: 'google-sub-10001',
        email: 'newuser@google-test.com',
        name: 'New Google User',
      }))

      const loginRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'token' }),
      })
      assert.strictEqual(loginRes.status, 200)
      const cookie = getCookieHeader(loginRes)

      // Logout
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookie },
      })
      assert.strictEqual(logoutRes.status, 200)
      const setCookie = logoutRes.headers.get('set-cookie')
      assert.ok(setCookie && setCookie.includes('token=') && setCookie.includes('Expires='))

      // Subsequent access without valid cookie returns 401
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Cookie: 'token=' },
      })
      assert.strictEqual(meRes.status, 401)
    })
  })
})
