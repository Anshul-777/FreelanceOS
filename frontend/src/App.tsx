import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { AppLayout } from './components/Layout/AppLayout'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import ProjectsPage       from './pages/ProjectsPage'
import ProjectDetailPage  from './pages/ProjectDetailPage'
import ClientsPage     from './pages/ClientsPage'
import TimeTrackerPage from './pages/TimeTrackerPage'
import InvoicesPage    from './pages/InvoicesPage'
import ExpensesPage    from './pages/ExpensesPage'
import AnalyticsPage   from './pages/AnalyticsPage'
import SettingsPage    from './pages/SettingsPage'
import LandingPage     from './pages/LandingPage.tsx'
import RegisterPage    from './pages/RegisterPage.tsx'
import NotFoundPage    from './pages/NotFoundPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Redirects for legacy routes */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/projects"  element={<Navigate to="/app/projects" replace />} />
        <Route path="/clients"   element={<Navigate to="/app/clients" replace />} />
        <Route path="/invoices"  element={<Navigate to="/app/invoices" replace />} />
        <Route path="/expenses"  element={<Navigate to="/app/expenses" replace />} />
        <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
        <Route path="/settings"  element={<Navigate to="/app/settings" replace />} />
        <Route path="/time"      element={<Navigate to="/app/time" replace />} />

        <Route path="/app" element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }>
          <Route index           element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects"  element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="clients"   element={<ClientsPage />} />
          <Route path="time"      element={<TimeTrackerPage />} />
          <Route path="invoices"  element={<InvoicesPage />} />
          <Route path="expenses"  element={<ExpensesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings"  element={<SettingsPage />} />
          <Route path="*"         element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
