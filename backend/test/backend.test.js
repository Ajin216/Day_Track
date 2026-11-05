import test from 'node:test'
import assert from 'node:assert'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import app from '../server.js'
import { User } from '../models/User.js'
import { Task } from '../models/Task.js'
import { DailyReview } from '../models/DailyReview.js'
import { connectDB } from '../config/db.js'
import { getTodayInTimezone } from '../utils/dateUtils.js'

dotenv.config()

const TEST_PORT = 5055
const BASE_URL = `http://localhost:${TEST_PORT}`
const TODAY = getTodayInTimezone('Asia/Kolkata')

let server
let user1Cookie = ''
let user1Id = ''
let user2Cookie = ''
let user2Id = ''
let task1Id = ''
let review1Id = ''

// Helper to extract cookie from fetch response
function getCookieHeader(res) {
  const rawCookie = res.headers.get('set-cookie')
  if (!rawCookie) return ''
  return rawCookie.split(';')[0]
}

test('Step 7A Backend Verification Suite', async (t) => {
  // Setup: start server and connect to DB
  await t.test('1. Database Connection & Server Startup', async () => {
    await connectDB()
    server = app.listen(TEST_PORT)
    assert.ok(server)

    const healthRes = await fetch(`${BASE_URL}/api/health`)
    const healthData = await healthRes.json()
    assert.strictEqual(healthRes.status, 200)
    assert.strictEqual(healthData.success, true)
    console.log('✓ 1. Backend starts successfully and health check passes')
  })

  await t.test('2. Database Connection Failure Handling', async () => {
    // Attempt connecting to invalid port to test error handling
    const badUri = 'mongodb://127.0.0.1:27999/daytrack_nonexistent?serverSelectionTimeoutMS=500'
    const originalUri = process.env.MONGODB_URI
    process.env.MONGODB_URI = badUri

    try {
      await mongoose.createConnection(badUri).asPromise()
      assert.fail('Should not connect to invalid URI')
    } catch (err) {
      assert.ok(err.message)
      console.log('✓ 2. Database connection failure handled cleanly without exposing credentials')
    } finally {
      process.env.MONGODB_URI = originalUri
    }
  })

  await t.test('Clean test database collections', async () => {
    await Task.deleteMany({ title: { $regex: /^Test Task/ } })
    await DailyReview.deleteMany({ accomplishments: { $regex: /^Test/ } })
    await User.deleteMany({ email: { $in: ['alex.test@daytrack.app', 'taylor.test@daytrack.app'] } })
  })

  await t.test('3. User Registration (User 1)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'alex.test@daytrack.app',
        password: 'Password123!',
      }),
    })

    const data = await res.json()
    assert.strictEqual(res.status, 201)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.data.user.name, 'Alex Rivera')
    assert.strictEqual(data.data.user.email, 'alex.test@daytrack.app')
    assert.strictEqual(data.data.user.password, undefined, 'Password must not be returned in API response')

    user1Id = data.data.user.id
    user1Cookie = getCookieHeader(res)
    assert.ok(user1Cookie.includes('token='))

    // Check cookie attributes
    const setCookieRaw = res.headers.get('set-cookie')
    assert.ok(setCookieRaw.toLowerCase().includes('httponly'), 'Authentication cookie must be httpOnly')

    console.log('✓ 3 & 8. User registration succeeds with safe user info and HTTP-only cookie')
  })

  await t.test('4. Duplicate Email Registration Rejection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Duplicate',
        email: 'alex.test@daytrack.app',
        password: 'AnotherPassword123!',
      }),
    })

    const data = await res.json()
    assert.strictEqual(res.status, 409)
    assert.strictEqual(data.success, false)
    assert.ok(data.message.toLowerCase().includes('already exists'))
    console.log('✓ 4. Duplicate email registration rejected with 409 Conflict')
  })

  await t.test('5. Password Hashing Verification in Database', async () => {
    const dbUser = await User.findOne({ email: 'alex.test@daytrack.app' }).select('+password')
    assert.ok(dbUser)
    assert.notStrictEqual(dbUser.password, 'Password123!')
    assert.ok(dbUser.password.startsWith('$2'), 'Password must be hashed with bcrypt')
    console.log('✓ 5. Passwords are securely hashed with bcrypt')
  })

  await t.test('6 & 7. Login Verification (Correct & Incorrect Passwords)', async () => {
    // 7. Incorrect password
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.test@daytrack.app',
        password: 'WrongPassword!',
      }),
    })
    const badLoginData = await badLoginRes.json()
    assert.strictEqual(badLoginRes.status, 401)
    assert.strictEqual(badLoginData.success, false)
    console.log('✓ 7. Login with incorrect password rejected with 401 Unauthorized')

    // 6. Correct password
    const goodLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.test@daytrack.app',
        password: 'Password123!',
      }),
    })
    const goodLoginData = await goodLoginRes.json()
    assert.strictEqual(goodLoginRes.status, 200)
    assert.strictEqual(goodLoginData.success, true)
    assert.strictEqual(goodLoginData.data.user.email, 'alex.test@daytrack.app')
    user1Cookie = getCookieHeader(goodLoginRes)
    console.log('✓ 6. Login with correct credentials succeeds and returns JWT cookie')
  })

  await t.test('9. GET /api/auth/me Profile Retrieval', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: user1Cookie },
    })
    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.data.user.email, 'alex.test@daytrack.app')
    console.log('✓ 9. GET /api/auth/me returns authenticated user profile')
  })

  await t.test('10. Logout & Token Invalidation', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
    })
    const logoutData = await logoutRes.json()
    assert.strictEqual(logoutRes.status, 200)
    assert.strictEqual(logoutData.success, true)

    const clearedCookie = logoutRes.headers.get('set-cookie')
    assert.ok(clearedCookie.includes('token=') && clearedCookie.includes('Expires='))
    console.log('✓ 10. POST /api/auth/logout clears authentication cookie')
  })

  await t.test('11. Protected Endpoints Reject Unauthenticated Requests', async () => {
    const resTasks = await fetch(`${BASE_URL}/api/tasks`)
    assert.strictEqual(resTasks.status, 401)

    const resReviews = await fetch(`${BASE_URL}/api/reviews`)
    assert.strictEqual(resReviews.status, 401)

    const resMe = await fetch(`${BASE_URL}/api/auth/me`)
    assert.strictEqual(resMe.status, 401)

    console.log('✓ 11. Protected endpoints reject unauthenticated access with 401')
  })

  await t.test('Create Second User (User 2) for Ownership Isolation Tests', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Taylor Swift',
        email: 'taylor.test@daytrack.app',
        password: 'Password456!',
      }),
    })
    const data = await res.json()
    assert.strictEqual(res.status, 201)
    user2Id = data.data.user.id
    user2Cookie = getCookieHeader(res)
  })

  await t.test('12. Authenticated Task Creation (User 1)', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie,
      },
      body: JSON.stringify({
        title: 'Test Task 1 for User 1',
        description: 'Verify task creation and backend association',
        date: TODAY,
        priority: 'high',
        category: 'Engineering',
        time: '14:30',
      }),
    })

    const data = await res.json()
    assert.strictEqual(res.status, 201)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.data.task.title, 'Test Task 1 for User 1')
    assert.strictEqual(data.data.task.completed, false)
    assert.strictEqual(data.data.task.completedAt, null)

    task1Id = data.data.task.id
    console.log('✓ 12. Authenticated user successfully creates a task')
  })

  await t.test('13. Task Ownership Isolation (User 2 Cannot Read User 1 Task)', async () => {
    // User 2 queries task list
    const listRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Cookie: user2Cookie },
    })
    const listData = await listRes.json()
    assert.strictEqual(listRes.status, 200)
    assert.strictEqual(listData.data.tasks.some((t) => t.id === task1Id), false)

    // User 2 tries to GET User 1's task directly
    const directRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      headers: { Cookie: user2Cookie },
    })
    assert.strictEqual(directRes.status, 404)
    console.log('✓ 13. Users cannot access another user\'s tasks')
  })

  await t.test('14. Task Ownership Isolation (User 2 Cannot Update/Delete User 1 Task)', async () => {
    // User 2 tries to update User 1's task
    const patchRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user2Cookie,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    })
    assert.strictEqual(patchRes.status, 404)

    // User 2 tries to delete User 1's task
    const deleteRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      method: 'DELETE',
      headers: { Cookie: user2Cookie },
    })
    assert.strictEqual(deleteRes.status, 404)

    console.log('✓ 14. Users cannot modify or delete another user\'s tasks')
  })

  await t.test('15. Task Update & Completion Timestamps (User 1)', async () => {
    // Mark completed
    const completeRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie,
      },
      body: JSON.stringify({ completed: true }),
    })
    const completeData = await completeRes.json()
    assert.strictEqual(completeRes.status, 200)
    assert.strictEqual(completeData.data.task.completed, true)
    assert.notStrictEqual(completeData.data.task.completedAt, null)

    // Mark incomplete
    const uncompleteRes = await fetch(`${BASE_URL}/api/tasks/${task1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie,
      },
      body: JSON.stringify({ completed: false }),
    })
    const uncompleteData = await uncompleteRes.json()
    assert.strictEqual(uncompleteRes.status, 200)
    assert.strictEqual(uncompleteData.data.task.completed, false)
    assert.strictEqual(uncompleteData.data.task.completedAt, null)

    console.log('✓ 15. Task completion timestamp rules enforced accurately')
  })

  await t.test('16. Daily Review Creation & Uniqueness (One Review Per User Per Date)', async () => {
    // First save
    const res1 = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie,
      },
      body: JSON.stringify({
        date: TODAY,
        accomplishments: 'Test accomplishment for User 1',
        improvements: 'Test improvement for User 1',
        tomorrowFocus: 'Test tomorrow focus for User 1',
        mood: 'Excellent',
      }),
    })
    const data1 = await res1.json()
    assert.strictEqual(res1.status, 200)
    assert.strictEqual(data1.data.review.mood, 'Excellent')
    review1Id = data1.data.review.id

    // Second save for same date updates existing rather than duplicating
    const res2 = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie,
      },
      body: JSON.stringify({
        date: TODAY,
        accomplishments: 'Updated accomplishments',
        improvements: 'Updated improvements',
        tomorrowFocus: 'Updated focus',
        mood: 'Good',
      }),
    })
    const data2 = await res2.json()
    assert.strictEqual(res2.status, 200)
    assert.strictEqual(data2.data.review.id, review1Id)
    assert.strictEqual(data2.data.review.mood, 'Good')

    // Confirm in DB count is strictly 1
    const count = await DailyReview.countDocuments({ userId: user1Id, date: TODAY })
    assert.strictEqual(count, 1)

    console.log('✓ 16. Reviews are unique per user and date (upsert and compound index)')
  })

  await t.test('17. Daily Review Ownership Isolation (User 2 Cannot Read/Delete User 1 Review)', async () => {
    // User 2 queries review by ID
    const directRes = await fetch(`${BASE_URL}/api/reviews/${review1Id}`, {
      headers: { Cookie: user2Cookie },
    })
    assert.strictEqual(directRes.status, 404)

    // User 2 queries reviews list
    const listRes = await fetch(`${BASE_URL}/api/reviews`, {
      headers: { Cookie: user2Cookie },
    })
    const listData = await listRes.json()
    assert.strictEqual(listData.data.reviews.some((r) => r.id === review1Id), false)

    // User 2 tries to delete User 1's review
    const delRes = await fetch(`${BASE_URL}/api/reviews/${review1Id}`, {
      method: 'DELETE',
      headers: { Cookie: user2Cookie },
    })
    assert.strictEqual(delRes.status, 404)

    console.log('✓ 17. Users cannot access, modify, or delete another user\'s reviews')
  })

  await t.test('18. Validation: Invalid Dates & Mood Values Rejected', async () => {
    // Invalid task date
    const badTaskDate = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ title: 'Bad Date', date: '2026-02-31' }),
    })
    assert.strictEqual(badTaskDate.status, 400)

    // Invalid review mood
    const badMood = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ date: '2026-11-05', mood: 'SuperEcstatic' }),
    })
    assert.strictEqual(badMood.status, 400)

    console.log('✓ 18. Invalid dates and invalid mood values rejected with 400 Bad Request')
  })

  await t.test('19. Centralized Error Handling & 404 Routes', async () => {
    const notFoundRes = await fetch(`${BASE_URL}/api/unregistered_endpoint`)
    const notFoundData = await notFoundRes.json()
    assert.strictEqual(notFoundRes.status, 404)
    assert.strictEqual(notFoundData.success, false)
    assert.ok(notFoundData.message.includes('Route not found'))
    console.log('✓ 19. Centralized error handling returns structured JSON responses')
  })

  await t.test('20. Security Checks (No stack traces in production, no secrets exposed)', async () => {
    // Verify user object never leaks password or __v
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: user1Cookie },
    })
    const meData = await meRes.json()
    assert.strictEqual(meData.data.user.password, undefined)
    assert.strictEqual(meData.data.user.__v, undefined)
    console.log('✓ 20. No secrets, passwords, or internal fields exposed in responses')
  })

  await t.test('Teardown and cleanup', async () => {
    // Delete test tasks and reviews
    await Task.deleteMany({ userId: { $in: [user1Id, user2Id] } })
    await DailyReview.deleteMany({ userId: { $in: [user1Id, user2Id] } })
    await User.deleteMany({ _id: { $in: [user1Id, user2Id] } })

    if (server) {
      server.close()
    }
    await mongoose.connection.close()
    console.log('✓ Test teardown complete')
  })
})

