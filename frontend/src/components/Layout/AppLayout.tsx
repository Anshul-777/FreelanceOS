import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUIStore } from '../../store'
import { classNames } from '../../utils'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className={classNames(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      )}>
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
