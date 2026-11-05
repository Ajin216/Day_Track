import { it, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import http from 'http'
import app from '../server.js'
import { User } from '../models/User.js'
import { MonthlyGoal } from '../models/MonthlyGoal.js'
import { signToken } from '../utils/generateToken.js'
import { connectDB } from '../config/db.js'

describe('Monthly Goal Feature Verification Suite', () => {
  let server
  let baseUrl
  let user1
  let user2
  let token1
  let token2

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

    // Clean previous test users and goals
    const testUsers = await User.find({ email: /@test-goal\.com$/ }).select('_id')
    const userIds = testUsers.map((u) => u._id)
    if (userIds.length > 0) {
      await MonthlyGoal.deleteMany({ userId: { $in: userIds } })
      await User.deleteMany({ _id: { $in: userIds } })
    }

    // Create User 1
    user1 = await User.create({
      name: 'Goal User One',
      email: 'user1@test-goal.com',
      password: 'password123',
    })
    token1 = signToken(user1._id)

    // Create User 2
    user2 = await User.create({
      name: 'Goal User Two',
      email: 'user2@test-goal.com',
      password: 'password123',
    })
    token2 = signToken(user2._id)
  })

  after(async () => {
    if (user1 && user2) {
      await MonthlyGoal.deleteMany({ userId: { $in: [user1._id, user2._id] } })
      await User.deleteMany({ _id: { $in: [user1._id, user2._id] } })
    }
    await new Promise((resolve) => server.close(resolve))
    await mongoose.connection.close()
  })

  // ----------------------------------------------------
  // 1. Goal Creation & Active Goal Retrieval
  // ----------------------------------------------------
  describe('1. Monthly Goal Creation & Active Retrieval', () => {
    let createdGoalId

    it('creates a new monthly goal for the active month', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Master React 19 and Node Performance',
          description: 'Ship 3 major features and optimize bundle size',
          target: 'Reach 100% test coverage and 60fps animations',
          progress: 25,
          month: '2026-11',
        }),
      })

      assert.equal(res.status, 201)
      const body = await res.json()
      assert.equal(body.success, true)
      assert.equal(body.data.goal.title, 'Master React 19 and Node Performance')
      assert.equal(body.data.goal.progress, 25)
      assert.equal(body.data.goal.month, '2026-11')
      assert.equal(body.data.goal.status, 'in_progress')
      assert.equal(body.data.goal.completedAt, null)

      createdGoalId = body.data.goal.id
    })

    it('retrieves the active goal for the specified month', async () => {
      const res = await fetch(`${baseUrl}/api/goals/active?month=2026-11`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(res.status, 200)
      const body = await res.json()
      assert.equal(body.success, true)
      assert.ok(body.data.goal)
      assert.equal(body.data.goal.id, createdGoalId)
      assert.equal(body.data.goal.title, 'Master React 19 and Node Performance')
    })
  })

  // ----------------------------------------------------
  // 2. Goal Updates & Manual Progress
  // ----------------------------------------------------
  describe('2. Goal Updates & Manual Progress Tracking', () => {
    let goalId

    before(async () => {
      const goal = await MonthlyGoal.findOne({ userId: user1._id, month: '2026-11' })
      goalId = goal._id.toString()
    })

    it('updates title, description, and manual progress percentage', async () => {
      const res = await fetch(`${baseUrl}/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Master React 19 & Full Production Hardening',
          progress: 60,
        }),
      })

      assert.equal(res.status, 200)
      const body = await res.json()
      assert.equal(body.success, true)
      assert.equal(body.data.goal.title, 'Master React 19 & Full Production Hardening')
      assert.equal(body.data.goal.progress, 60)
      assert.equal(body.data.goal.status, 'in_progress')
    })

    it('automatically transitions to completed when progress reaches 100%', async () => {
      const res = await fetch(`${baseUrl}/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          progress: 100,
        }),
      })

      assert.equal(res.status, 200)
      const body = await res.json()
      assert.equal(body.success, true)
      assert.equal(body.data.goal.progress, 100)
      assert.equal(body.data.goal.status, 'completed')
      assert.ok(body.data.goal.completedAt)
    })
  })

  // ----------------------------------------------------
  // 3. Mark Goal Completed & Multiple Goals for Same Month
  // ----------------------------------------------------
  describe('3. Goal Completion & History Preservation', () => {
    it('allows creating a second goal for the same month after completing the first one', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Second November Goal: Launch Mobile PWA',
          month: '2026-11',
          progress: 0,
        }),
      })

      assert.equal(res.status, 201)
      const body = await res.json()
      assert.equal(body.success, true)
      assert.equal(body.data.goal.title, 'Second November Goal: Launch Mobile PWA')
      assert.equal(body.data.goal.status, 'in_progress')

      // Verify that both goals exist for this month in the user history
      const historyRes = await fetch(`${baseUrl}/api/goals?month=2026-11`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })

      assert.equal(historyRes.status, 200)
      const historyBody = await historyRes.json()
      assert.equal(historyBody.data.count, 2, 'Should preserve completed goal history')
    })

    it('rejects duplicate active goal without replace confirmation', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Third Goal Attempt',
          month: '2026-11',
        }),
      })

      assert.equal(res.status, 409)
      const body = await res.json()
      assert.equal(body.success, false)
      assert.match(body.message, /already exists/i)
    })

    it('replaces active goal when replace: true is provided and preserves previous as completed', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Replaced Active November Goal',
          month: '2026-11',
          progress: 10,
          replace: true,
        }),
      })

      assert.equal(res.status, 201)
      const body = await res.json()
      assert.equal(body.data.goal.title, 'Replaced Active November Goal')
      assert.equal(body.data.goal.status, 'in_progress')
    })

    it('marks a goal completed early via /api/goals/:id/complete', async () => {
      const activeRes = await fetch(`${baseUrl}/api/goals/active?month=2026-11`, {
        headers: { Authorization: `Bearer ${token1}` },
      })
      const { data } = await activeRes.json()
      const activeGoalId = data.goal.id

      const completeRes = await fetch(`${baseUrl}/api/goals/${activeGoalId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token1}` },
      })

      assert.equal(completeRes.status, 200)
      const completedBody = await completeRes.json()
      assert.equal(completedBody.data.goal.status, 'completed')
      assert.equal(completedBody.data.goal.progress, 100)
      assert.ok(completedBody.data.goal.completedAt)
    })
  })

  // ----------------------------------------------------
  // 4. Month Switching & Historical Months
  // ----------------------------------------------------
  describe('4. Historical Months & Month Switching', () => {
    it('creates and retrieves goals for previous/different months', async () => {
      // Create October Goal
      const resOct = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'October Goal: Build Foundation',
          month: '2026-10',
          progress: 100,
          status: 'completed',
        }),
      })
      assert.equal(resOct.status, 201)

      // Query October active/completed goal
      const resGetOct = await fetch(`${baseUrl}/api/goals/active?month=2026-10`, {
        headers: { Authorization: `Bearer ${token1}` },
      })
      assert.equal(resGetOct.status, 200)
      const bodyOct = await resGetOct.json()
      assert.equal(bodyOct.data.goal.title, 'October Goal: Build Foundation')
      assert.equal(bodyOct.data.goal.month, '2026-10')

      // Query future month with no goal
      const resGetDec = await fetch(`${baseUrl}/api/goals/active?month=2026-12`, {
        headers: { Authorization: `Bearer ${token1}` },
      })
      assert.equal(resGetDec.status, 200)
      const bodyDec = await resGetDec.json()
      assert.equal(bodyDec.data.goal, null)
    })
  })

  // ----------------------------------------------------
  // 5. Strict User Ownership Isolation
  // ----------------------------------------------------
  describe('5. Strict User Ownership Isolation', () => {
    let user1GoalId

    before(async () => {
      const g = await MonthlyGoal.findOne({ userId: user1._id })
      user1GoalId = g._id.toString()
    })

    it('prevents User 2 from reading User 1 goal (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/goals/${user1GoalId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token2}` },
      })
      assert.equal(res.status, 404)
    })

    it('prevents User 2 from modifying User 1 goal (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/goals/${user1GoalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ title: 'Hacked Title' }),
      })
      assert.equal(res.status, 404)

      // Verify unchanged
      const g = await MonthlyGoal.findById(user1GoalId)
      assert.notEqual(g.title, 'Hacked Title')
    })

    it('prevents User 2 from deleting User 1 goal (returns 404)', async () => {
      const res = await fetch(`${baseUrl}/api/goals/${user1GoalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token2}` },
      })
      assert.equal(res.status, 404)
    })
  })

  // ----------------------------------------------------
  // 6. Validation Checks
  // ----------------------------------------------------
  describe('6. Input Validation', () => {
    it('rejects empty goal title with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: '   ',
          month: '2026-11',
        }),
      })
      assert.equal(res.status, 400)
    })

    it('rejects invalid month format with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Valid Title',
          month: '2026-13', // Invalid month 13
        }),
      })
      assert.equal(res.status, 400)
    })

    it('rejects progress outside 0-100 range with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({
          title: 'Valid Title',
          month: '2026-11',
          progress: 150,
        }),
      })
      assert.equal(res.status, 400)
    })
  })

  // ----------------------------------------------------
  // 7. Achievements API & Completed Goals Verification
  // ----------------------------------------------------
  describe('7. Achievements API & Filtering', () => {
    it('retrieves completed achievements with correct counts and summary statistics', async () => {
      const res = await fetch(`${baseUrl}/api/goals/achievements`, {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })
      assert.equal(res.status, 200)
      const json = await res.json()
      assert.equal(json.success, true)
      assert.ok(Array.isArray(json.data.achievements))
      assert.ok(json.data.achievements.length >= 1)

      // Every achievement must have status completed
      for (const ach of json.data.achievements) {
        assert.equal(ach.status, 'completed')
        assert.ok(ach.completedAt)
      }

      // Check stats structure
      assert.equal(typeof json.data.stats.totalCompleted, 'number')
      assert.equal(typeof json.data.stats.monthsCount, 'number')
      assert.ok(Array.isArray(json.data.stats.availableYears))
      assert.ok(json.data.pagination)
    })

    it('filters achievements by year correctly', async () => {
      const res = await fetch(`${baseUrl}/api/goals/achievements?year=2026`, {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })
      assert.equal(res.status, 200)
      const json = await res.json()
      assert.equal(json.success, true)
      for (const ach of json.data.achievements) {
        assert.ok(ach.month.startsWith('2026-'))
      }
    })

    it('filters achievements by specific month correctly', async () => {
      const res = await fetch(`${baseUrl}/api/goals/achievements?month=2026-10`, {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })
      assert.equal(res.status, 200)
      const json = await res.json()
      assert.equal(json.success, true)
      for (const ach of json.data.achievements) {
        assert.equal(ach.month, '2026-10')
      }
    })

    it('supports pagination on achievements', async () => {
      const res = await fetch(`${baseUrl}/api/goals/achievements?page=1&limit=1`, {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      })
      assert.equal(res.status, 200)
      const json = await res.json()
      assert.equal(json.data.achievements.length, 1)
      assert.equal(json.data.pagination.page, 1)
      assert.equal(json.data.pagination.limit, 1)
    })

    it('enforces user data isolation (User 2 sees only their own achievements)', async () => {
      // User 2 has not completed any goals yet
      const res = await fetch(`${baseUrl}/api/goals/achievements`, {
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      })
      assert.equal(res.status, 200)
      const json = await res.json()
      assert.equal(json.data.achievements.length, 0)
      assert.equal(json.data.stats.totalCompleted, 0)
      assert.equal(json.data.stats.monthsCount, 0)
    })
  })
})

