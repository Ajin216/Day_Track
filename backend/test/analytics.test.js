import test from 'node:test'
import assert from 'node:assert'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import app from '../server.js'
import { User } from '../models/User.js'
import { Task } from '../models/Task.js'
import { DailyReview } from '../models/DailyReview.js'
import { connectDB } from '../config/db.js'

dotenv.config()

const TEST_PORT = 5056
const BASE_URL = `http://localhost:${TEST_PORT}`

let server
let user1Cookie = ''
let user1Id = ''
let user2Cookie = ''
let user2Id = ''

// Helper to extract cookie from fetch response
function getCookieHeader(res) {
  const rawCookie = res.headers.get('set-cookie')
  if (!rawCookie) return ''
  return rawCookie.split(';')[0]
}

test('Step 8A Analytics Verification Suite', async (t) => {
  // Setup: start server and connect to DB
  await t.test('1. Setup Test Server & Database', async () => {
    await connectDB()
    server = app.listen(TEST_PORT)
    assert.ok(server)
  })

  await t.test('2. Clean Test Collections & Create Test Users', async () => {
    await Task.deleteMany({ title: { $regex: /^Analytics Test/ } })
    await DailyReview.deleteMany({ accomplishments: { $regex: /^Analytics/ } })
    await User.deleteMany({ email: { $in: ['analytics.user1@daytrack.app', 'analytics.user2@daytrack.app'] } })

    // Register User 1
    const res1 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Analytics User 1',
        email: 'analytics.user1@daytrack.app',
        password: 'Password123!',
        timezone: 'UTC',
      }),
    })
    assert.strictEqual(res1.status, 201)
    const data1 = await res1.json()
    user1Id = data1.data.user.id
    user1Cookie = getCookieHeader(res1)
    assert.ok(user1Cookie)

    // Register User 2 for isolation tests
    const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Analytics User 2',
        email: 'analytics.user2@daytrack.app',
        password: 'Password123!',
        timezone: 'UTC',
      }),
    })
    assert.strictEqual(res2.status, 201)
    const data2 = await res2.json()
    user2Id = data2.data.user.id
    user2Cookie = getCookieHeader(res2)
    assert.ok(user2Cookie)
  })

  // 11. Unauthenticated access
  await t.test('3. Unauthenticated Access Protection (Returns 401)', async () => {
    const endpoints = [
      '/api/analytics/overview',
      '/api/analytics/weekly',
      '/api/analytics/monthly',
    ]

    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}${ep}`)
      assert.strictEqual(res.status, 401, `${ep} must reject unauthenticated requests with 401`)
      const data = await res.json()
      assert.strictEqual(data.success, false)
    }
  })

  // 4 & 5. Empty States & Zero Tasks Handling
  await t.test('4. Empty State Analytics (Zero tasks & zero reviews)', async () => {
    // Overview for user with no tasks
    const overviewRes = await fetch(`${BASE_URL}/api/analytics/overview`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(overviewRes.status, 200)
    const overviewData = await overviewRes.json()
    assert.strictEqual(overviewData.success, true)
    assert.strictEqual(overviewData.data.totalTasks, 0)
    assert.strictEqual(overviewData.data.completedTasks, 0)
    assert.strictEqual(overviewData.data.pendingTasks, 0)
    assert.strictEqual(overviewData.data.completionPercentage, 0)
    assert.strictEqual(overviewData.data.currentStreak, 0)
    assert.strictEqual(overviewData.data.longestStreak, 0)
    assert.strictEqual(overviewData.data.totalReviews, 0)

    // Weekly for empty week (2026-11-02 to 2026-11-08)
    const weeklyRes = await fetch(`${BASE_URL}/api/analytics/weekly?startDate=2026-11-02&endDate=2026-11-08`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(weeklyRes.status, 200)
    const weeklyData = await weeklyRes.json()
    assert.strictEqual(weeklyData.data.totalTasks, 0)
    assert.strictEqual(weeklyData.data.activeDaysCount, 0)
    assert.strictEqual(weeklyData.data.days.length, 7)
    // Empty days must not count as 0% productivity in day completionPercentage (should be null)
    assert.strictEqual(weeklyData.data.days[0].completionPercentage, null)
    assert.strictEqual(weeklyData.data.days[0].totalTasks, 0)

    // Monthly for empty month
    const monthlyRes = await fetch(`${BASE_URL}/api/analytics/monthly?month=2026-11`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(monthlyRes.status, 200)
    const monthlyData = await monthlyRes.json()
    assert.strictEqual(monthlyData.data.totalTasks, 0)
    assert.strictEqual(monthlyData.data.daysWithCompletedTasks, 0)
    assert.strictEqual(monthlyData.data.dailyBreakdown.length, 30) // Nov has 30 days
  })

  // 1, 4, 6. Seed Tasks and Verify Overview & Streak
  await t.test('5. Seed Tasks for User 1 and User 2', async () => {
    // User 1 tasks:
    // Consecutive days with completions:
    // 2026-11-01 (Sun): 1 completed, 0 pending
    // 2026-11-02 (Mon): 2 completed, 1 pending (Work, High & Medium)
    // 2026-11-03 (Tue): 1 completed, 0 pending (Health, Low)
    // 2026-11-04 (Wed): 1 completed, 1 pending (Work, High)
    // Total for User 1: 5 completed, 2 pending = 7 total tasks
    const u1Tasks = [
      { title: 'Analytics Test 1', date: '2026-11-01', priority: 'medium', category: 'General', completed: true },
      { title: 'Analytics Test 2', date: '2026-11-02', priority: 'high', category: 'Work', completed: true },
      { title: 'Analytics Test 3', date: '2026-11-02', priority: 'medium', category: 'Work', completed: true },
      { title: 'Analytics Test 4', date: '2026-11-02', priority: 'low', category: 'Personal', completed: false },
      { title: 'Analytics Test 5', date: '2026-11-03', priority: 'low', category: 'Health', completed: true },
      { title: 'Analytics Test 6', date: '2026-11-04', priority: 'high', category: 'Work', completed: true },
      { title: 'Analytics Test 7', date: '2026-11-04', priority: 'high', category: 'Work', completed: false },
    ]

    for (const t of u1Tasks) {
      await Task.create({ ...t, userId: user1Id })
    }

    // Add 2 daily reviews for User 1
    const u1Reviews = [
      { date: '2026-11-02', mood: 'Good', accomplishments: 'Analytics review 1', improvements: 'None', tomorrowFocus: 'Tasks' },
      { date: '2026-11-03', mood: 'Excellent', accomplishments: 'Analytics review 2', improvements: 'Rest', tomorrowFocus: 'Coding' },
    ]

    for (const r of u1Reviews) {
      await DailyReview.create({ ...r, userId: user1Id })
    }

    // Seed User 2 tasks (isolation check)
    const u2Tasks = [
      { title: 'Analytics Test U2', date: '2026-11-02', priority: 'high', category: 'Secret', completed: true },
      { title: 'Analytics Test U2-2', date: '2026-11-02', priority: 'low', category: 'Secret', completed: true },
    ]
    for (const t of u2Tasks) {
      await Task.create({ ...t, userId: user2Id })
    }
  })

  // 1 & 4. Overview Statistics & Completion Percentage
  await t.test('6. Overview Statistics & Percentage Calculations', async () => {
    // If today is 2026-11-04:
    // Completed dates: 2026-11-01, 2026-11-02, 2026-11-03, 2026-11-04 (4 consecutive days)
    const res = await fetch(`${BASE_URL}/api/analytics/overview?date=2026-11-04`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(res.status, 200)
    const data = await res.json()
    assert.strictEqual(data.success, true)

    const ov = data.data
    assert.strictEqual(ov.totalTasks, 7)
    assert.strictEqual(ov.completedTasks, 5)
    assert.strictEqual(ov.pendingTasks, 2)
    // 5 / 7 * 100 = 71.428... -> 71.4
    assert.strictEqual(ov.completionPercentage, 71.4)
    assert.strictEqual(ov.totalReviews, 2)
    assert.strictEqual(ov.currentStreak, 4)
    assert.strictEqual(ov.longestStreak, 4)
  })

  // 6. Streak Calculations Edge Cases
  await t.test('7. Streak Calculations (Active today, active yesterday, broken)', async () => {
    // Case A: reference date is 2026-11-05 (has no completed task yet, but yesterday 11-04 does)
    // Streak should still be active: 4 days!
    const resYesterday = await fetch(`${BASE_URL}/api/analytics/overview?date=2026-11-05`, {
      headers: { Cookie: user1Cookie },
    })
    const dataYesterday = await resYesterday.json()
    assert.strictEqual(dataYesterday.data.currentStreak, 4, 'Streak must be 4 when active through yesterday')

    // Case B: reference date is 2026-11-06 (neither 11-06 nor 11-05 has tasks)
    // Streak is broken: 0!
    const resBroken = await fetch(`${BASE_URL}/api/analytics/overview?date=2026-11-06`, {
      headers: { Cookie: user1Cookie },
    })
    const dataBroken = await resBroken.json()
    assert.strictEqual(dataBroken.data.currentStreak, 0, 'Streak must be 0 after broken calendar gap')
  })

  // 2. Weekly Statistics & 7-Day Velocity
  await t.test('8. Weekly Statistics (7-day activity & day metrics)', async () => {
    // Week of 2026-11-04: Monday 2026-11-02 to Sunday 2026-11-08
    const res = await fetch(`${BASE_URL}/api/analytics/weekly?date=2026-11-04`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(res.status, 200)
    const { data: w } = await res.json()

    assert.strictEqual(w.startDate, '2026-11-02')
    assert.strictEqual(w.endDate, '2026-11-08')
    assert.strictEqual(w.days.length, 7)

    // User 1 tasks in this week:
    // Mon 11-02: 3 tasks (2 completed, 1 pending) -> 66.7%
    // Tue 11-03: 1 task (1 completed, 0 pending) -> 100%
    // Wed 11-04: 2 tasks (1 completed, 1 pending) -> 50%
    // Thu 11-05 to Sun 11-08: 0 tasks -> null completionPercentage
    // Week total: 6 tasks, 4 completed, 2 pending -> 66.7%
    assert.strictEqual(w.totalTasks, 6)
    assert.strictEqual(w.completedTasks, 4)
    assert.strictEqual(w.pendingTasks, 2)
    assert.strictEqual(w.completionPercentage, 66.7)
    assert.strictEqual(w.activeDaysCount, 3)
    assert.strictEqual(w.productiveDaysCount, 3)

    // Check individual days
    const mon = w.days.find((d) => d.date === '2026-11-02')
    assert.ok(mon)
    assert.strictEqual(mon.totalTasks, 3)
    assert.strictEqual(mon.completedTasks, 2)
    assert.strictEqual(mon.pendingTasks, 1)
    assert.strictEqual(mon.completionPercentage, 66.7)

    const tue = w.days.find((d) => d.date === '2026-11-03')
    assert.ok(tue)
    assert.strictEqual(tue.totalTasks, 1)
    assert.strictEqual(tue.completedTasks, 1)
    assert.strictEqual(tue.completionPercentage, 100.0)

    const thu = w.days.find((d) => d.date === '2026-11-05')
    assert.ok(thu)
    assert.strictEqual(thu.totalTasks, 0)
    assert.strictEqual(thu.completedTasks, 0)
    assert.strictEqual(thu.completionPercentage, null, 'Empty days must have null completion percentage')
  })

  // 3. Monthly Statistics, Distributions & Breakdown
  await t.test('9. Monthly Statistics (Priority, Category, and Days with Completed Tasks)', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/monthly?month=2026-11`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(res.status, 200)
    const { data: m } = await res.json()

    assert.strictEqual(m.month, '2026-11')
    assert.strictEqual(m.totalTasks, 7)
    assert.strictEqual(m.completedTasks, 5)
    assert.strictEqual(m.pendingTasks, 2)
    assert.strictEqual(m.completionPercentage, 71.4)
    // Days with at least 1 completed task: 11-01, 11-02, 11-03, 11-04 = 4 days
    assert.strictEqual(m.daysWithCompletedTasks, 4)

    // Priority Distribution:
    // High: 3 tasks (2 completed, 1 pending) -> 3/7 = 42.9%
    // Medium: 2 tasks (2 completed, 0 pending) -> 2/7 = 28.6%
    // Low: 2 tasks (1 completed, 1 pending) -> 2/7 = 28.6%
    assert.strictEqual(m.priorityDistribution.counts.high, 3)
    assert.strictEqual(m.priorityDistribution.counts.medium, 2)
    assert.strictEqual(m.priorityDistribution.counts.low, 2)
    assert.strictEqual(m.priorityDistribution.percentages.high, 42.9)

    // Category Distribution:
    // Work: 4 tasks (3 completed, 1 pending) -> 4/7 = 57.1%
    // General: 1 task
    // Personal: 1 task
    // Health: 1 task
    const workCat = m.categoryDistribution.find((c) => c.category === 'Work')
    assert.ok(workCat)
    assert.strictEqual(workCat.total, 4)
    assert.strictEqual(workCat.completed, 3)
    assert.strictEqual(workCat.pending, 1)
    assert.strictEqual(workCat.percentage, 57.1)
    assert.strictEqual(workCat.completionPercentage, 75.0)

    // Daily breakdown for full month (30 days)
    assert.strictEqual(m.dailyBreakdown.length, 30)
    const day1 = m.dailyBreakdown[0]
    assert.strictEqual(day1.date, '2026-11-01')
    assert.strictEqual(day1.dayOfMonth, 1)
    assert.strictEqual(day1.totalTasks, 1)
    assert.strictEqual(day1.completedTasks, 1)
  })

  // 7. Rescheduled Task Calculations
  await t.test('10. Rescheduled Tasks Update Analytics to New Date', async () => {
    // Find User 1 task on 2026-11-04 that is pending
    const getTasksRes = await fetch(`${BASE_URL}/api/tasks?date=2026-11-04&completed=false`, {
      headers: { Cookie: user1Cookie },
    })
    const taskJson = await getTasksRes.json()
    const taskToMove = taskJson.data.tasks[0]
    assert.ok(taskToMove)

    // Set task date to 2026-11-08 (same week, non-historical) so PATCH is allowed by historical policy
    await Task.updateOne({ _id: taskToMove.id }, { date: '2026-11-08' })

    // Reschedule to 2026-11-09 (next week)
    const moveRes = await fetch(`${BASE_URL}/api/tasks/${taskToMove.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ date: '2026-11-09' }),
    })
    assert.strictEqual(moveRes.status, 200)

    // Weekly analytics for week 2026-11-02 to 2026-11-08 should now have 5 tasks instead of 6
    const resOldWeek = await fetch(`${BASE_URL}/api/analytics/weekly?date=2026-11-04`, {
      headers: { Cookie: user1Cookie },
    })
    const { data: oldW } = await resOldWeek.json()
    assert.strictEqual(oldW.totalTasks, 5, 'Rescheduled task must be removed from old week')

    // Weekly analytics for new week (2026-11-09) should now have 1 task
    const resNewWeek = await fetch(`${BASE_URL}/api/analytics/weekly?date=2026-11-09`, {
      headers: { Cookie: user1Cookie },
    })
    const { data: newW } = await resNewWeek.json()
    assert.strictEqual(newW.totalTasks, 1, 'Rescheduled task must appear in new week')
    assert.strictEqual(newW.days[0].date, '2026-11-09')
    assert.strictEqual(newW.days[0].totalTasks, 1)
  })

  // 8. Date Boundaries (Month boundary spanning)
  await t.test('11. Date Boundaries & Month Transition Handling', async () => {
    // A 7-day range spanning across month boundary: Oct 28 to Nov 3, 2026
    const res = await fetch(`${BASE_URL}/api/analytics/weekly?startDate=2026-10-28&endDate=2026-11-03`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(res.status, 200)
    const { data: b } = await res.json()
    assert.strictEqual(b.days.length, 7)
    assert.strictEqual(b.days[0].date, '2026-10-28')
    assert.strictEqual(b.days[3].date, '2026-10-31')
    assert.strictEqual(b.days[4].date, '2026-11-01')
    assert.strictEqual(b.days[6].date, '2026-11-03')
  })

  // 9. Validation of Invalid Query Parameters (400 Bad Request)
  await t.test('12. Validation & Error Handling (Invalid Query Parameters)', async () => {
    // Invalid date format
    const r1 = await fetch(`${BASE_URL}/api/analytics/overview?date=invalid-date`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(r1.status, 400)
    const d1 = await r1.json()
    assert.strictEqual(d1.success, false)

    // Invalid month format
    const r2 = await fetch(`${BASE_URL}/api/analytics/monthly?month=2026-13`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(r2.status, 400)

    // startDate after endDate
    const r3 = await fetch(`${BASE_URL}/api/analytics/weekly?startDate=2026-11-10&endDate=2026-11-05`, {
      headers: { Cookie: user1Cookie },
    })
    assert.strictEqual(r3.status, 400)
  })

  // 10. User Data Isolation
  await t.test('13. User Data Isolation (User 2 Cannot See User 1 Analytics)', async () => {
    // User 2 overview: should only reflect User 2's tasks (2 tasks, 2 completed)
    const resU2 = await fetch(`${BASE_URL}/api/analytics/overview`, {
      headers: { Cookie: user2Cookie },
    })
    assert.strictEqual(resU2.status, 200)
    const { data: u2Data } = await resU2.json()
    assert.strictEqual(u2Data.totalTasks, 2)
    assert.strictEqual(u2Data.completedTasks, 2)
    assert.strictEqual(u2Data.pendingTasks, 0)
    assert.strictEqual(u2Data.totalReviews, 0, 'User 1 reviews must not leak to User 2')

    // Monthly category distribution for User 2: should only have 'Secret', NOT 'Work' or 'Personal'
    const resU2Month = await fetch(`${BASE_URL}/api/analytics/monthly?month=2026-11`, {
      headers: { Cookie: user2Cookie },
    })
    const { data: u2Month } = await resU2Month.json()
    assert.strictEqual(u2Month.categoryDistribution.length, 1)
    assert.strictEqual(u2Month.categoryDistribution[0].category, 'Secret')
    assert.strictEqual(u2Month.totalTasks, 2)
  })

  // Teardown
  await t.test('14. Teardown Server & Cleanup', async () => {
    await Task.deleteMany({ title: { $regex: /^Analytics Test/ } })
    await DailyReview.deleteMany({ accomplishments: { $regex: /^Analytics/ } })
    await User.deleteMany({ email: { $in: ['analytics.user1@daytrack.app', 'analytics.user2@daytrack.app'] } })
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.connection.close()
  })
})
