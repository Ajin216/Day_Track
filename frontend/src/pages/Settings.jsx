import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Shield,
  Globe,
  LogOut,
  CheckCircle2,
} from 'lucide-react'
import ThemeToggle from '../components/common/ThemeToggle'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()

  // Smoothly scroll to target section if URL contains hash (e.g. /settings#account)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [location.hash])

  const memberSinceFormatted = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Session'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Settings & Preferences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account identity, theme appearance, timezone preferences, and session security.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Section 1: My Account */}
        <section
          id="account"
          aria-labelledby="account-heading"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs scroll-mt-20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="account-heading"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  My Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your personal identity and profile credentials.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="account-name"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Full Name
              </label>
              <input
                id="account-name"
                type="text"
                readOnly
                value={user?.name || ''}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-default"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="account-email"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Email Address
              </label>
              <input
                id="account-email"
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-default"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="account-member-since"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Member Since
              </label>
              <input
                id="account-member-since"
                type="text"
                readOnly
                value={memberSinceFormatted}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-default"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="account-id"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Account ID
              </label>
              <input
                id="account-id"
                type="text"
                readOnly
                value={user?.id || ''}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 focus:outline-none cursor-default"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Appearance */}
        <section
          id="appearance"
          aria-labelledby="appearance-heading"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs scroll-mt-20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="appearance-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize your visual theme. Changes persist in local storage and apply across DayTrack.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Interface Color Mode
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                Active theme:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">{theme}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Toggle mode:
              </span>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Section 3: Preferences */}
        <section
          id="preferences"
          aria-labelledby="preferences-heading"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs scroll-mt-20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="preferences-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timezone and calendar display configurations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Configured Timezone
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {user?.timezone || 'Asia/Kolkata'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Used for streak tracking and analytics boundaries.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Calendar Week Start
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Monday
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Standard ISO 8601 week formatting across all views.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Security */}
        <section
          id="security"
          aria-labelledby="security-heading"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs scroll-mt-20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="security-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Security & Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active session and security parameters protecting your DayTrack account.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    HTTP-Only Cookie Session
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Protected against XSS and cross-site scripting token theft.
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    CSRF Mutation Protection
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Origin, Referer, and Sec-Fetch-Site validation on state-changing requests.
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Enforced
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
