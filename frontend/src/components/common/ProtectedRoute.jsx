import { Navigate, Outlet, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <img
            src={logo}
            alt="DayTrack"
            className="w-14 h-14 object-contain animate-pulse drop-shadow-md"
          />
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Restoring DayTrack session...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <img
            src={logo}
            alt="DayTrack"
            className="w-14 h-14 object-contain animate-pulse drop-shadow-md"
          />
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading DayTrack...</span>
          </div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
