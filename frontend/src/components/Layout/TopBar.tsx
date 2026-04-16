import { Bell, Search, Menu, Plus } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../store'
import { getInitials, getAvatarColor } from '../../utils'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { GlobalSearch } from '../UI/GlobalSearch'

const PAGE_TITLES: Record<string, string> = {
  '/app/dashboard':  'Dashboard',
  '/app/projects':   'Projects',
  '/app/clients':    'Clients',
  '/app/time':       'Time Tracker',
  '/app/invoices':   'Invoices',
  '/app/expenses':   'Expenses',
  '/app/analytics':  'Analytics',
  '/app/settings':   'Settings',
}

export function TopBar() {
  const { toggleSidebar, sidebarCollapsed } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  const pathKey = location.pathname.startsWith('/app') 
    ? '/app/' + (location.pathname.split('/')[2] || 'dashboard')
    : '/' + location.pathname.split('/')[1]
  const pageTitle = PAGE_TITLES[pathKey] || 'FreelanceOS'

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const initials = user ? getInitials(user.full_name) : '?'
  const avatarColor = user ? getAvatarColor(user.full_name) : '#4F46E5'

  const quickActions: Record<string, { label: string; path: string }> = {
    '/app/projects':  { label: 'New Project',  path: '/app/projects?new=1' },
    '/app/clients':   { label: 'New Client',   path: '/app/clients?new=1' },
    '/app/invoices':  { label: 'New Invoice',  path: '/app/invoices?new=1' },
    '/app/expenses':  { label: 'New Expense',  path: '/app/expenses?new=1' },
    '/app/time':      { label: 'Log Time',     path: '/app/time?log=1' },
  }
  const qa = quickActions[pathKey]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-30 sticky top-0">
      {/* Mobile menu */}
      <button
        onClick={toggleSidebar}
        title="Toggle sidebar"
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500">
        <Menu size={20} />
      </button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-slate-900 font-display tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
          <Search size={14} />
          <span className="hidden md:block">Search…</span>
          <kbd className="hidden md:flex items-center gap-0.5 text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-2">
            ⌘K
          </kbd>
        </button>

        {qa && (
          <button
            onClick={() => navigate(qa.path)}
            className="btn-primary py-2 px-3.5 text-xs hidden sm:flex">
            <Plus size={15} strokeWidth={2.5} />
            {qa.label}
          </button>
        )}

        {/* Notifications (cosmetic) */}
        <button 
          title="Notifications"
          className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full border border-white" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/app/settings')}
          title="User settings"
          className="avatar w-9 h-9 text-sm hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-brand-300 ring-offset-1"
          style={{ backgroundColor: avatarColor }}>
          {initials}
        </button>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
