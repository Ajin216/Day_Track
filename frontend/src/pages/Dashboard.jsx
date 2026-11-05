import { useMemo, useCallback } from 'react'
import {
  ListTodo,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { useSelectedDate } from '../context/SelectedDateContext'
import { useTasks } from '../context/TaskContext'
import { useDailyReview } from '../context/DailyReviewContext'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatsCard from '../components/dashboard/StatsCard'
import TaskOverview from '../components/dashboard/TaskOverview'
import PriorityBreakdown from '../components/dashboard/PriorityBreakdown'
import WeeklyActivityChart from '../components/dashboard/WeeklyActivityChart'
import DailyFocus from '../components/dashboard/DailyFocus'
import DateIndicator from '../components/common/DateIndicator'

export default function Dashboard() {
  const { selectedDate, setSelectedDate, today, isToday, isHistorical } = useSelectedDate()
  const { getTasksByDate, toggleTaskCompletion } = useTasks()
  const { getReviewByDate } = useDailyReview()

  // Retrieve real user tasks strictly from TaskContext for the active selectedDate
  const tasks = useMemo(() => {
    return getTasksByDate(selectedDate)
  }, [getTasksByDate, selectedDate])

  // Retrieve real user daily review strictly from DailyReviewContext for the active selectedDate
  const review = useMemo(() => {
    return getReviewByDate(selectedDate)
  }, [getReviewByDate, selectedDate])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const pendingTasks = totalTasks - completedTasks

  // Completion percentage calculated dynamically. Safe handling of 0 tasks (no misleading 0% productivity)
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null

  const handleJumpToday = useCallback(() => {
    setSelectedDate(today)
  }, [setSelectedDate, today])

  return (
    <div className="space-y-6">
      {/* 1. Dashboard greeting and selected-date information */}
      <DashboardHeader
        selectedDate={selectedDate}
        isToday={isToday}
        onJumpToday={handleJumpToday}
      />

      {/* Date context alert bar */}
      <DateIndicator compact />

      {/* 2. Overview statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Card */}
        <StatsCard
          title="Total Tasks"
          value={totalTasks}
          subtitle={
            totalTasks === 0
              ? 'No tasks planned'
              : `${totalTasks} scheduled ${totalTasks === 1 ? 'action' : 'actions'}`
          }
          icon={ListTodo}
          variant="blue"
          badge={totalTasks > 0 ? `${totalTasks} items` : null}
          badgeType="info"
        />

        {/* Completed Tasks Card */}
        <StatsCard
          title="Completed Tasks"
          value={completedTasks}
          subtitle={
            completedTasks === 0
              ? '0 tasks finished'
              : `${completedTasks} milestone${completedTasks === 1 ? '' : 's'} done`
          }
          icon={CheckCircle2}
          variant="emerald"
          badge={
            totalTasks > 0 && completedTasks === totalTasks
              ? 'All complete'
              : completedTasks > 0
              ? `${completedTasks} done`
              : null
          }
          badgeType="success"
          progress={completionRate}
        />

        {/* Pending Tasks Card */}
        <StatsCard
          title="Pending Tasks"
          value={pendingTasks}
          subtitle={
            pendingTasks === 0
              ? totalTasks > 0
                ? 'All tasks completed'
                : 'No pending items'
              : `${pendingTasks} remaining ${pendingTasks === 1 ? 'item' : 'items'}`
          }
          icon={Clock}
          variant="amber"
          badge={pendingTasks > 0 ? `${pendingTasks} pending` : null}
          badgeType="warning"
        />

        {/* Daily Completion Rate Card */}
        <StatsCard
          title="Daily Completion Rate"
          value={totalTasks === 0 ? 'No tasks yet' : `${completionRate}%`}
          subtitle={
            totalTasks === 0
              ? 'No tasks scheduled for this day'
              : `${completedTasks} of ${totalTasks} tasks completed`
          }
          icon={TrendingUp}
          variant="indigo"
          badge={
            totalTasks === 0
              ? 'Empty day'
              : completionRate >= 80
              ? 'High velocity'
              : completionRate >= 50
              ? 'On track'
              : 'In progress'
          }
          badgeType={
            totalTasks === 0
              ? 'neutral'
              : completionRate >= 80
              ? 'success'
              : 'info'
          }
          progress={completionRate}
        />
      </div>

      {/* Reorganized Main Dashboard Layout:
          1. Today's Task Overview (Centerpiece, Row 1, 2-cols)
          2. Daily Focus / Self-Review (Row 1, 1-col)
          3. Weekly Activity (Compact, Row 2, 2-cols below Task Overview)
          4. Priority Breakdown (Row 2, 1-col below Daily Focus)
          On mobile (single column), strictly flows:
          Task Overview -> Daily Focus -> Weekly Activity -> Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 3. Today's Task Overview – Largest & Most Prominent Section */}
        <div className="lg:col-span-2">
          <TaskOverview
            tasks={tasks}
            onToggleComplete={isHistorical ? undefined : toggleTaskCompletion}
            isReadOnly={isHistorical}
          />
        </div>

        {/* 4. Daily Focus / Self-Review */}
        <div className="lg:col-span-1">
          <DailyFocus review={review} />
        </div>

        {/* 5. Weekly Activity – Smaller & More Compact (Below Today's Task Overview) */}
        <div className="lg:col-span-2">
          <WeeklyActivityChart selectedDate={selectedDate} />
        </div>

        {/* 6. Priority Breakdown */}
        <div className="lg:col-span-1">
          <PriorityBreakdown tasks={tasks} />
        </div>
      </div>
    </div>
  )
}
