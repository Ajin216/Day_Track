import { it, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import http from 'http'
import app from '../server.js'
import { User } from '../models/User.js'
import { Task } from '../models/Task.js'
import { DailyReview } from '../models/DailyReview.js'
import { signToken } from '../utils/generateToken.js'
import { connectDB } from '../config/db.js'
import { getTodayInTimezone } from '../utils/dateUtils.js'

describe('Step 9A Security & Edge Case Audit Suite', () => {
  const TODAY = getTodayInTimezone('Asia/Kolkata')
  let server
  let baseUrl
  let user1
  let user2
  let token1
  let token2
  let cookieHeader1
  let cookieHeader2

  before(async () => {
    // Connect to MongoDB
    await connectDB()

    // Start test server on dynamic port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })

    // Clean test database collections scoped to test-audit users
    const existingAuditUsers = await User.find({ email: /@test-audit\.com$/ }).select('_id')
    const auditUserIds = existingAuditUsers.map((u) => u._id)
    if (auditUserIds.length > 0) {
      await Task.deleteMany({ userId: { $in: auditUserIds } })
      await DailyReview.deleteMany({ userId: { $in: auditUserIds } })
      await User.deleteMany({ _id: { $in: auditUserIds } })
    }

    // Create User 1
    user1 = await User.create({
      name: 'Audit User One',
      email: 'user1@test-audit.com',
      password: 'password123',
    })
    token1 = signToken(user1._id)
    cookieHeader1 = `token=${token1}`

    // Create User 2
    user2 = await User.create({
      name: 'Audit User Two',
      email: 'user2@test-audit.com',
      password: 'password123',
    })
    token2 = signToken(user2._id)
    cookieHeader2 = `token=${token2}`
  })

  after(async () => {
    // Cleanup database scoped to audit users
    if (user1 && user2) {
      await Task.deleteMany({ userId: { $in: [user1._id, user2._id] } })
      await DailyReview.deleteMany({ userId: { $in: [user1._id, user2._id] } })
      await User.deleteMany({ _id: { $in: [user1._id, user2._id] } })
    }

    await new Promise((resolve) => server.close(resolve))
    await mongoose.connection.close()
  })

  // ----------------------------------------------------
  // 1. CSRF Protection
  // ----------------------------------------------------
  describe('1. CSRF Protection for Cookie-Authenticated State-Changing Requests', () => {
    it('blocks state-changing POST with foreign/unauthorized Origin when cookie-authenticated', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader1,
          Origin: 'http://evil-attacker-site.com',
        },
        body: JSON.stringify({
          title: 'Malicious Task',
          date: TODAY,
        }),
      })

      assert.equal(res.status, 403, 'Should reject with 403 Forbidden')
      const body = await res.json()
      assert.equal(body.success, false)
      assert.match(body.message, /CSRF protection policy/i)
    })

    it('blocks form-encoded POST without valid origin in cookie-authenticated context', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader1,
          'Sec-Fetch-Site': 'cross-site',
        },
        body: `title=HackedTask&date=${TODAY}`,
      })

      assert.equal(res.status, 403, 'Should reject cross-site form POST with 403')
    })

    it('allows safe GET requests even if cross-site or without origin', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'GET',
        headers: {
          Cookie: cookieHeader1,
        },
      })

      assert.equal(res.status, 200, 'GET requests are safe methods and should succeed')
    })

    it('allows API clients with Bearer token authentication regardless of origin', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
          Origin: 'http://mobile-or-partner-app.io',
        },
        body: JSON.stringify({
          title: 'Legitimate Bearer Task',
          date: TODAY,
          priority: 'medium',
        }),
      })

      assert.equal(res.status, 201, 'Bearer authenticated request should succeed')
      const body = await res.json()
      assert.equal(body.data.task.title, 'Legitimate Bearer Task')
    })

    it('allows legitimate requests from allowed localhost / client origins with cookies', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader1,
          Origin: 'http://localhost:5173',
        },
        body: JSON.stringify({
          title: 'Legitimate Web App Task',
          date: TODAY,
          priority: 'high',
        }),
      })

      assert.equal(res.status, 201, 'Same-origin / allowed client origin should succeed')
    })
  })

  // ----------------------------------------------------
  // 2. NoSQL Query Object Injection Protection
  // ----------------------------------------------------
  describe('2. NoSQL Query Object Injection Protection', () => {
    it('safely handles date[$ne]=null injection attempts without exposing other dates or crashing', async () => {
      // Query with simulated NoSQL object parameter in URL
      const res = await fetch(`${baseUrl}/api/tasks?date[$ne]=null`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 200)
      const body = await res.json()
      assert.equal(body.success, true)
      // When date is an object, the service treats it as not matching string format and ignores it or returns safe tasks
      assert.ok(Array.isArray(body.data.tasks))
    })

    it('safely handles priority[$gt]="" injection attempts', async () => {
      const res = await fetch(`${baseUrl}/api/tasks?priority[$gt]=`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 200)
      const body = await res.json()
      assert.equal(body.success, true)
      assert.ok(Array.isArray(body.data.tasks))
    })
  })

  // ----------------------------------------------------
  // 3. Invalid MongoDB ObjectId Handling
  // ----------------------------------------------------
  describe('3. Invalid MongoDB ObjectId Handling (404 instead of 500)', () => {
    it('returns 404 for invalid taskId format on GET /api/tasks/:id', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/not-a-valid-object-id`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 404)
      const body = await res.json()
      assert.equal(body.success, false)
      assert.match(body.message, /not found/i)
    })

    it('returns 404 for invalid taskId format on PATCH /api/tasks/:id', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/9999999999`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ title: 'New Title' }),
      })

      assert.equal(res.status, 404)
      const body = await res.json()
      assert.equal(body.success, false)
    })

    it('returns 404 for invalid taskId format on DELETE /api/tasks/:id', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/invalid-hex-id`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 404)
      const body = await res.json()
      assert.equal(body.success, false)
    })

    it('returns 404 for invalid reviewId format on GET /api/reviews/:id', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/invalid-review-id`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 404)
      const body = await res.json()
      assert.equal(body.success, false)
    })
  })

  // ----------------------------------------------------
  // 4. Strict User Ownership Isolation
  // ----------------------------------------------------
  describe('4. Strict User Ownership Isolation', () => {
    let taskUser1
    let reviewUser1

    before(async () => {
      // User 1 creates a private task
      taskUser1 = await Task.create({
        userId: user1._id,
        title: 'User 1 Confidential Task',
        date: TODAY,
        priority: 'high',
        completed: false,
      })

      // User 1 creates a private review
      reviewUser1 = await DailyReview.create({
        userId: user1._id,
        date: TODAY,
        mood: 'Excellent',
        accomplishments: 'User 1 private wins',
      })
    })

    it('prevents User 2 from reading User 1 task (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${taskUser1._id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      })

      assert.equal(res.status, 404, 'User 2 should receive 404 for User 1 task')
    })

    it('prevents User 2 from modifying User 1 task (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${taskUser1._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ title: 'Tampered by User 2' }),
      })

      assert.equal(res.status, 404)

      // Verify task was not changed
      const unchanged = await Task.findById(taskUser1._id)
      assert.equal(unchanged.title, 'User 1 Confidential Task')
    })

    it('prevents User 2 from deleting User 1 task (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${taskUser1._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      })

      assert.equal(res.status, 404)

      // Verify task still exists
      const exists = await Task.findById(taskUser1._id)
      assert.ok(exists)
    })

    it('prevents User 2 from reading User 1 review (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${reviewUser1._id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      })

      assert.equal(res.status, 404)
    })

    it('prevents User 2 from modifying User 1 review (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${reviewUser1._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ accomplishments: 'Tampered Wins' }),
      })

      assert.equal(res.status, 404)
    })

    it('prevents User 2 from deleting User 1 review (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${reviewUser1._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      })

      assert.equal(res.status, 404)
    })
  })

  // ----------------------------------------------------
  // 5. Daily Review Uniqueness & Upsert
  // ----------------------------------------------------
  describe('5. Daily Review Uniqueness & Upsert Behavior', () => {
    it('upserts daily review for the same date instead of creating duplicate records', async () => {
      const reviewDate = '2026-11-05'

      // First submission
      const res1 = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          date: reviewDate,
          mood: 'Good',
          accomplishments: 'First draft of accomplishments',
        }),
      })

      assert.equal(res1.status, 200)
      const data1 = await res1.json()
      const reviewId1 = data1.data.review.id

      // Second submission for identical date
      const res2 = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          date: reviewDate,
          mood: 'Excellent',
          accomplishments: 'Updated draft with more wins',
        }),
      })

      assert.equal(res2.status, 200)
      const data2 = await res2.json()
      const reviewId2 = data2.data.review.id

      assert.equal(reviewId1, reviewId2, 'Same review record must be upserted')
      assert.equal(data2.data.review.mood, 'Excellent')
      assert.equal(data2.data.review.accomplishments, 'Updated draft with more wins')

      // Verify in database that exactly 1 review exists for this user and date
      const count = await DailyReview.countDocuments({
        userId: user1._id,
        date: reviewDate,
      })
      assert.equal(count, 1, 'Exactly one review must exist per user per date')
    })
  })

  // ----------------------------------------------------
  // 6. Sensitive Information Protection & Input Validation
  // ----------------------------------------------------
  describe('6. Sensitive Information Exposure & Input Validation', () => {
    it('never exposes password hash in profile or auth responses', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 200)
      const body = await res.json()
      assert.ok(body.data.user)
      assert.equal(body.data.user.password, undefined, 'Password field must not exist')
      assert.equal(body.data.user.__v, undefined, 'Mongoose __v must not be exposed')
    })

    it('rejects empty or whitespace-only task title with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: '   ',
          date: TODAY,
        }),
      })

      assert.equal(res.status, 400)
      const body = await res.json()
      assert.equal(body.success, false)
      assert.match(body.message, /Task title is required/i)
    })

    it('rejects invalid date format in task creation with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Valid Title',
          date: '2026-02-31', // Invalid calendar date
        }),
      })

      assert.equal(res.status, 400)
      const body = await res.json()
      assert.equal(body.success, false)
      assert.match(body.message, /valid date/i)
    })

    it('rejects invalid mood enum in daily review with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          date: '2026-11-06',
          mood: 'Ecstatic', // Invalid enum
        }),
      })

      assert.equal(res.status, 400)
      const body = await res.json()
      assert.equal(body.success, false)
      assert.match(body.message, /Mood is required and must be one of/i)
    })
  })

  // ----------------------------------------------------
  // 7. Rate Limiter Headers
  // ----------------------------------------------------
  describe('7. API Rate Limiting Headers', () => {
    it('provides standard RateLimit headers on /api requests', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
      })

      assert.equal(res.status, 200)
      assert.ok(
        res.headers.has('ratelimit-limit') || res.headers.has('x-ratelimit-limit'),
        'Rate limit header should be present'
      )
    })
  })
})
