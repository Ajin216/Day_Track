import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { SelectedDateProvider } from './context/SelectedDateContext'
import { TaskProvider } from './context/TaskContext'
import { DailyReviewProvider } from './context/DailyReviewContext'
import { MonthlyGoalProvider } from './context/MonthlyGoalContext'
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import PageLoader from './components/common/PageLoader'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'

// Production Code-Splitting: Lazy-load major secondary pages to minimize initial JavaScript bundle size
const Calendar = lazy(() => import('./pages/Calendar'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Journal = lazy(() => import('./pages/Journal'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Settings = lazy(() => import('./pages/Settings'))

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SelectedDateProvider>
          <TaskProvider>
            <DailyReviewProvider>
              <MonthlyGoalProvider>
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public / Guest Routes (Redirect to /dashboard if already logged in) */}
                      <Route element={<GuestRoute />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                      </Route>

                      {/* Protected Application Routes (Require Authentication) */}
                      <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                          <Route index element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/tasks" element={<Tasks />} />
                          <Route path="/journal" element={<Journal />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/achievements" element={<Achievements />} />
                          <Route path="/settings" element={<Settings />} />
                        </Route>
                      </Route>

                      {/* Catch-all redirect */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </MonthlyGoalProvider>
            </DailyReviewProvider>
          </TaskProvider>
        </SelectedDateProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
