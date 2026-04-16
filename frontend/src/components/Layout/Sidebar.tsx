import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Users, Clock,
  FileText, Receipt, BarChart3, Settings,
  ChevronLeft, Zap, LogOut, Timer,
} from 'lucide-react'
import { useAuthStore, useUIStore } from '../../store'
import { classNames, getInitials, getAvatarColor, formatDuration } from '../../utils'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { to: '/app/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/app/projects',   label: 'Projects',     icon: FolderKanban },
  { to: '/app/clients',    label: 'Clients',      icon: Users },
  { to: '/app/time',       label: 'Time Tracker', icon: Clock },
  { to: '/app/invoices',   label: 'Invoices',     icon: FileText },
  { to: '/app/expenses',   label: 'Expenses',     icon: Receipt },
  { to: '/app/analytics',  label: 'Analytics',    icon: BarChart3 },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, activeTimer } = useUIStore()
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeTimer.running || !activeTimer.startTime) { setElapsed(0); return }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (activeTimer.startTime ?? 0)) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimer.running, activeTimer.startTime])

  const handleLogout = () => { logout(); navigate('/') }

  const initials = user ? getInitials(user.full_name) : '?'
  const avatarColor = user ? getAvatarColor(user.full_name) : '#4F46E5'

  return (
    <aside className={classNames(
      'fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 flex flex-col transition-all duration-300 shadow-sm',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand flex-shrink-0">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-700 text-slate-900 text-[17px] tracking-tight">
              Freelance<span className="text-brand-600">OS</span>
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand mx-auto">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
        )}
        {!sidebarCollapsed && (
          <button onClick={toggleSidebar}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <button onClick={toggleSidebar}
          title="Expand sidebar"
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-slate-900 z-50">
          <ChevronLeft size={12} className="rotate-180" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {!sidebarCollapsed && (
          <p className="px-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={sidebarCollapsed ? label : undefined}
            className={({ isActive }) => classNames(
              sidebarCollapsed ? 'sidebar-link justify-center px-0 w-10 h-10 mx-auto' : 'sidebar-link',
              isActive ? '!bg-brand-50 !text-brand-700 font-semibold' : ''
            )}>
            <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Active Timer Banner */}
      {activeTimer.running && !sidebarCollapsed && (
        <div className="mx-3 mb-3">
          <div className="bg-brand-600 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-brand-100">Timer Running</span>
            </div>
            <p className="text-sm font-medium truncate">{activeTimer.projectName || 'No project'}</p>
            <p className="font-mono text-xl font-bold mt-0.5">
              {formatDuration(Math.floor(elapsed / 60))}
            </p>
          </div>
        </div>
      )}

      {activeTimer.running && sidebarCollapsed && (
        <div className="mx-auto mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <Timer size={16} className="text-white" />
          </div>
        </div>
      )}

      {/* Bottom: settings + user */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-0.5 flex-shrink-0">
        <NavLink to="/app/settings" title={sidebarCollapsed ? 'Settings' : undefined}
          className={({ isActive }) => classNames(
            sidebarCollapsed ? 'sidebar-link justify-center px-0 w-10 h-10 mx-auto' : 'sidebar-link',
            isActive ? '!bg-brand-50 !text-brand-700 font-semibold' : ''
          )}>
          <Settings size={18} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>

        <button onClick={handleLogout} title={sidebarCollapsed ? 'Log out' : undefined}
          className={classNames(
            'w-full text-left text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-150 rounded-xl',
            sidebarCollapsed ? 'flex items-center justify-center px-0 w-10 h-10 mx-auto' : 'sidebar-link'
          )}>
          <LogOut size={18} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Log out</span>}
        </button>

        {/* User Profile */}
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-2 py-3 mt-1 rounded-xl hover:bg-slate-50 cursor-pointer"
            onClick={() => navigate('/app/settings')}>
            <div className="avatar w-8 h-8 text-sm flex-shrink-0"
              style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
