import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Bell,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import ThemeToggle from '../common/ThemeToggle'
import { useAuth } from '../../context/AuthContext'

const titleMap = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/tasks': 'My Tasks',
  '/journal': 'Daily Journal',
  '/analytics': 'Analytics',
  '/achievements': 'Achievements',
  '/settings': 'Settings',
}

export default function Navbar({ onOpenMobileSidebar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const avatarButtonRef = useRef(null)

  const pageTitle = titleMap[location.pathname] || 'Dashboard'

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DT'

  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  // Close dropdown on outside click or Escape key press
  useEffect(() => {
    if (!isDropdownOpen) return

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        avatarButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  const handleNavigate = (path) => {
    setIsDropdownOpen(false)
    navigate(path)

    // If navigating to a hash anchor on the settings page, smoothly scroll to it
    if (path.includes('#')) {
      const hash = path.split('#')[1]
      setTimeout(() => {
        const targetElement = document.getElementById(hash)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    await logout()
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open mobile menu"
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Actions, Notifications, ThemeToggle, User Avatar Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Icon Placeholder */}
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications (Placeholder)"
          onClick={() => alert('Notifications feature will be enabled in future milestones.')}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        {/* User Profile Avatar Dropdown Menu */}
        <div className="relative">
          <button
            ref={avatarButtonRef}
            type="button"
            id="user-avatar-button"
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            aria-controls="user-avatar-menu"
            aria-label={`User menu for ${user?.name || 'User'}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-1 py-1 pr-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-medium text-xs flex items-center justify-center shadow-xs">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
              {firstName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-150 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              id="user-avatar-menu"
              role="menu"
              aria-labelledby="user-avatar-button"
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right focus:outline-none"
            >
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.email || ''}
                </p>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('/settings#account')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>My Account</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>Settings</span>
                </button>
              </div>

              {/* Divider */}
              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              {/* Logout Option */}
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
