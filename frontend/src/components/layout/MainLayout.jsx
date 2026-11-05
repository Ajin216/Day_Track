import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import DataMigrationBanner from '../common/DataMigrationBanner'
import MonthlyGoalBanner from '../goals/MonthlyGoalBanner'

export default function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleOpenMobile = () => setMobileSidebarOpen(true)
  const handleCloseMobile = () => setMobileSidebarOpen(false)

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseMobile}
            aria-hidden="true"
          />

          {/* Sliding drawer */}
          <div className="relative flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <Sidebar isMobile onClose={handleCloseMobile} />
          </div>
        </div>
      )}

      {/* Content Column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar onOpenMobileSidebar={handleOpenMobile} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <DataMigrationBanner />
            <MonthlyGoalBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
