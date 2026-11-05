import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'http'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import app from '../server.js'
import { User } from '../models/User.js'
import { Task } from '../models/Task.js'
import { DailyReview } from '../models/DailyReview.js'
import { connectDB } from '../config/db.js'
import { signToken } from '../utils/generateToken.js'
import { getTodayInTimezone } from '../utils/dateUtils.js'

dotenv.config()

let server
let baseUrl
let user1
let token1
let user2
let token2

// Helper function to shift dates in YYYY-MM-DD format
function shiftDays(dateStr, offsetDays) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays))
  return dt.toISOString().slice(0, 10)
}

describe('Historical Date Read-Only Policy Suite', () => {
  before(async () => {
    await connectDB()

    // Start server on dynamic port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port
        baseUrl = `http://127.0.0.1:${port}`
        resolve()
      })
    })

    // Clean any prior test users
    await User.deleteMany({ email: { $in: ['history_u1@daytrack.test', 'history_u2@daytrack.test'] } })

    // Setup Test User 1 (Asia/Kolkata timezone)
    user1 = await User.create({
      name: 'History User 1',
      email: 'history_u1@daytrack.test',
      password: 'password123',
      timezone: 'Asia/Kolkata',
    })
    token1 = signToken(user1._id)

    // Setup Test User 2 (America/New_York timezone)
    user2 = await User.create({
      name: 'History User 2',
      email: 'history_u2@daytrack.test',
      password: 'password123',
      timezone: 'America/New_York',
    })
    token2 = signToken(user2._id)
  })

  after(async () => {
    if (user1) {
      await Task.deleteMany({ userId: user1._id })
      await DailyReview.deleteMany({ userId: user1._id })
    }
    if (user2) {
      await Task.deleteMany({ userId: user2._id })
      await DailyReview.deleteMany({ userId: user2._id })
    }
    await User.deleteMany({ email: { $in: ['history_u1@daytrack.test', 'history_u2@daytrack.test'] } })

    if (server) {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.connection.close()
  })

  // ----------------------------------------------------
  // 1. Task Creation Date Rules
  // ----------------------------------------------------
  describe('1. Task Creation Date Rules', () => {
    it('rejects creating a task for yesterday with 403 Forbidden', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const yesterday = shiftDays(today, -1)

      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Yesterday Task Attempt',
          date: yesterday,
          priority: 'medium',
        }),
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))
    })

    it('allows creating a task for today (201 Created)', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')

      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Today Task',
          date: today,
          priority: 'high',
        }),
      })

      assert.strictEqual(res.status, 201)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.task.title, 'Today Task')
    })

    it('allows creating a task for a future date (201 Created)', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const tomorrow = shiftDays(today, 1)

      const res = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Tomorrow Task',
          date: tomorrow,
          priority: 'low',
        }),
      })

      assert.strictEqual(res.status, 201)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.task.title, 'Tomorrow Task')
    })
  })

  // ----------------------------------------------------
  // 2. Task Modification & Completion Rules
  // ----------------------------------------------------
  describe('2. Task Modification & Completion Rules', () => {
    let pastTaskId
    let todayTaskId

    before(async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const yesterday = shiftDays(today, -1)

      // Seed a historical task directly into the database
      const pastTask = await Task.create({
        userId: user1._id,
        title: 'Original Past Task',
        date: yesterday,
        priority: 'medium',
        completed: false,
      })
      pastTaskId = pastTask._id.toString()

      // Seed a today task
      const todayTask = await Task.create({
        userId: user1._id,
        title: 'Original Today Task',
        date: today,
        priority: 'medium',
        completed: false,
      })
      todayTaskId = todayTask._id.toString()
    })

    it('rejects editing details of a past date task with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${pastTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ title: 'Modified Past Task' }),
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))
    })

    it('rejects toggling completion of a past date task with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${pastTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ completed: true }),
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))
    })

    it('rejects rescheduling an existing today task to a past date with 403 Forbidden', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const pastDate = shiftDays(today, -2)

      const res = await fetch(`${baseUrl}/api/tasks/${todayTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ date: pastDate }),
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))
    })

    it('allows modifying title and completion of today task (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${todayTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ title: 'Updated Today Task', completed: true }),
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.task.completed, true)
      assert.strictEqual(data.data.task.title, 'Updated Today Task')
    })

    it('allows rescheduling today task to a future date (200 OK)', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const futureDate = shiftDays(today, 3)

      const res = await fetch(`${baseUrl}/api/tasks/${todayTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ date: futureDate }),
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.task.date, futureDate)
    })
  })

  // ----------------------------------------------------
  // 3. Task Deletion Rules
  // ----------------------------------------------------
  describe('3. Task Deletion Rules', () => {
    let pastTaskId
    let deletableTaskId

    before(async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const yesterday = shiftDays(today, -1)

      const pastTask = await Task.create({
        userId: user1._id,
        title: 'Past Task To Delete',
        date: yesterday,
      })
      pastTaskId = pastTask._id.toString()

      const deletableTask = await Task.create({
        userId: user1._id,
        title: 'Today Task To Delete',
        date: today,
      })
      deletableTaskId = deletableTask._id.toString()
    })

    it('rejects deleting a past date task with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${pastTaskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))

      // Ensure it still exists in the database
      const exists = await Task.findById(pastTaskId)
      assert.ok(exists)
    })

    it('allows deleting a today task with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/tasks/${deletableTaskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)

      // Ensure it is removed from the database
      const exists = await Task.findById(deletableTaskId)
      assert.strictEqual(exists, null)
    })
  })

  // ----------------------------------------------------
  // 4. Reading Historical Tasks (Permitted)
  // ----------------------------------------------------
  describe('4. Historical Task Reading (Permitted)', () => {
    it('allows querying and viewing historical tasks with 200 OK', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const yesterday = shiftDays(today, -1)

      const res = await fetch(`${baseUrl}/api/tasks?date=${yesterday}`, {
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.ok(Array.isArray(data.data.tasks))
      assert.ok(data.data.tasks.length >= 1)
      assert.strictEqual(data.data.tasks[0].date, yesterday)
    })
  })

  // ----------------------------------------------------
  // 5. Daily Journal / Review Rules
  // ----------------------------------------------------
  describe('5. Daily Journal / Review Rules', () => {
    let pastReviewId
    let todayReviewId

    before(async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const yesterday = shiftDays(today, -1)

      // Seed a historical review directly into DB
      const pastRev = await DailyReview.create({
        userId: user1._id,
        date: yesterday,
        mood: 'Good',
        accomplishments: 'Historical accomplishments',
      })
      pastReviewId = pastRev._id.toString()
    })

    it('rejects creating or saving a review for a past date with 403 Forbidden', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const twoDaysAgo = shiftDays(today, -2)

      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          date: twoDaysAgo,
          mood: 'Okay',
          accomplishments: 'Did something two days ago',
        }),
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))
    })

    it('allows creating and saving a review for today (200 OK)', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')

      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          date: today,
          mood: 'Excellent',
          accomplishments: 'Had an awesome productive day today',
        }),
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.review.mood, 'Excellent')
      todayReviewId = data.data.review.id || data.data.review._id
    })

    it('rejects modifying a historical daily review with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${pastReviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ accomplishments: 'Tampered historical accomplishment' }),
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))
    })

    it('rejects deleting a historical daily review with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${pastReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.success, false)
      assert.ok(data.message.includes('read-only'))

      // Ensure it still exists
      const exists = await DailyReview.findById(pastReviewId)
      assert.ok(exists)
    })

    it('allows reading historical daily reviews with 200 OK', async () => {
      const today = getTodayInTimezone('Asia/Kolkata')
      const yesterday = shiftDays(today, -1)

      const res = await fetch(`${baseUrl}/api/reviews?date=${yesterday}`, {
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.reviews.length, 1)
      assert.strictEqual(data.data.reviews[0].date, yesterday)
    })

    it('allows modifying today daily review (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${todayReviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ mood: 'Good', accomplishments: 'Updated today review' }),
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.review.mood, 'Good')
    })

    it('allows deleting today daily review (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/reviews/${todayReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)

      const exists = await DailyReview.findById(todayReviewId)
      assert.strictEqual(exists, null)
    })
  })

  // ----------------------------------------------------
  // 6. Timezone Awareness
  // ----------------------------------------------------
  describe('6. Timezone Dynamic Resolution', () => {
    it('uses the authenticated user timezone to determine historical boundary', async () => {
      // User 2 is in America/New_York
      const nyToday = getTodayInTimezone('America/New_York')
      const nyYesterday = shiftDays(nyToday, -1)

      // User 2 cannot create on their yesterday
      const resPast = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({
          title: 'User 2 Yesterday Task',
          date: nyYesterday,
        }),
      })

      assert.strictEqual(resPast.status, 403)

      // User 2 can create on their today
      const resToday = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({
          title: 'User 2 Today Task',
          date: nyToday,
        }),
      })

      assert.strictEqual(resToday.status, 201)
    })
  })
})
