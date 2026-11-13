import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BookOpen,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Daily Journal', href: '/journal', icon: BookOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar({ isMobile = false, onClose }) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (isMobile && onClose) {
      onClose()
    }
    await logout()
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DT'

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors ${
        isMobile ? 'w-72' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800">
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-bold text-lg tracking-tight focus:outline-none"
        >
          <img
            src={logo}
            alt="DayTrack Logo"
            className="w-9 h-9 object-contain drop-shadow-xs"
          />
          <div className="flex flex-col">
            <span className="leading-tight">DayTrack</span>
            <span className="text-[10px] font-medium tracking-normal text-slate-400 dark:text-slate-500 uppercase">
              Productivity
            </span>
          </div>
        </NavLink>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Workspace
        </div>
        {navigationItems.map((item, index) => {
          const Icon = item.icon
          return (
            <NavLink
              key={`${item.name}-${index}`}
              to={item.href}
              end={item.href === '/dashboard'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800/60 flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.name || 'Authenticated User'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {user?.email || ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out of DayTrack"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
